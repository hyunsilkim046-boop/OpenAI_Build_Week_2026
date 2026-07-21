# Three recursive improvement cycles

For this project, “RSI” means three explicit **review → fix → independent
verification** cycles over the product and submission package. It does not
claim that the runtime model rewrites or validates itself.

## Cycle 1 — Functional and trust-boundary review

Adversarial review found that an eliminated answer could still be submitted,
the deadline was enforced only in the browser, request bodies were read before
their size was bounded, model calls and client requests could hang, and the MVP
had no abuse throttle.

Fixes:

- final diagnoses must remain in the committed plausible set;
- the server enforces the 90-second deadline and 16 KB request limit;
- model and client timeouts fail truthfully instead of fabricating a reply;
- bounded per-instance rate limits protect the three API routes; and
- the stateless token-replay and non-global rate-limit limitations are stated
  openly rather than presented as production-grade cost controls.

Verification: unit tests, direct API rejection checks, production build, and
dependency audit.

## Cycle 2 — UX and accessibility review

Desktop/mobile and keyboard review found a reversed mobile reading order,
hidden timer context after scrolling, missing focus transitions, an unannounced
transcript, ambiguous retry behavior, weak focus/placeholder contrast, and
undersized controls.

Fixes:

- conversation precedes the hypothesis board on mobile;
- the mobile round header stays visible;
- phase changes move focus to the round, diagnosis, or result heading;
- transcript additions use a polite log and near-bottom auto-scroll;
- start/load/retry errors have distinct actions;
- committed and eliminated candidate states are explicit; and
- focus treatment, contrast, and touch targets meet the tested UI baseline.

Verification: desktop 1440×900 and mobile 390×844 browser runs, keyboard focus
checks, overflow checks, console checks, and the full application check.

## Cycle 3 — Judge, scoring, and submission review

An Education-track judge review found that two mathematics alternatives
contradicted the correct opening answer, a zero-probe guess could earn 100,
both scenarios placed the answer at H1, coaching repeated the demo question,
some score labels overstated what was measured, collaboration/evaluation copy
overstated human authorship, and the narrated video did not yet explain how
Codex was used.

Fixes:

- all four mathematics candidates are plausible mental models after
  `3 × 5 = 15`, and the science answer is H3;
- candidate-reduction points require a successful live probe, so a zero-probe
  best guess is capped at 80;
- the UI requires one successful reply before early diagnosis and now labels
  the 10-point rule `Correct hypothesis retained`;
- result coaching uses a new `3/4 × 12` hinge question and a `0.3` versus `1.3`
  transfer comparison;
- evaluation uses fixed predefined expectations, records the API-reported
  model, preserves raw replies, and keeps manual review pending;
- Codex's role in concept development, scenarios, implementation, tests,
  reviews, and packaging is stated explicitly; and
- the final narrated demo includes actual continuous app interaction and
  separates Codex's build-time role from GPT-5.6's runtime role.

Verification:

- ESLint and strict TypeScript: pass;
- Vitest: 6 files, 21 tests pass;
- Next.js production build: pass;
- production dependency audit: 0 known vulnerabilities;
- live fixed probe suite 1.1.1: 8/8 automatic signal checks with the
  API-reported `gpt-5.6-sol` model, manual review still required;
- browser flow: zero-probe 80 cap and one-probe 100 path both verified; and
- final video codec, duration, decode, audio, captions, and hash are recorded
  in [`../submission/video/VERIFY.md`](../submission/video/VERIFY.md).

The preceding 7/8 evaluation run is retained because it exposed a checker
blind spot for the valid phrase “stays 8.” The fixture was narrowly corrected
and versioned before the final run; no raw model reply was edited or discarded.
