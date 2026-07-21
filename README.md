# WhyRight

**The answer is right. The reason is not. Ask the question that reveals why.**

WhyRight is a 90-second diagnostic-question game for middle-school math and
science teachers and tutors. GPT-5.6 plays a fictional learner who gives a
correct answer while holding one coherent, fixed misconception. The
educator gets three follow-up questions to uncover that misconception, then
receives a deterministic score and a stronger hinge question.

This is not another AI tutor that gives students answers. It is a practice
arena for the human skill of seeing the reasoning hidden behind an answer.

> **Status:** production deployment verified on July 22, 2026 KST. Both live
> scenarios completed real GPT-5.6 turns and deterministic 100/100 scoring with
> no browser errors. **[Open WhyRight](https://whyright-build-week-2026.vercel.app/)**
> · **[Watch the public demo](https://youtu.be/9Qos6J0MOuI)**

## Try it locally

Requirements: Node.js 20.9 or newer and an OpenAI API key with GPT-5.6 access.

```bash
npm install
cp .env.example .env.local
# Add OPENAI_API_KEY to .env.local
npm run dev
```

Open `http://localhost:3000`. On PowerShell, use
`Copy-Item .env.example .env.local` instead of `cp`.

Environment variables:

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | Yes | Server-only access to the Responses API |
| `OPENAI_MODEL` | No | Defaults to `gpt-5.6` |
| `SESSION_SECRET` | Production recommended | AES-GCM session key; falls back to a key derived from `OPENAI_API_KEY` |

Never prefix these variables with `NEXT_PUBLIC_`. The committed
`.env.example` contains names only; `.env.local` is ignored by Git.

## Core experience

1. Choose one of two synthetic case files.
2. Read a learner's correct opening answer.
3. Ask up to three free-form diagnostic questions.
4. After each reply, remove candidate mental models that no longer fit.
5. Select a final diagnosis.
6. See the fixed answer key, transcript clues, a stronger hinge question, and
   a score computed from fixed rules rather than model judgment.

The MVP includes:

- **The Shrinking Product:** `3 × 5 = 15` is correct, but a fractional
  multiplier exposes the belief that multiplication must make a quantity
  larger.
- **Two Julys, Two Seasons:** July is correctly identified as summer in Korea,
  but the opposite hemisphere exposes a distance-based model of seasons.

## System boundary

```text
Browser
  ├─ public scenario + four candidate mental models
  ├─ free-form teacher question
  └─ explicit candidate-set updates
          │
          ▼
Next.js route handlers
  ├─ validate 90-second / 300-character / 3-turn limits
  ├─ open a 15-minute AES-256-GCM session token
  ├─ look up the immutable server-only scenario belief
  └─ call GPT-5.6 through the Responses API
          │
          ▼
Structured Output
  ├─ student_reply
  └─ response_mode: answer | uncertain | boundary
          │
          ▼
Fixed application logic
  ├─ exact diagnosis: 70 points
  ├─ retaining the correct candidate: 10 points
  └─ eliminating wrong candidates: up to 20 points
```

Candidate-reduction points require at least one successful live probe. Before
the first reply, early diagnosis is disabled; if the 90-second clock expires
first, a best-guess diagnosis remains available but is capped at 80/100.

The encrypted token contains the scenario ID, transcript, candidate-set
history, turn count, version, and lifecycle timestamps. The fixed hidden belief
and answer key remain in server code and are never returned before diagnosis.
GPT-5.6 can supply only its validated reply and response mode; it cannot
directly set other state fields, create candidate labels, choose the answer
key, or award points.

## Why GPT-5.6 is essential

The hard part is not generating a generic explanation. The runtime model must
hold a counterfactual misconception across unpredictable teacher questions,
answer naturally at a middle-school level, reveal evidence without simply
naming the diagnosis, and resist requests to expose hidden configuration.

WhyRight uses:

- the OpenAI **Responses API**;
- the `gpt-5.6` alias, which currently routes to GPT-5.6 Sol;
- **Structured Outputs** with a Zod schema;
- `store: false` for every model call; and
- a 20-second model timeout with a truthful retryable error. A transport or
  model failure does not silently become a fake student response or consume a
  turn.

## Evaluation that does not grade itself

Player scoring and model evaluation are deliberately separate.

- Player score comes only from the fixed diagnosis key and the educator's
  explicit candidate-set history.
- `evals/faithfulness-probes.json` contains eight fixed probes with predefined
  review expectations covering targeted, misaligned, generic-correction, and
  prompt-injection behavior.
- `npm run eval:faithfulness` runs each probe in an independent session and
  checks fixed include/exclude signals. Those automatic checks are a regression
  aid, not a model-generated grade; final review remains human.
- The latest local live run with the API-reported `gpt-5.6-sol` model passed
  all **8/8 single-turn automatic signal checks**; all eight API calls completed
  without a transport retry. This is evidence for the fixed cases, not a claim
  of general educational validity.
- The sanitized raw questions, replies, fixed-signal matches, and human-review
  flags are committed in
  [`evals/reports/faithfulness-report-2026-07-22.json`](evals/reports/faithfulness-report-2026-07-22.json).
  The preceding 7/8 checker run is also preserved: its conceptually correct
  “stays 8” reply exposed a missing fixed signal, which fixture 1.1.1 added.

See [`docs/EVALUATION.md`](docs/EVALUATION.md) for the protocol and limitations.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run eval:faithfulness          # requires a running app and live API key
```

Current verified baseline:

| Check | Result |
| --- | --- |
| ESLint | Pass, zero warnings |
| TypeScript strict check | Pass |
| Vitest | 7 files, 25 tests passed |
| Production Next.js build | Pass |
| `npm audit` | 0 known vulnerabilities |
| Fixed model-behavior probes | 8/8 single-turn automatic signal checks passed; manual review still required |
| Browser flow | Start → live GPT reply → diagnose → fixed 100/100 result, no error overlay |

## Human, Codex, and runtime-model roles

| Owner | Decisions and work |
| --- | --- |
| Human entrant | Directed a separate new entry and autonomous implementation, set the submission schedule and deferred public deployment to the final morning, provided API access, and retains final submission responsibility. |
| Fixed product contract, co-designed with Codex | WhyRight's two scenarios, candidate mental models, immutable hidden beliefs, answer keys, score weights, reveal copy, hinge questions, and predefined probe expectations. Codex originated the concrete draft; the entrant authorized the build and owns the submission. |
| Codex | Proposed the WhyRight concept and Education framing; drafted the scenarios, candidate sets, and evaluation fixtures; designed and implemented the application and request-boundary validation; researched official guidance; created tests and evaluation tooling; performed adversarial reviews; and prepared the package. |
| GPT-5.6 at runtime | Produces only the fictional learner's short reply and response mode under a strict schema. It never grades the educator or edits the answer key. |

The authorized product decision record is preserved in
[`docs/DECISIONS_2026-07-21.md`](docs/DECISIONS_2026-07-21.md).

## Safety, privacy, and limits

- Only fictional learners and synthetic classroom scenarios are used.
- No login, database, class roster, grade, analytics, or real student record is
  collected.
- Sessions are client-held encrypted tokens that expire after 15 minutes.
- New probes are rejected by the server after the round's 90-second deadline.
- A bounded per-instance IP limiter slows accidental or low-volume API abuse.
  It is defense in depth, not a deployment-wide budget control across serverless
  instances or regions.
- Prompt-injection requests are redirected, and exact protected-label leakage
  fails closed.
- The product is practice, not student assessment, teacher certification, or a
  claim of measured learning impact.
- Two fixed scenarios are an intentional contest MVP, not a general
  misconception generator.
- Because the MVP deliberately has no shared database, a previously issued
  encrypted token can be replayed by a determined API client. The visible
  score is a practice-game result, not a security or credential boundary.
  Production hardening would consume token transitions atomically in a shared
  store and apply an edge-wide spend/rate policy.

## Project map

```text
src/app/                  UI entry point and three route handlers
src/components/           accessible, responsive game states
src/lib/scenarios.ts      server-owned scenarios and answer keys
src/lib/openai.ts         GPT-5.6 Structured Output boundary
src/lib/session-token.ts  AES-256-GCM ephemeral session state
src/lib/score.ts          deterministic 70 / 10 / 20 scoring
src/__tests__/            domain and security regression tests
evals/                    fixed probe suite with predefined expectations
scripts/                  live evaluation runner
docs/                     product, evaluation, demo, and submission records
submission/               upload-ready video, captions, thumbnail, and gallery
.github/workflows/        clean-clone CI for lint, types, tests, build, and audit
```

## Deployment

The project is deployed from `main` to the Vercel project
`whyright-build-week-2026`. The stable production URL is
**https://whyright-build-week-2026.vercel.app/**. `OPENAI_API_KEY` and a
separate `SESSION_SECRET` are encrypted for Production, Preview, and
Development. Do not upload or expose `.env.local`.

## OpenAI Build Week 2026

- Track: **Education**
- Runtime model: **GPT-5.6**
- Primary build environment: **Codex**
- Submission deadline: **July 22, 2026 at 09:00 KST**

Submission still requires the public repository, a narrated public YouTube
video under three minutes, a testable deployment, the Codex `/feedback`
Session ID, and the completed Devpost form.

## Research and official sources

- [OpenAI Build Week Official Rules](https://openai.devpost.com/rules)
- [OpenAI Build Week](https://openai.com/build-week/)
- [OpenAI latest-model guidance](https://developers.openai.com/api/docs/guides/latest-model)
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Catching the Correct Answer Trap (AIED 2026)](https://doi.org/10.1007/978-3-032-29770-9_42)
- [LLMs Protégés (BEA 2025)](https://aclanthology.org/2025.bea-1.19/)
- [Misconception faithfulness of LLM simulators (2026)](https://arxiv.org/abs/2605.12748)

## Submission and decision documents

- [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) — narrated demo shot list
- [`submission/video/WhyRight_Build_Week_2026_Demo.mp4`](submission/video/WhyRight_Build_Week_2026_Demo.mp4) — verified 2:53.648 narrated demo
- [`submission/video/VERIFY.md`](submission/video/VERIFY.md) — video codec, duration, decode, audio, and hash evidence
- [`docs/DEVPOST_SUBMISSION_COPY.md`](docs/DEVPOST_SUBMISSION_COPY.md) — copy-ready submission text
- [`docs/MORNING_SUBMISSION_CHECKLIST_KO.md`](docs/MORNING_SUBMISSION_CHECKLIST_KO.md) — deadline-day checklist
- [`docs/RSI_LOG.md`](docs/RSI_LOG.md) — three review, fix, and independent verification cycles
- [`docs/PROJECT_BRIEF_KO.md`](docs/PROJECT_BRIEF_KO.md) — Korean product brief
- [`docs/IDEA_DECISION_KO.md`](docs/IDEA_DECISION_KO.md) — candidate review and pivot record
- [`docs/BUILD_AND_SUBMISSION_PLAN_KO.md`](docs/BUILD_AND_SUBMISSION_PLAN_KO.md) — historical pre-build plan and acceptance criteria
- [`docs/ENGLISH_TRANSLATIONS.md`](docs/ENGLISH_TRANSLATIONS.md) — English translations of Korean planning documents

## License

MIT
