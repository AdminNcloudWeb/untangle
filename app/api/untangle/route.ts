import { NextRequest, NextResponse } from "next/server";
import { cleanThread } from "@/lib/clean-thread";

export const maxDuration = 60;

const TONES = {
  direct: "Direct: get to the point, no padding. State positions and asks plainly. Short sentences.",
  diplomatic:
    "Diplomatic: warm and tactful. Acknowledge everyone's concerns, soften disagreement, keep doors open.",
  "buy-time":
    "Buy Time: polite and non-committal. Acknowledge the thread, promise a considered response by a stated time, commit to nothing else.",
} as const;

type Tone = keyof typeof TONES;

interface UntangleResult {
  participants: { name: string; wants: string }[];
  decided: string[];
  open: string[];
  reply: string;
}

const MAX_THREAD_CHARS = 60_000;

function buildPrompt(thread: string, tone: Tone): string {
  return `You are Untangle, a tool that makes sense of messy email threads.

Analyze the email thread below, then respond with ONLY a JSON object — no markdown, no code fences, no commentary — in exactly this shape:

{
  "participants": [{ "name": "person or role", "wants": "what they want, one short line" }],
  "decided": ["things the thread has settled"],
  "open": ["questions still open or items blocking progress"],
  "reply": "a drafted reply the user can send"
}

Rules:
- One entry per participant; a single short line for "wants".
- "decided" and "open" are plain-language bullet strings; use [] if none.
- The reply is written as the user (the person who pasted the thread — assume they are the most recent sender unless context says otherwise). No subject line. Address the people it concerns, cover the open points, and match this tone — ${TONES[tone]}
- Use only information from the thread. Do not invent names, dates, or commitments.

EMAIL THREAD:
"""
${thread}
"""`;
}

function extractJson(text: string): UntangleResult | null {
  // Strip code fences if the model ignored instructions.
  let candidate = text.trim();
  const fenced = candidate.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) candidate = fenced[1].trim();

  // Fall back to the outermost braces in case of surrounding prose.
  if (!candidate.startsWith("{")) {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    candidate = candidate.slice(start, end + 1);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;

  const obj = parsed as Record<string, unknown>;
  const participants = Array.isArray(obj.participants)
    ? obj.participants
        .filter((p): p is Record<string, unknown> => typeof p === "object" && p !== null)
        .map((p) => ({ name: String(p.name ?? "Unknown"), wants: String(p.wants ?? "") }))
    : [];
  const toStrings = (v: unknown) =>
    Array.isArray(v) ? v.map((s) => String(s)).filter(Boolean) : [];

  const reply = typeof obj.reply === "string" ? obj.reply : "";
  if (!reply && participants.length === 0) return null;

  return {
    participants,
    decided: toStrings(obj.decided),
    open: toStrings(obj.open),
    reply,
  };
}

export async function POST(req: NextRequest) {
  let body: { thread?: unknown; tone?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const rawThread = typeof body.thread === "string" ? body.thread.trim() : "";
  const tone: Tone =
    typeof body.tone === "string" && body.tone in TONES ? (body.tone as Tone) : "diplomatic";

  if (!rawThread) {
    return NextResponse.json({ error: "Paste an email thread first." }, { status: 400 });
  }
  if (rawThread.length > MAX_THREAD_CHARS) {
    return NextResponse.json(
      { error: `Thread is too long (over ${MAX_THREAD_CHARS.toLocaleString()} characters). Trim it down and try again.` },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;
  if (!apiKey || !model) {
    return NextResponse.json({ error: "Server is missing OpenRouter configuration." }, { status: 500 });
  }

  const thread = cleanThread(rawThread);

  let res: Response;
  try {
    res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: buildPrompt(thread, tone) }],
        max_tokens: 4000,
        temperature: 0.4,
      }),
      signal: AbortSignal.timeout(55_000),
    });
  } catch {
    return NextResponse.json(
      { error: "Couldn't reach the language model. Try again in a moment." },
      { status: 502 },
    );
  }

  if (!res.ok) {
    const status = res.status === 429 ? 429 : 502;
    return NextResponse.json(
      {
        error:
          res.status === 429
            ? "The model is rate-limited right now. Wait a minute and try again."
            : "The language model returned an error. Try again in a moment.",
      },
      { status },
    );
  }

  let content = "";
  try {
    const data = await res.json();
    content = data?.choices?.[0]?.message?.content ?? "";
  } catch {
    // fall through to the parse-failure response below
  }

  const result = content ? extractJson(content) : null;
  if (!result) {
    return NextResponse.json(
      { error: "The model returned something unusable. Try again — it's usually transient." },
      { status: 502 },
    );
  }

  return NextResponse.json(result);
}
