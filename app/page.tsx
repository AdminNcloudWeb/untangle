"use client";

import { useState } from "react";

const TONES = [
  { id: "direct", label: "Direct", hint: "Get to the point" },
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
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Untangle</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Paste a messy email thread. Get who wants what, what&apos;s decided, what&apos;s
          blocking — and a reply you can send.
        </p>
      </header>

      <textarea
        value={thread}
        onChange={(e) => setThread(e.target.value)}
        placeholder="Paste the whole thread here — quoted replies, signatures, all of it."
        rows={12}
        className="w-full resize-y rounded-lg border border-neutral-300 bg-white p-4 text-sm leading-relaxed shadow-sm outline-none placeholder:text-neutral-400 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-500 dark:focus:ring-neutral-700"
      />

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <fieldset className="flex gap-2" aria-label="Reply tone">
          {TONES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTone(t.id)}
              title={t.hint}
              aria-pressed={tone === t.id}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                tone === t.id
                  ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                  : "border-neutral-300 text-neutral-600 hover:border-neutral-500 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500"
              }`}
            >
              {t.label}
            </button>
          ))}
        </fieldset>

        <button
          type="button"
          onClick={untangle}
          disabled={loading || !thread.trim()}
          className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Untangling…" : "Untangle"}
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {error}
        </p>
      )}

      {loading && (
        <p className="mt-6 animate-pulse text-sm text-neutral-500 dark:text-neutral-400">
          Reading the thread…
        </p>
      )}

      {result && !loading && (
        <div className="mt-8 space-y-6">
          <Section title="Who's involved">
            {result.participants.length === 0 ? (
              <Empty />
            ) : (
              <ul className="space-y-1.5">
                {result.participants.map((p, i) => (
                  <li key={i} className="text-sm leading-relaxed">
                    <span className="font-semibold">{p.name}</span>
                    {p.wants && <> — {p.wants}</>}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Decided">
            <Bullets items={result.decided} emptyText="Nothing settled yet." />
          </Section>

          <Section title="Open or blocking">
            <Bullets items={result.open} emptyText="Nothing outstanding." />
          </Section>

          <Section
            title="Drafted reply"
            action={
              <button
                type="button"
                onClick={copyReply}
                className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-600 transition-colors hover:border-neutral-500 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-neutral-500 dark:hover:text-white"
              >
                {copied ? "Copied ✓" : "Copy"}
              </button>
            }
          >
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={10}
              className="w-full resize-y rounded-lg border border-neutral-300 bg-white p-4 text-sm leading-relaxed shadow-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-300 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-500 dark:focus:ring-neutral-700"
            />
          </Section>
        </div>
      )}
    </main>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Bullets({ items, emptyText }: { items: string[]; emptyText: string }) {
  if (items.length === 0) return <Empty text={emptyText} />;
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((item, i) => (
        <li key={i} className="text-sm leading-relaxed">
          {item}
        </li>
      ))}
    </ul>
  );
}

function Empty({ text = "Nothing found." }: { text?: string }) {
  return <p className="text-sm italic text-neutral-400 dark:text-neutral-500">{text}</p>;
}
