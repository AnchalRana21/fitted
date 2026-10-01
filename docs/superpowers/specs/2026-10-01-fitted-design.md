# Fitted — AI resume tailor (design)

Date: 2026-10-01
Owner: Anchal Rana
Status: Approved design, pending spec review

## Goal

A public, open-source web app that tailors a resume to a specific job description using the Claude API. It serves two purposes:

1. A useful tool for the author's own job search.
2. A portfolio piece: readable public source, live demo, tests and CI, showing streaming AI UI, structured output, and production-quality frontend in Next.js and TypeScript.

Success criteria:

- A visitor with no account can try the full flow on a sample in under 10 seconds, at zero API cost.
- A visitor can tailor their own resume to a job and export a PDF in under 2 minutes.
- CI (lint, typecheck, unit, E2E) passes on every PR without calling the paid API.
- The app never adds experience, skills or numbers that are not in the original resume without flagging them.

## Scope

### In v1

- Resume input: upload PDF or DOCX (max 5 MB), or paste plain text.
- Job input: paste job description text (max 15,000 characters).
- Analysis: match score, matched skills, missing skills, keyword gaps, seniority fit, short summary.
- Rewrite: per-bullet suggestions with accept, reject and inline edit, shown as a side-by-side diff.
- Cover letter: streamed, with a tone picker (formal, friendly, concise).
- Export: tailored resume to PDF (single ATS-friendly template) and copy as Markdown.
- History: past runs stored in the browser (IndexedDB), with list, open and delete.
- Sample mode: "Try sample" replays a recorded run from a static fixture, with no API call.
- Rate limit: 5 AI runs per IP per day on the live demo.

### Out of v1

Login, server database, job-URL scraping, multiple resume templates, multiple languages, payments.

## User flow

1. **Input screen.** Two panels: resume (drop zone or textarea) and job description (textarea). "Tailor" button, plus "Try sample".
2. **Analysis.** Streams into an analysis panel: score gauge, matched and missing skill chips, keyword gap list, seniority note, summary. Fields appear as they arrive.
3. **Rewrite.** Resume shown section by section. Each suggested bullet change is shown as old vs new with a one-line reason. Actions: accept, reject, edit. "Accept all" and "Reset" per section. Suggestions that introduce a claim not found in the original carry a `verify` flag and a warning badge, and are never pre-accepted.
4. **Cover letter** (optional tab). Tone picker, streamed text, editable, copy button.
5. **Export.** Preview of the final resume, built from the original plus accepted changes. Download PDF or copy Markdown.

## Architecture

- Next.js 16, App Router, TypeScript (strict), Tailwind CSS v4, Radix UI primitives.
- Server: Next.js route handlers on the Node.js runtime.
- AI: Anthropic TypeScript SDK (`@anthropic-ai/sdk`), model `claude-sonnet-5-5`. Structured output through tool use, with tool input schemas generated from Zod schemas. Responses are streamed.
- Validation: Zod schemas in `lib/schemas.ts`, shared by server and client. Every AI output is validated before being shown as final.
- Parsing: `unpdf` for PDF text, `mammoth` for DOCX.
- Rate limiting: Upstash Redis (`@upstash/ratelimit`), sliding window, 5 per IP per 24 hours. Turned off when the Upstash env vars are missing (local development).
- PDF export: `@react-pdf/renderer`, rendered on the client.
- Client storage: IndexedDB through `idb-keyval`.
- Hosting: Vercel. Secrets: `ANTHROPIC_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.

### API routes

| Route | Input | Output |
|---|---|---|
| `POST /api/parse` | multipart file (PDF/DOCX, ≤ 5 MB) | `{ text: string, sections: ResumeSection[] }` |
| `POST /api/analyze` | `{ resume: Resume, job: string }` | stream of partial `Analysis` JSON |
| `POST /api/rewrite` | `{ resume: Resume, job: string, analysis: Analysis }` | stream of partial `Rewrite` JSON |
| `POST /api/cover-letter` | `{ resume: Resume, job: string, tone: Tone }` | text stream |

`/api/analyze`, `/api/rewrite` and `/api/cover-letter` count toward the rate limit. One "run" (analyze + rewrite) costs one unit; the cover letter costs one more unit.

### Core types (Zod, in `lib/schemas.ts`)

- `Resume`: `{ sections: { id, title, bullets: { id, text }[] }[] }`. Sectioning is done by heuristics in `lib/parse/sections.ts` (headings such as Experience, Projects, Skills, Education), with a single "Resume" section as the fallback.
- `Analysis`: `{ score: 0–100, matchedSkills: string[], missingSkills: string[], keywordGaps: string[], seniorityFit: "under" | "match" | "over", summary: string }`.
- `Rewrite`: `{ suggestions: { bulletId, newText, reason, verify: boolean }[] }`.
- `Tone`: `"formal" | "friendly" | "concise"`.

### Streaming

Server handlers forward the SDK stream to the client as newline-delimited JSON events (`{ type: "partial", data }`, `{ type: "done", data }`, `{ type: "error", message }`). The `useStream<T>` hook in `hooks/useStream.ts` reads the stream, exposes `{ data: Partial<T>, status, error, retry }`, and checks the `done` payload against the Zod schema.

### Honesty guard

- The system prompt forbids inventing employers, titles, dates, metrics, tools or skills.
- After the model responds, `lib/ai/verify.ts` sets `verify: true` on any suggestion containing a number, proper noun or skill term that does not appear in the original resume text (case-insensitive token check against a skill list plus a number regex). The model's own `verify` flag is OR-ed with this check.

## Code layout

```
app/
  page.tsx                 input screen
  tailor/page.tsx          analysis, rewrite, cover letter, export tabs
  history/page.tsx
  api/parse/route.ts
  api/analyze/route.ts
  api/rewrite/route.ts
  api/cover-letter/route.ts
components/
  upload/ analysis/ diff-editor/ cover-letter/ export/ ui/
hooks/
  useStream.ts  useHistory.ts
lib/
  schemas.ts
  parse/pdf.ts  parse/docx.ts  parse/sections.ts
  ai/client.ts  ai/prompts.ts  ai/verify.ts
  ratelimit.ts
  apply.ts                 original resume + accepted changes → final resume
fixtures/
  sample-run.json          recorded sample used by "Try sample" and E2E tests
```

## Error handling and states

| Case | Behavior |
|---|---|
| Scanned or empty PDF (no text) | Message asking the user to paste text instead, with textarea focused |
| File too large or wrong type | Inline error on the drop zone; nothing uploaded |
| Input over length limit | Counter turns red; Tailor button disabled |
| Rate limit hit | 429 with reset time; UI shows the time and offers "Try sample" |
| Stream fails midway | Partial output kept; "Retry" re-runs that step only |
| Final output fails Zod check | One automatic retry; then an error with a retry button |
| Missing `ANTHROPIC_API_KEY` | Route returns 503; UI shows "demo only" mode with sample |

Every panel has designed loading (skeleton), empty, partial, failed and complete states.

## Testing

- **Unit (Vitest):** section parser, `apply.ts`, `verify.ts`, Zod schemas, stream event decoding, rate-limit key logic.
- **E2E (Playwright):** sample flow end to end; upload flow with a fixture PDF; accept/reject/edit and export; rate-limit message. The AI routes are mocked by replaying `fixtures/` when `MOCK_AI=1`, so CI never calls the paid API.
- **Accessibility:** `@axe-core/playwright` check on each screen; keyboard-only run through the diff editor.
- **CI (GitHub Actions):** on every PR and push to `main`: lint (ESLint), typecheck (`tsc --noEmit`), unit, build, E2E.

## Repo and portfolio deliverables

- README: GIF demo, live link, feature list, architecture diagram, "How Fitted avoids made-up claims" section, local setup, env vars.
- MIT license.
- Add Fitted to the `personalProjects` list in the portfolio's `lib/data.ts` once it is live.
- Resume line: "Built Fitted, an open-source AI resume tailor (Next.js 16, TypeScript, Claude API): streaming structured analysis, accept/reject diff editor, PDF export, rate-limited public demo, Playwright E2E and CI."
