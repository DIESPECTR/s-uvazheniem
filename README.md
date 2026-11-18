# С УВАЖЕНИЕМ.

Russian satirical corporate translator. React 19 + Vite + Express. No account, payment, analytics, or message database.

## Run locally

Requires Node.js 22+ and npm.

```sh
npm install
npm run dev
```

Open http://localhost:3000. All 40 predefined examples work without an API key. Demo results are explicitly labelled. Custom input, tone changes, alternatives and arbitrary reverse translation require AI; the app never pretends a preset is AI-generated.

## Enable AI

Create `.env` using `.env.example` and set the server-only `AI_API_KEY`. Restart the server. Optional `AI_BASE_URL` points to an OpenAI-compatible `/v1` API; `AI_MODEL` defaults to `gpt-6-luna`; set `AI_MODEL=gpt-4o-mini` to use the previous model. Luna requests use `reasoning_effort=none` and `max_completion_tokens=1800`. Never use a `VITE_` prefix for secrets. TC7 and TC12 passed with a mock provider: both targets request gpt-6-luna by default and use distinct system prompts. This does not verify live model access.

## Railway — handoff to Yan

1. Railway → New Project → Deploy from GitHub repo → `DIESPECTR/s-uvazheniem`, branch `main`. Leave the root directory at `/`. The root Dockerfile handles Node 22, installation, Vite build and production startup; no custom build/start commands are needed. No database or volume is required.
2. Service → **Variables**: add `AI_API_KEY` (the OpenAI secret key) and `AI_MODEL=gpt-6-luna` for both translators (verify provider access on staging first). Optional `AI_BASE_URL=https://api.openai.com/v1` is already the server default. Do not use `OPENAI_API_KEY` or any `VITE_` key: this application reads `AI_API_KEY`.
3. Deploy, then Settings → Networking → **Generate Domain** for the HTTPS URL. Railway supplies `PORT`; do not hardcode it. `NODE_ENV=production` is already set in the image.

For the standard direct Railway public endpoint behind one trusted reverse proxy, set `TRUST_PROXY=1` so the existing IP limiter distinguishes users. Recheck the proxy chain before adding another proxy/CDN; do not enable arbitrary proxy trust. Start with one replica (the rate limiter is in memory).

Optional Railway healthcheck path: `/api/status`. It returns HTTP 200 without an API key; `ai:true` only means a key is configured, not that OpenAI has accepted it. After deployment, translate a custom phrase not in the demo library and confirm the result is AI-generated. The Docker image, Railway deployment and live OpenAI access have not been exercised in this environment (Docker is unavailable).

Both modes use the same `AI_MODEL`, with different server-side system prompts. The sample and code default to `gpt-6-luna`. An existing Railway override takes precedence; a successful mock request does not establish live model access.

## Production

```sh
npm run build
npm start
```

Deploy the repository to a Node-capable host with build command `npm ci && npm run build` and start command `npm start`. Configure `PORT` and `AI_API_KEY` in the host's secret/environment settings, and enable HTTPS. The Express server serves both API and `dist`. Static-only hosting does not provide the translation API.

Use `TRUST_PROXY=1` only behind exactly one trusted reverse proxy. The rate limit is 20 requests/minute per IP, in memory per process. Multiple replicas need a shared rate limiter. Before broad public promotion, set provider spending limits; IP throttling alone is not a global cost cap. No public deployment has been performed.

## GitHub and deployment handoff

Source code is published at https://github.com/DIESPECTR/s-uvazheniem (public, branch `main`). Public access and the 19-file publication manifest were verified without authentication.

**cxrtisxl** has been invited with **write** access; the invitation is pending acceptance. Hosting access is configured separately; GitHub write access alone does not grant access to a hosting account. The application itself has not been deployed to a public hosting service.

For deployment, cxrtisxl should connect the repository to a Node.js 22+ service, configure the build/start commands above, and add `AI_API_KEY` directly in the host's secret settings. Do not share keys through chat, source files, or commits. Set `AI_MODEL` explicitly after verifying provider access and request compatibility; the GPT-6 Luna request wiring is implemented, but its new contract test and live-provider verification are still pending.

Never publish `.env`, `.temp`, `.quadcodeai`, `.mcp.json`, credentials, or local logs. If a GitHub token was exposed in chat, revoke it at https://github.com/settings/tokens and configure replacement authentication through a secure local login or secret environment variable. Never put a token in the git remote URL.

## Privacy and sharing

History: last 30 translations in browser localStorage, removable in the History dialog. AI requests send text to the server and configured AI provider. Do not submit secrets or personal data. No application request-body logging is added. Google Fonts is an external font request.

The share card is an HTML preview: screenshot it for Stories, print/save as PDF, copy its text, or use native Web Share where supported. There is no automatic PNG export or public storage of cards. Reverse translations carry a satire disclaimer.

## Checks

```sh
npm test
npm run build
```

Five focused tests cover all 40 demo pairs, validation, mocked AI success/failure/timeout and safe local history. Browser checks cover 1440px desktop and 390px mobile, dark theme, all four modes, history restore, card preview, HR offer and stale-request protection. HTTP checks cover 200/400/403/429 responses. Saved logs: `.temp/tests.log`, `.temp/build.log`, `.temp/http-checks.log`.

Requirements: `meta/docs/respect/app_req.md`. Plan: `meta/plans/implementation.md`. Component style sample: `style-guide.html` in development.
