# untangle

_Created 2026-07-15_

## Brief


Build a web app called **Untangle**.

A user pastes a messy email thread. Return:
- Who's involved and what each wants, one line each
- What's been decided
- What's still open or blocking
- A drafted reply, in a tone the user picks before generating: Direct, Diplomatic, or Buy Time

The reply appears in an editable textarea with a "Copy" button.

Stack: Next.js App Router, TypeScript, Tailwind. Single `/api/untangle` route calling OpenRouter (`OPENROUTER_API_KEY`, `OPENROUTER_MODEL`). Strip quoted-reply cruft server-side (`>` prefixes, "On Tue… wrote:") before sending, to save tokens. Strict JSON, code fences stripped, defensive parse. No database, no auth, no payment.

Design: fast and utilitarian. People use this when stressed — big paste box, one button, no friction.

Create a GitHub repo and push once completed, also deploy to Vercel using the token you have stored in your credentials file.
