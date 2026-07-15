# Progress — untangle

Running log. Newest entry at the top. Claude should append here as it goes.

## Current focus

- [x] Read brief.md and confirm the plan
- [x] Build, test, push, deploy

## Log

### 2026-07-15 (build session)
- Built the full app per brief: Next.js App Router + TS + Tailwind, single `/api/untangle` route calling OpenRouter, tone picker (Direct / Diplomatic / Buy Time), editable reply with Copy button.
- Server-side thread cleaning in `lib/clean-thread.ts`: strips `>` quoted lines, "On … wrote:" attributions, forwarded-message markers, Sent/Date/Subject headers. Keeps From/To/Cc lines (they identify participants in Outlook-style chains). **Fallback:** if aggressive stripping would gut the paste (single-email paste whose history lives entirely in quotes), it keeps quoted content and only sheds the `> ` gutters.
- Defensive JSON parse in the route: code-fence stripping, outermost-brace extraction, shape validation; friendly errors for 429s and unusable model output.
- Tested end-to-end locally (prod build) and on the live deployment with a realistic 4-message thread — extraction and tone-matched reply both correct.
- Created GitHub repo and pushed: https://github.com/AdminNcloudWeb/untangle (branch `main`).
- Deployed to Vercel production: https://untangle-pi.vercel.app (env vars set on Production).

### 2026-07-15
- Project initialised.

## Decisions

- **Model ID fixed:** `.env` shipped with `OPENROUTER_MODEL=openrouter:free`, which OpenRouter rejects as an invalid model ID. Corrected to `openrouter/free` (the free-models auto-router) in `.env` and `.env.example`; verified against the live API.
- The `openrouter/free` router sometimes picks reasoning models, so the route uses `max_tokens: 4000` to leave room for reasoning tokens before the JSON answer.
- The drafted reply is written as the most recent sender in the thread (assumed to be the user).

## Open questions

- `openrouter/free` output quality/latency varies by whichever free model the router picks; if it gets flaky, pin a specific model via `OPENROUTER_MODEL` in Vercel env settings.
