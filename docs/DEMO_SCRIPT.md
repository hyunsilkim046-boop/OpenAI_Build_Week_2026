# WhyRight — Demo Video Script and Final Cut

## Produced final cut

- File: `submission/video/WhyRight_Build_Week_2026_Demo.mp4`
- Duration: **2:53.648** (under the three-minute limit)
- Format: 1920×1080, 30 fps, H.264 video with AAC English narration
- Content: actual GPT-5.6 response, actual candidate reduction, and actual
  fixed-rule 100/100 result from the verified local app
- Captions: `submission/video/WhyRight_Build_Week_2026_Demo.en.srt`
- Verification: `submission/video/VERIFY.md`

The table below is the original capture plan retained as process evidence. The
produced cut expands the explanation to 2:53.648 while staying below the limit.

Final chapters follow the generated captions: 0:00 premise, 0:17 case choice,
0:32 opening answer, 0:47 hinge question, 1:08 live GPT-5.6 response, 1:26
candidate reduction and diagnosis, 1:46 deterministic score, 2:05 Codex/GPT
trust boundary and verification, and 2:37 inspectable practice loop.

Target length: **2 minutes 40 seconds**. Record in English with clear audio. Keep
the entire video under three minutes. Show the real deployed app and real GPT-5.6
response; do not substitute a mock reply.

## Primary cut (2:40)

| Time | On-screen action | Spoken narration |
| --- | --- | --- |
| 0:00–0:09 | Open on the WhyRight hero: **“The answer is right. The reason is not.”** Slowly move the pointer toward the two case files. | “A correct answer can hide the exact misconception that will break the next lesson. WhyRight trains teachers to find the wrong reason behind a right answer.” |
| 0:09–0:22 | Keep the **90 sec / 3 probes / 1 fixed answer key** badges visible. Select **The Shrinking Product**. | “This is a ninety-second diagnostic-question game. I get at most three questions, and I must narrow four pre-authored hypotheses before naming the learner’s hidden belief.” |
| 0:22–0:33 | Click **Start round**. Pause on the student opening: **“3 × 5 = 15.”** | “The learner begins with a correct multiplication fact. That tells me almost nothing about the rule they are using.” |
| 0:33–0:50 | Type exactly: **“Without calculating first, will 1/2 × 8 be greater than, equal to, or less than 8? Why?”** Press Enter. Keep the **GPT-5.6** live label and loading state visible. | “So I ask a boundary question where competing mental models predict different answers: one-half times eight.” |
| 0:50–1:08 | Let the actual live GPT-5.6 student reply appear in full. Do not cover or paraphrase away the response. Briefly point at the reply. | “GPT-5.6 generates this reply live, but it must stay in the role of one fictional learner with one immutable misconception. The model does not see or control my score.” |
| 1:08–1:24 | Using the reply as evidence, uncheck the three unsupported candidates while retaining **Multiplication always makes quantities larger**. Click **I’m ready to diagnose**. | “The response rules out the addition, larger-factor, and keyword explanations. I preserve the one hypothesis that explains both the correct fact and the fraction error.” |
| 1:24–1:38 | Select **Multiplication always makes quantities larger**, then click **Lock diagnosis**. | “I lock the diagnosis. This final choice is checked against a fixed scenario answer key—not an AI judge.” |
| 1:38–1:55 | Hold on the result screen. Point to **Final diagnosis 70**, **Correct hypothesis retained 10**, and **Candidate reduction 20**. Then show the fixed answer reveal and stronger hinge question. | “The breakdown is deterministic: seventy points for the exact diagnosis, ten for never discarding the true candidate, and up to twenty for reducing wrong candidates. The result also gives a stronger hinge question.” |
| 1:55–2:13 | Cut to a clean repository view showing `src/lib/openai.ts`, `src/lib/session-token.ts`, `src/lib/score.ts`, and the API routes. Keep secrets and `.env.local` off-screen. | “Under the interface, Next.js calls the GPT-5.6 Responses API with Structured Outputs. GPT returns only a student reply and response mode. An AES-GCM session token protects the hidden state, while ordinary TypeScript owns validation and scoring.” |
| 2:13–2:27 | Show a verified test/build result, then `evals/faithfulness-probes.json` and `docs/EVALUATION.md`. Use only results produced in the final verified run. | “Twenty-one tests pass. Eight of eight fixed probes passed automatic signal checks, with manual review still required. The model never grades its own faithfulness.” |
| 2:27–2:35 | Show the README sections describing collaboration and decisions. | “Codex helped shape the concept, then built the Next.js architecture, implementation, tests, adversarial reviews, and submission package. The entrant directed the separate entry and owns the final submission.” |
| 2:35–2:40 | Return to the WhyRight result screen and end on the fixed-score note. | “WhyRight: question the reasoning, not the learner.” |

## Live-response contingency

- Rehearse the exact run before recording. Because GPT output can vary, keep a
  clean successful live recording take available before editing the final cut.
- If the first reply is genuinely ambiguous, do not pretend otherwise. Ask one
  short second probe: **“Would multiplying a positive number ever make it
  smaller? Explain.”** Then update the candidate set from the actual evidence.
- If the API times out, stop that take and retry. Do not edit a fabricated model
  reply into the product flow.
- Show the score that the recorded run actually earns. The primary script is
  designed for a 100-point run, but the narration must match the screen.

## Backup 90-second cut

| Time | On-screen action | Spoken narration |
| --- | --- | --- |
| 0:00–0:10 | Hero and round-format badges. | “A right answer can hide a wrong mental model. WhyRight gives teachers ninety seconds and three questions to find it.” |
| 0:10–0:23 | Select **The Shrinking Product**, start, and show **3 × 5 = 15**. | “This synthetic learner answers correctly, while one hidden misconception remains fixed for the round.” |
| 0:23–0:38 | Ask the exact one-half-times-eight question and show the real response. | “GPT-5.6 replies live to an open diagnostic question, constrained to the learner role through Structured Outputs.” |
| 0:38–0:53 | Eliminate unsupported candidates; diagnose **Multiplication always makes quantities larger**. | “I narrow the hypotheses from evidence and lock one diagnosis.” |
| 0:53–1:06 | Show score breakdown and reveal. | “Scoring is fixed TypeScript: seventy for diagnosis, ten for keeping the correct hypothesis, and twenty for candidate reduction. GPT never judges the player.” |
| 1:06–1:20 | Show the API, encrypted session, test output, and eight-probe fixture. | “Next.js uses the GPT-5.6 Responses API, an encrypted session token, twenty-one passing tests, and eight fixed probes with predefined automatic signal checks and required manual review.” |
| 1:20–1:30 | README collaboration section, then return to app. | “Codex shaped and built the product; GPT-5.6 only roleplays the fictional learner at runtime. WhyRight questions the reasoning, not the learner.” |

## Capture checklist

- [ ] Browser zoom at 100%; notifications, bookmarks with private data, and
      unrelated tabs hidden.
- [ ] Deployed URL loaded in a fresh private window without login.
- [ ] Desktop capture at 1080p or higher; app text remains legible on a phone.
- [ ] Microphone checked; narration audible without copyrighted music.
- [ ] `.env.local`, API keys, session tokens, email, addresses, and other
      personal data never appear on screen.
- [ ] Exact decisive question copied before the take to avoid typing errors.
- [ ] Actual GPT-5.6 reply and real loading state captured in one continuous app
      flow.
- [ ] Score narration matches the score shown in the chosen take.
- [ ] Terminal shot uses the final verified output; no invented test counts or
      pass claims.
- [x] Codex's concept, build, tests, reviews, and packaging role and the
      entrant's direction and final-submission responsibility are both clear.
- [x] Final export is **under 3:00**, includes audio, and has no copyrighted
      third-party music or material.
- [x] YouTube visibility is **Public**, not Unlisted or Private, per the official
      submission rules.
- [x] Live demo verified: `https://whyright-build-week-2026.vercel.app/`.
- [x] Public video verified: `https://youtu.be/9Qos6J0MOuI`.
- [x] Source repository verified:
      `https://github.com/hyunsilkim046-boop/OpenAI_Build_Week_2026`.
