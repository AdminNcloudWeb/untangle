# Untangle

Paste a messy email thread. Get back:

- **Who's involved** and what each person wants, one line each
- **What's been decided**
- **What's still open or blocking**
- **A drafted reply** in your choice of tone — Direct, Diplomatic, or Buy Time — in an editable box with a Copy button

No database, no auth, no accounts. Quoted-reply cruft (`>` gutters, "On Tue… wrote:" lines, forwarded-message headers) is stripped server-side before the thread is sent to the model.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · OpenRouter

## Running locally

```bash
cp .env.example .env   # then fill in your OpenRouter key
npm install
npm run dev
```

Environment variables (see `.env.example`):

| Variable | Purpose |
| --- | --- |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `OPENROUTER_MODEL` | Model ID, e.g. `openrouter/free` |
