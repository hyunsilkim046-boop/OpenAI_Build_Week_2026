# WhyRight

**The answer is right. The reason is not. Ask the question that reveals why.**

WhyRight is a 90-second diagnostic-question training game for middle-school
math and science teachers and tutors. GPT-5.6 plays a student who gives a
correct answer while holding one coherent hidden misconception. The educator
gets three follow-up questions to uncover that misconception, then receives a
deterministic score and a stronger hinge question.

This is not another AI tutor that gives students answers. It is a practice
arena for the human skill of seeing the reasoning hidden behind an answer.

> Status: concept locked on July 21, 2026 KST. Implementation is the next
> milestone. This repository intentionally does not claim that the app is
> already complete.

## The problem

A correct final answer does not prove correct reasoning. A recent AIED 2026
study describes a "correct answer trap" in which AI tutors under-detect flawed
reasoning when the numerical answer happens to be right. In a classroom, the
same trap can let a misconception survive until the next topic.

WhyRight trains one concrete skill: asking a small number of high-information
questions that make a learner's mental model visible.

## Core experience

1. A simulated student answers a short problem correctly.
2. The educator may ask up to three follow-up questions.
3. GPT-5.6 stays in character and consistently applies one private,
   pre-authored, immutable misconception instead of revealing it on demand.
4. The educator selects a diagnosis from a fixed set of plausible
   misconceptions.
5. After each reply, the educator updates which candidate misconceptions are
   still plausible. The app records that candidate-set history without asking
   the model to label the question.
6. The app reveals the fixed answer key, highlights the conversational clues,
   and scores diagnosis accuracy and candidate-space reduction.
7. The educator sees one stronger hinge question and can try a transfer case.

The first MVP contains two pre-authored scenarios. One candidate is the belief
that multiplication always makes a number larger: a learner may still answer
`3 × 5 = 15` correctly, but a carefully chosen fraction question exposes the
model.

## Why GPT-5.6 is essential

The core challenge is not producing a generic explanation. The model must:

- maintain a counterfactual misconception across unpredictable follow-up
  questions;
- answer like a learner without leaking the hidden diagnosis;
- resist sycophantically abandoning the seeded belief when a question is
  generic, misaligned, or merely states that the student is wrong; and
- return a schema-constrained turn state that the application can validate.

The implementation will use the Responses API with GPT-5.6 and Structured
Outputs. The hidden belief state remains server-side. The model generates the
student conversation, but it does **not** invent the answer key or award the
final score.

## Evaluation that does not grade itself

WhyRight avoids circular "the model says the model did well" evaluation:

- each scenario's misconception, evidence rules, and candidate diagnoses are
  fixed before play;
- diagnosis accuracy is an exact comparison with the fixed answer key;
- candidate-space reduction is computed from the educator's explicit candidate
  updates and the fixed answer key, never from model-generated tags;
- model output cannot alter hidden scenario state, and detected leakage fails
  closed; and
- GPT-generated coaching is labeled as guidance, separate from the score.

The misconception does not transition during an MVP round. It is immutable
server-side scenario data, not a model-authored belief update. A separate fixed
probe suite—targeted, misaligned, generic, and prompt-injection questions—is
human-reviewed for misconception faithfulness and is not part of the player
score.

## Safety and privacy

- Only fictional learners and synthetic classroom scenarios are used.
- No real student names, records, grades, or conversations are collected.
- The product is practice, not student assessment or teacher certification.
- Sessions are ephemeral in the MVP.
- Prompt-injection attempts to reveal the hidden state are tested and blocked.
- Private entrant identity data is never stored in this public repository.

## MVP boundary

Included:

- English-first, no-login web experience;
- two fixed misconception scenarios;
- three-question conversation limit;
- GPT-5.6 student simulation through Structured Outputs;
- deterministic diagnosis and candidate-space-reduction score;
- result reveal and one stronger hinge question;
- keyboard-accessible responsive UI; and
- automated tests for state, leakage, scoring, and failure paths, plus a
  human-labeled fixed probe evaluation for misconception faithfulness.

Excluded:

- open-ended subjects or teacher-authored scenarios;
- real student data, grading, class rosters, or analytics;
- speech, avatars, retrieval, databases, and multi-agent orchestration; and
- claims of measured learning impact before a real pilot exists.

## OpenAI Build Week 2026

- Track: **Education**
- Required runtime model: **GPT-5.6**
- Primary build environment: **Codex**
- Submission deadline: **July 22, 2026 at 09:00 KST**

The official rules require a working project, a public video under three
minutes with audio, a testable code repository, an explanation of Codex and
GPT-5.6 use, and a Codex `/feedback` Session ID.

## Research and official sources

- [OpenAI Build Week Official Rules](https://openai.devpost.com/rules)
- [OpenAI Build Week](https://openai.com/build-week/)
- [OpenAI model guidance](https://developers.openai.com/api/docs/guides/latest-model)
- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Catching the Correct Answer Trap (AIED 2026)](https://doi.org/10.1007/978-3-032-29770-9_42)
- [LLMs Protégés (BEA 2025)](https://aclanthology.org/2025.bea-1.19/)
- [Misconception faithfulness of LLM simulators (2026)](https://arxiv.org/abs/2605.12748)

## Planning documents

- [`docs/PROJECT_BRIEF_KO.md`](docs/PROJECT_BRIEF_KO.md) — Korean product brief
- [`docs/IDEA_DECISION_KO.md`](docs/IDEA_DECISION_KO.md) — candidate review and pivot record
- [`docs/BUILD_AND_SUBMISSION_PLAN_KO.md`](docs/BUILD_AND_SUBMISSION_PLAN_KO.md) — deadline plan and acceptance criteria
- [`docs/ENGLISH_TRANSLATIONS.md`](docs/ENGLISH_TRANSLATIONS.md) — English translations of the Korean planning documents
- [`docs/DECISIONS_2026-07-21.md`](docs/DECISIONS_2026-07-21.md) — human product decisions

## License

MIT
