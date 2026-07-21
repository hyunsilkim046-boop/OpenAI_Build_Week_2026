# Devpost Submission Copy — WhyRight

## Title

**WhyRight**

## Tagline

**Three questions to uncover the wrong reason behind a right answer.**

## Track

**Education**

## Short description

WhyRight is a 90-second diagnostic-question game for middle-school math and
science teachers and tutors. GPT-5.6 plays a fictional learner who gives a
correct answer while consistently holding one hidden misconception. The
educator asks up to three free-form questions, narrows four candidate beliefs,
and makes a final diagnosis. A fixed answer key—not the model—produces the
score.

## Inspiration / Problem

A correct classroom answer is not the same as correct reasoning. A learner can
recall a fact, follow a familiar pattern, or match a calendar label while
carrying a mental model that fails on the next boundary case. Teachers need
practice asking questions that make competing explanations predict different
answers, but that practice is difficult to deliver repeatedly with static
multiple-choice exercises.

WhyRight turns diagnostic questioning into a short, replayable investigation.
Its goal is not to evaluate real students. It gives educators a safe synthetic
space to practice identifying the model behind an answer.

## What it does

1. The educator chooses one of two fixed synthetic scenarios: fraction
   multiplication or seasons across hemispheres.
2. A fictional learner starts with a correct answer while holding one private,
   immutable misconception.
3. The educator asks up to three open-ended diagnostic questions in 90 seconds.
4. GPT-5.6 responds as that learner while remaining constrained to the fixed
   belief.
5. After each response, the educator updates which of four candidate mental
   models remain plausible.
6. The educator locks a final diagnosis.
7. Deterministic TypeScript scores the exact diagnosis (70 points), preserving
   the true candidate throughout the evidence history (10 points), and reducing
   wrong candidates (up to 20 points).
8. The result reveals the fixed answer and offers a stronger hinge
   question and transfer prompt.

## How I built it

WhyRight is a responsive Next.js application with three server routes for
session creation, live turns, and diagnosis. The live student simulator uses
the OpenAI Responses API with GPT-5.6 and Structured Outputs. The model is
limited to two fields: `student_reply` and a small `response_mode` enum.

The hidden misconception, answer key, candidate labels, and scoring rules are
fixed application data co-designed with Codex. Session state is sealed in a
short-lived, authenticated AES-256-GCM token, so the browser cannot read the
hidden belief or tamper with the server-trusted transcript and candidate
history encoded in the token. The server validates question length, turn
count, candidate monotonicity, token integrity, and model output before
returning a reply. The score path never calls GPT.

## Why GPT-5.6 is essential

Static branching can only recognize questions the author predicted. The core
challenge here is responding naturally to a teacher's unpredictable free-form
probe while preserving a counterfactual belief across turns. GPT-5.6 supplies
that flexible learner-language simulation. Structured Outputs keeps the
integration narrow and machine-checkable, while the application's fixed state
and rules prevent the model from inventing the grading target.

## How I used Codex

Codex accelerated the project from concept selection to a working application.
It helped inspect the contest requirements, compare product directions,
translate the chosen concept into API and state boundaries, implement the
Next.js experience, build validation and tests, run adversarial reviews, and
prepare submission documentation.

As the human entrant, I directed a separate new submission and autonomous
implementation, set the submission schedule and deferred public deployment to
the final morning, provided API access, and retain final submission
responsibility. Codex proposed the WhyRight concept and Education framing;
drafted the scenarios, candidate sets, and evaluation fixtures; designed and
implemented the application; ran adversarial reviews; and prepared the
submission package. The product contract was developed through that workflow,
but neither Codex nor GPT-5.6 is the runtime judge.

## Challenges

- **Keeping role-play and grading separate.** The convenient design would let
  the same model reveal and judge its own misconception. I instead kept the
  answer key and score outside GPT, at the cost of more explicit state and
  validation logic.
- **Preserving one belief under pressure.** Generic correction and prompt
  injection can make a model abandon or disclose its role. The simulator uses
  a strict immutable-belief contract, protected-disclosure checks, and a fixed
  probe suite for regression review.
- **Making evidence collection meaningful.** Candidate removal is monotonic:
  once evidence rules a hypothesis out and a turn is committed, it cannot be
  restored. This makes the score reflect the educator's actual reasoning path.
- **Building a credible product in a short window.** I limited the MVP to two
  fixed scenarios, no accounts, and no database rather than presenting a
  broad but untestable content-generation platform.

## Accomplishments that I am proud of

- A complete English-first game flow from case selection through a live
  GPT-5.6 interview to a transparent result screen.
- A scoring path that is reproducible and independent of model wording.
- Authenticated, short-lived encrypted session state without collecting
  real learner records.
- Two distinct scenarios that test transfer beyond rote correct answers.
- A separate eight-probe faithfulness regression suite with fixed, predefined
  expectations covering targeted, misaligned, generic, and prompt-injection
  questions.
- A responsive interface that exposes the hypotheses, evidence updates, live
  model boundary, and score provenance instead of hiding them behind a chat box.

## What I learned

The most important design lesson was that an educational simulation needs two
contracts, not one. The generative contract asks whether the learner reply is
plausible and faithful. The assessment contract asks whether the educator's
diagnosis matches a fixed key. Combining those contracts makes the experience
harder to audit and easier to game.

I also learned that diagnostic questions are strongest when two hypotheses
predict visibly different answers. “Explain again” often produces more words;
a carefully chosen boundary case produces evidence.

## Responsible AI and privacy

- All learners, answers, and classroom situations in this MVP are fictional and
  synthetic.
- The application does not ask for names, student records, grades, or login
  details, and it is not a tool for high-stakes student evaluation.
- The hidden belief is fixed by the product contract, co-designed with Codex,
  and immutable during a round.
- GPT-5.6 generates only the fictional learner's reply and response mode; it
  cannot change the answer key or award points.
- Server-side validation blocks protected-label disclosure and rejects malformed
  model output.
- Session state expires after 15 minutes and is encrypted and authenticated.
- The server stops accepting new probes when the 90-second round ends.
- The visible score is a practice-game result. The stateless MVP does not use
  a shared one-time-token store, so deliberate replay by a custom API client is
  a documented limitation rather than a security claim.
- The prototype has not been piloted with real teachers or students, and it
  makes no claim of measured learning improvement or classroom impact.

## Testing

The repository includes 25 automated checks across seven test files for
scenario integrity, score determinism, candidate-history validation, encrypted
token confidentiality, tamper rejection, expiration, diagnosis readiness,
body-size enforcement, rate limiting, and request-boundary validation, plus
lint, type checking, and a production build check.

Model behavior is evaluated separately with eight fixed probes: one targeted,
one misaligned, one generic, and one prompt-injection probe for each scenario.
Every probe has a predefined review expectation and transparent include/exclude
signals. The final fixture 1.1.1 run passed 8/8 single-turn automatic signal
checks with the API-reported `gpt-5.6-sol` model, and each API call completed
without a transport retry. The preceding 7/8 checker run is preserved; it
exposed a missing fixed signal for the conceptually valid phrase “stays 8.” The
runner preserves every raw reply for manual review and does not use a model to
grade itself. This small suite is regression evidence, not a claim of general
model safety or educational effectiveness.

## What's next

Next I would co-design more scenarios with experienced teachers, add
teacher-authored but reviewed case templates, and study whether repeated rounds
improve the quality of real hinge questions. I would also expand the
faithfulness suite, add run-to-run stability reporting, support accessible
localization, and move short-lived state to managed infrastructure if the
prototype grows beyond a single-session demo.

Any classroom study would require informed consent, careful privacy review, and
outcome measures defined before collecting data. The current project remains a
synthetic training prototype.

## Links

- Live demo: `https://whyright-build-week-2026.vercel.app/`
- Source repository: `https://github.com/hyunsilkim046-boop/OpenAI_Build_Week_2026`
- Public YouTube demo: `https://youtu.be/9Qos6J0MOuI`
- Public Devpost entry: `https://devpost.com/software/whyright`
- Codex `/feedback` Session ID: provided directly in the submitted form and
  intentionally omitted from this public repository
