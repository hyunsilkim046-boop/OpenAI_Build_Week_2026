# English translations of Korean planning documents

This document provides the English translation of the three Korean planning
documents linked from the public README. The English README remains the primary
project summary. If wording differs, the narrower safety boundary wins.

## Translation: PROJECT_BRIEF_KO.md

### Project definition

WhyRight is a 90-second diagnostic-question training game in which a teacher or
tutor gets three questions to uncover the hidden misconception of a GPT-5.6
simulated student who reached the correct answer with the wrong mental model.

Target users are middle-school math and science teachers, pre-service teachers,
and tutors. The target moment is when a learner has supplied a correct final
answer and the educator is about to move on. WhyRight practices questions that
surface the reasoning behind that answer.

### Product loop

1. Select one synthetic scenario.
2. The simulated student gives a correct answer.
3. Ask up to three free-form follow-up questions.
4. GPT-5.6 maintains the private misconception and replies only as the student.
5. After every reply, update the set of candidate mental models that still
   appear plausible.
6. Choose one final diagnosis.
7. The server scores the exact diagnosis and candidate-set history against the
   fixed answer key.
8. Fixed result content shows a stronger hinge question and transfer prompt
   separately from the deterministic score.

The first scenario uses the misconception that multiplication always makes a
number larger. Its four candidate models are always-larger,
repeated-addition-only, memorized-fact-without-transfer, and a conceptually
sound scaling model. A live probe such as `1/2 × 8` exposes the boundary error;
the result screen uses a distinct `3/4` recipe question and compares
`0.3 × 20` with `1.3 × 20` for transfer. The second implemented scenario asks
why Korea and Australia have opposite seasons in the same July. Its fixed
distance-causes-seasons answer is H3, so the correct candidate is not always in
the same position. The MVP does not generate arbitrary subjects.

### Why GPT-5.6 is essential

The simulated student must apply one counterfactual mental model consistently
to unpredictable questions, preserve unrelated beliefs, resist attempts to
reveal hidden instructions, sound like a learner rather than a teacher, and
return schema-constrained reply fields. The Responses API, GPT-5.6, and
Structured Outputs provide that dynamic behavior.

GPT-5.6 does not own the answer key or score. Each scenario stores a fixed
misconception ID, immutable belief state, candidate mental models, and
reveal material. The hidden state does not transition during an MVP round and
is never accepted from model output. Diagnosis is an exact ID comparison.
Candidate-space reduction is calculated only from the educator's explicit
candidate updates and the fixed answer key. Fixed result guidance is labeled
and visually separated.

### Safety and success criteria

WhyRight uses fictional learners and synthetic content. It stores no real
student name, school, ID, grade, or conversation. It is practice, not student
assessment, special-education diagnosis, or teacher certification. Inputs are
length- and rate-limited, and hidden-state leakage attempts are tested.

The MVP succeeds when deterministic scoring reproduces the same result
independent of GPT wording, the simulator does not directly leak its hidden
setting across adversarial prompts, the server's hidden state remains immutable,
and the keyboard and 390-pixel mobile flows remain usable. Misconception
faithfulness is evaluated separately with eight fixed single-turn targeted,
misaligned, generic, and injection probes plus predefined explicit
expectations. The latest run passed 8/8 automatic signal checks, while manual
review remains required. No teacher pilot or measured learning-impact claim is
included in the MVP. Model self-evaluation is not accepted as evidence.

Codex proposed WhyRight and the Education framing; drafted the scenarios,
candidate sets, and evaluation fixtures; and designed, implemented, reviewed,
and packaged the application. The human entrant directed a separate new entry
and autonomous implementation, set the schedule and deployment handoff,
provided API access, and retains final submission responsibility.

The project is separate from CrossReady in track, users, inputs, product loop,
outputs, model role, design, repository, samples, video, session ID, and Git
history.

## Translation: IDEA_DECISION_KO.md

### Decision and pivot

WhyRight is the selected concept. CivicStep initially led the scorecard because
it offered a strong visual demo and a meaningful digital-inclusion problem.
Adversarial review found several products and a user study with the same
DOM-based one-step spotlight mechanism. A one-page synthetic demo would also
be easy to replace with fixed mappings, weakening the necessity of GPT-5.6.
Screenshot privacy remained a further risk. CivicStep was therefore rejected.

TeachBack Live and a broader ReverseTutor concept were also narrowed because
learning-by-teaching agents already exist in research and products. WhyRight
changes the user and outcome: an adult educator practices diagnosing a hidden
misconception behind a correct answer, under a three-question constraint. The
score comes from a fixed answer key and explicit candidate history, not from
the model's opinion of its own performance.

Other rejected candidates were ReliefRelay, because emergency-domain safety
and realtime scope were too large; RepairLoop, because similar vision repair
assistants are common and safety boundaries are broad; and ScamPause, because
financial, legal, and privacy risks were too high for the deadline.

The selected product decisions are: Education track, one educator persona,
three questions, fixed misconceptions and answer keys, separate simulation and
scoring, no real student data, and two scenarios only. The project will not
claim to be first, claim measured learning impact before a pilot, replace
teacher judgment, claim perfect simulation, or present synthetic results as
student validation.

## Translation: BUILD_AND_SUBMISSION_PLAN_KO.md

This is a historical pre-build plan written on July 21, not a statement of
current completion. The README, evaluation document, and morning checklist are
the sources of truth for the implemented state.

### Deadline and cut line

The official deadline is July 22, 2026 at 09:00 KST; the internal deadline is
08:00 KST. The build prioritizes one complete round over feature count. Speech,
authentication, databases, teacher dashboards, and general scenario generation
are outside scope.

The work sequence is: lock concept and Git baseline; build the full local game
flow; connect the three-turn GPT-5.6 Structured Output simulation; implement
fixed-answer and candidate-history scoring plus adversarial tests; finish
keyboard, mobile, and error states; deploy a no-login build with a protected
server key and cost limits; obtain one educator test; record a narrated video;
complete the Devpost description and `/feedback` Session ID; and preserve the
final hour as a submission buffer.

If time slips, cut the second scenario, optional coaching copy, and animation in
that order. Do not cut deterministic scoring or replace the live GPT-5.6 path.

The API returns a student reply and a small response-mode enum. It returns no
belief state and no scoring evidence tags. The hidden answer key, misconception
ID, and immutable belief state remain server-side. A refusal, timeout, or
invalid schema produces an explicit live-turn failure without consuming the
turn. Only the separate evaluation runner retries transient 429/503/504
responses, at most once.

Required tests cover the three-question limit, exact diagnosis IDs, duplicate
candidate elimination, score independence from GPT wording, immutable hidden
state, absence of the answer key from the pre-reveal client bundle,
prompt-injection attempts, oversized and empty input, role leakage, keyboard
completion, 390-pixel responsive layout, distinct API error states, and a
90-second sample round. A separate fixed probe suite with predefined explicit
expectations checks misconception faithfulness without using the same model as
a judge.

Submission requires a free no-login demo, public repository with MIT license,
real GPT-5.6 server integration, documented Codex collaboration and human
decisions, test commands, one educator test note, a public narrated YouTube
video under three minutes, the primary Codex `/feedback` Session ID, English
Devpost copy and testing instructions, gallery images, and confirmed submission
before 08:00 KST.

Legal identity data is entered only into the required Devpost fields. Resident
registration number, birth date, home address, phone number, and personal email
must not enter source code, README files, Git history, issues, or deployment
logs.
