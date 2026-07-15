"use client";

import { useState } from "react";

const TONES = [
  { id: "direct", label: "Direct", hint: "Straight to the point" },
  { id: "diplomatic", label: "Diplomatic", hint: "Tactful, keeps doors open" },
  { id: "buy-time", label: "Buy Time", hint: "Polite, commits to nothing" },
] as const;

type ToneId = (typeof TONES)[number]["id"];

interface UntangleResult {
  participants: { name: string; wants: string }[];
  decided: string[];
  open: string[];
  reply: string;
}

const AVATAR_COLORS = ["bg-pine", "bg-coral", "bg-gold"];

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join("") || "?"
  );
}

function ThreadMark({ size = 32, animate = false }: { size?: number; animate?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-pine" />
      <path
        d="M5.5 20.5 C5.5 14, 13.5 14, 13.5 18.5 C13.5 23, 7 23.5, 8.5 17.5 C10 11.5 15.5 10 19.5 10 L23.5 10"
        fill="none"
        stroke="#F6F1E7"
        strokeWidth="2.6"
        strokeLinecap="round"
        className={animate ? "thread-anim" : undefined}
      />
      <circle cx="26" cy="10" r="2.1" fill="#E8845B" />
    </svg>
  );
}

export default function Home() {
  const [thread, setThread] = useState("");
  const [tone, setTone] = useState<ToneId>("direct");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UntangleResult | null>(null);
  const [reply, setReply] = useState("");
  const [copied, setCopied] = useState(false);

  async function untangle() {
    if (!thread.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/untangle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thread, tone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong. Try again.");
        return;
      }
      setResult(data);
      setReply(data.reply ?? "");
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyReply() {
    try {
      await navigator.clipboard.writeText(reply);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Couldn't copy — select the text and copy manually.");
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-clip">
      {/* soft decorative glow behind the hero */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96">
        <div className="absolute -top-32 left-1/2 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-pine/10 blur-3xl" />
        <div className="absolute -top-16 right-[8%] h-48 w-80 rounded-full bg-coral/10 blur-3xl" />
      </div>

      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 pt-6">
        <div className="flex items-center gap-2.5">
          <ThreadMark size={34} />
          <span className="font-serif text-xl font-semibold tracking-tight">Untangle</span>
        </div>
        <p className="text-xs text-muted">No accounts · Nothing stored</p>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16">
        <section className="pt-10 pb-8 sm:pt-14">
          <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Fourteen replies deep and{" "}
            <span className="text-pine">nobody knows</span>
            {" what's going on."}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
            Paste the whole thread — quoted replies, signatures, all of it. Untangle
            reads the chaos and hands back who wants what, what&apos;s been decided,
            what&apos;s still blocking, and a reply that&apos;s ready to send.
          </p>
        </section>

        <section className="rounded-2xl border border-edge bg-card p-4 shadow-[0_1px_2px_rgba(34,52,58,0.05),0_12px_32px_-16px_rgba(34,52,58,0.18)] sm:p-5">
          <label
            htmlFor="thread"
            className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted"
          >
            The tangled thread
          </label>
          <textarea
            id="thread"
            value={thread}
            onChange={(e) => setThread(e.target.value)}
            placeholder={"Paste the whole mess here.\n\nRe: Re: Fwd: Q3 launch — quoted replies, signatures, disclaimers… all of it."}
            rows={11}
            className="w-full resize-y rounded-xl border border-edge bg-background/60 p-4 font-mono text-[13px] leading-relaxed outline-none placeholder:text-muted/70 focus:border-pine focus:ring-2 focus:ring-pine/20"
          />

          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <fieldset aria-label="Reply tone">
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                Reply tone
              </legend>
              <div className="flex flex-wrap gap-2">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    aria-pressed={tone === t.id}
                    className={`rounded-xl border px-3.5 py-2 text-left transition-colors ${
                      tone === t.id
                        ? "border-pine bg-tint"
                        : "border-edge hover:border-pine/50"
                    }`}
                  >
                    <span
                      className={`block text-sm font-semibold ${tone === t.id ? "text-pine" : ""}`}
                    >
                      {t.label}
                    </span>
                    <span className="block text-[11px] text-muted">{t.hint}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <button
              type="button"
              onClick={untangle}
              disabled={loading || !thread.trim()}
              className="shrink-0 rounded-full bg-coral px-7 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(212,85,47,0.6)] transition-colors hover:bg-coral-deep disabled:cursor-not-allowed disabled:opacity-40 dark:text-[#1c130f]"
            >
              {loading ? "Untangling…" : "Untangle it"}
            </button>
          </div>
        </section>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral-deep"
          >
            {error}
          </p>
        )}

        {loading && (
          <div className="mt-10 flex items-center gap-3 text-sm text-muted">
            <ThreadMark size={28} animate />
            <span>Pulling the thread apart…</span>
          </div>
        )}

        {result && !loading && (
          <div className="mt-10 space-y-5">
            <Card title="Who's involved">
              {result.participants.length === 0 ? (
                <Empty text="No participants found." />
              ) : (
                <ul className="space-y-3">
                  {result.participants.map((p, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white dark:text-[#1c130f] ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}
                      >
                        {initials(p.name)}
                      </span>
                      <p className="text-sm leading-relaxed">
                        <span className="font-semibold">{p.name}</span>
                        {p.wants && <span className="text-muted"> — {p.wants}</span>}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <div className="grid gap-5 sm:grid-cols-2">
              <Card title="Decided">
                <IconList
                  items={result.decided}
                  emptyText="Nothing settled yet."
                  icon={
                    <svg viewBox="0 0 16 16" className="h-4 w-4 fill-none stroke-pine" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M3 8.5l3.5 3.5L13 4.5" />
                    </svg>
                  }
                />
              </Card>

              <Card title="Open or blocking">
                <IconList
                  items={result.open}
                  emptyText="Nothing outstanding."
                  icon={
                    <svg viewBox="0 0 16 16" className="h-4 w-4 fill-none stroke-coral" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M8 3v6" />
                      <circle cx="8" cy="12.5" r="0.6" className="fill-coral" />
                    </svg>
                  }
                />
              </Card>
            </div>

            <Card
              title={`Drafted reply · ${TONES.find((t) => t.id === tone)?.label ?? ""}`}
              action={
                <button
                  type="button"
                  onClick={copyReply}
                  className="rounded-full bg-pine px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-pine-deep dark:text-[#0f1b19]"
                >
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              }
            >
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={10}
                aria-label="Drafted reply (editable)"
                className="w-full resize-y rounded-xl border border-edge bg-background/60 p-4 text-sm leading-relaxed outline-none focus:border-pine focus:ring-2 focus:ring-pine/20"
              />
              <p className="mt-1 text-xs text-muted">Edit freely — it&apos;s your words now.</p>
            </Card>
          </div>
        )}
      </main>

      <footer className="border-t border-edge/70 py-6">
        <p className="mx-auto max-w-3xl px-4 text-xs text-muted">
          Your thread is sent to the model to be read, and stored nowhere. ·{" "}
          <a
            href="https://github.com/AdminNcloudWeb/untangle"
            className="underline decoration-edge underline-offset-2 hover:text-foreground"
          >
            Source on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-edge bg-card p-5 shadow-[0_1px_2px_rgba(34,52,58,0.05)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function IconList({
  items,
  emptyText,
  icon,
}: {
  items: string[];
  emptyText: string;
  icon: React.ReactNode;
}) {
  if (items.length === 0) return <Empty text={emptyText} />;
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed">
          <span className="mt-0.5 shrink-0">{icon}</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm italic text-muted">{text}</p>;
}
