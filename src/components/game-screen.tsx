import { useEffect, useRef, type KeyboardEvent } from "react";
import { CandidateBoard } from "@/components/candidate-board";
import { RoundHeader } from "@/components/round-header";
import { Transcript } from "@/components/transcript";
import type { ScenarioSummary, TranscriptItem } from "@/components/whyright-types";

interface GameScreenProps {
  scenario: ScenarioSummary;
  transcript: TranscriptItem[];
  plausibleCandidateIds: string[];
  committedCandidateIds: string[];
  question: string;
  remainingTurns: number;
  secondsLeft: number;
  waiting: boolean;
  diagnosing: boolean;
  diagnosisMode: boolean;
  diagnosisId: string;
  completedProbeCount: number;
  error: string;
  questionFocusRequest: number;
  onQuestionChange: (question: string) => void;
  onSubmitQuestion: () => void;
  onToggleCandidate: (candidateId: string) => void;
  onOpenDiagnosis: () => void;
  onCloseDiagnosis: () => void;
  onDiagnosisChange: (candidateId: string) => void;
  onSubmitDiagnosis: () => void;
  onExit: () => void;
}

export function GameScreen({
  scenario,
  transcript,
  plausibleCandidateIds,
  committedCandidateIds,
  question,
  remainingTurns,
  secondsLeft,
  waiting,
  diagnosing,
  diagnosisMode,
  diagnosisId,
  completedProbeCount,
  error,
  questionFocusRequest,
  onQuestionChange,
  onSubmitQuestion,
  onToggleCandidate,
  onOpenDiagnosis,
  onCloseDiagnosis,
  onDiagnosisChange,
  onSubmitDiagnosis,
  onExit,
}: GameScreenProps) {
  const noMoreProbes = remainingTurns === 0 || secondsLeft === 0;
  const canDiagnose = !waiting && (completedProbeCount > 0 || secondsLeft === 0);
  const roundTitleRef = useRef<HTMLHeadingElement>(null);
  const questionRef = useRef<HTMLTextAreaElement>(null);
  const diagnosisDrawerRef = useRef<HTMLDivElement>(null);
  const diagnosisTitleRef = useRef<HTMLHeadingElement>(null);
  const timerAnnouncement =
    secondsLeft === 20
      ? "20 seconds remaining."
      : secondsLeft === 10
        ? "10 seconds remaining."
        : secondsLeft === 0
          ? "Time is up. Choose your best diagnosis."
          : "";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    const frame = window.requestAnimationFrame(() => roundTitleRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!diagnosisMode) return;
    const frame = window.requestAnimationFrame(() => {
      const firstAvailableDiagnosis =
        diagnosisDrawerRef.current?.querySelector<HTMLInputElement>(
          'input[name="diagnosis"]:not(:disabled)',
        );
      (firstAvailableDiagnosis ?? diagnosisTitleRef.current)?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [diagnosisMode]);

  useEffect(() => {
    if (questionFocusRequest === 0 || waiting) return;
    const frame = window.requestAnimationFrame(() => questionRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [questionFocusRequest, waiting]);

  function handleQuestionKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (question.trim() && !waiting && !noMoreProbes) onSubmitQuestion();
    }
  }

  return (
    <main className="round-shell">
      <RoundHeader
        secondsLeft={secondsLeft}
        remainingTurns={remainingTurns}
        subject={scenario.subject}
        grade={scenario.grade}
        onExit={onExit}
      />

      <div className="round-context">
        <div>
          <span className="round-context__tag">Case file</span>
          <h1 id="round-title" ref={roundTitleRef} tabIndex={-1}>{scenario.title}</h1>
        </div>
        <p>{scenario.challenge}</p>
      </div>

      <div className="round-grid">
        <section className="conversation-panel" aria-labelledby="conversation-title">
          <div className="conversation-panel__heading">
            <div>
              <p className="panel-kicker">Live reasoning interview</p>
              <h2 id="conversation-title">Probe the thinking</h2>
            </div>
            <span className="live-label"><i aria-hidden="true" /> GPT-5.6</span>
          </div>

          <Transcript items={transcript} waiting={waiting} />

          {diagnosisMode ? (
            <div className="diagnosis-drawer" ref={diagnosisDrawerRef}>
              <div className="diagnosis-drawer__intro">
                <p className="panel-kicker">Final call</p>
                <h3 id="diagnosis-title" ref={diagnosisTitleRef} tabIndex={-1}>What belief best explains the learner&apos;s answers?</h3>
                <p>Select one diagnosis. The fixed answer key—not the model—will score it.</p>
              </div>
              <fieldset disabled={waiting || diagnosing}>
                <legend className="sr-only">Choose your final diagnosis</legend>
                <div className="diagnosis-options">
                  {scenario.candidates.map((candidate, index) => {
                    const isPlausible = plausibleCandidateIds.includes(candidate.id);
                    const className = [
                      diagnosisId === candidate.id ? "is-selected" : "",
                      !isPlausible ? "is-eliminated" : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <label key={candidate.id} className={className}>
                        <input
                          type="radio"
                          name="diagnosis"
                          checked={diagnosisId === candidate.id}
                          disabled={!isPlausible}
                          onChange={() => onDiagnosisChange(candidate.id)}
                          aria-describedby={!isPlausible ? `diagnosis-${candidate.id}-state` : undefined}
                        />
                        <span>H{index + 1}</span>
                        <strong>
                          {candidate.label}
                          {!isPlausible ? <small id={`diagnosis-${candidate.id}-state`}>Eliminated</small> : null}
                        </strong>
                        <i aria-hidden="true" />
                      </label>
                    );
                  })}
                </div>
              </fieldset>
              <div className="diagnosis-actions">
                {!noMoreProbes ? (
                  <button type="button" className="secondary-button" onClick={onCloseDiagnosis} disabled={waiting || diagnosing}>
                    Ask another probe
                  </button>
                ) : (
                  <p>
                    {secondsLeft === 0
                      ? completedProbeCount === 0
                        ? "Time is up—no live reply was collected. Your best guess cannot earn candidate-reduction points."
                        : "Time is up—make your best diagnosis."
                      : "All three probes are used."}
                  </p>
                )}
                <button
                  type="button"
                  className="primary-button"
                  onClick={onSubmitDiagnosis}
                  disabled={
                    !diagnosisId ||
                    !plausibleCandidateIds.includes(diagnosisId) ||
                    waiting ||
                    diagnosing
                  }
                >
                  {diagnosing ? <span className="button-spinner" aria-hidden="true" /> : null}
                  {diagnosing ? "Scoring…" : "Lock diagnosis"}
                  {!diagnosing ? <span aria-hidden="true">→</span> : null}
                </button>
              </div>
            </div>
          ) : (
            <div className="probe-composer">
              {noMoreProbes ? (
                <div className="probe-limit">
                  <p>
                    <strong>{secondsLeft === 0 ? "Time." : "Three probes used."}</strong>{" "}
                    {completedProbeCount === 0
                      ? "No live reply was collected. A best guess cannot earn candidate-reduction points."
                      : "Your evidence set is ready."}
                  </p>
                  <button type="button" className="primary-button" onClick={onOpenDiagnosis} disabled={waiting}>Make diagnosis <span aria-hidden="true">→</span></button>
                </div>
              ) : (
                <>
                  <label htmlFor="probe-question">
                    <span>Your next diagnostic question</span>
                    <small>Synthetic case · Sent to OpenAI · Do not enter real student information</small>
                  </label>
                  <div className="probe-composer__input">
                    <textarea
                      id="probe-question"
                      ref={questionRef}
                      value={question}
                      maxLength={300}
                      rows={2}
                      placeholder="Ask something that makes two hypotheses predict different answers…"
                      onChange={(event) => onQuestionChange(event.target.value)}
                      onKeyDown={handleQuestionKeyDown}
                      disabled={waiting}
                    />
                    <button
                      type="button"
                      onClick={onSubmitQuestion}
                      disabled={!question.trim() || waiting}
                      aria-label="Send diagnostic question"
                    >
                      <span aria-hidden="true">↑</span>
                    </button>
                  </div>
                  <div className="probe-composer__meta">
                    <span><kbd>Enter</kbd> send · <kbd>Shift</kbd> + <kbd>Enter</kbd> new line</span>
                    <span>{question.length}/300</span>
                  </div>
                  <div className="composer-actions">
                    <p id="diagnosis-readiness">
                      {completedProbeCount === 0
                        ? "Ask at least one probe before diagnosing."
                        : `${remainingTurns} probe${remainingTurns === 1 ? "" : "s"} left`}
                    </p>
                    <button
                      type="button"
                      className="text-button"
                      onClick={onOpenDiagnosis}
                      disabled={waiting || !canDiagnose}
                      aria-describedby="diagnosis-readiness"
                    >
                      I&apos;m ready to diagnose <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="screen-reader-status" role="status" aria-live="polite" aria-atomic="true">
            {waiting ? "The synthetic learner is preparing a response." : diagnosing ? "Scoring your diagnosis using fixed rules." : ""}
          </div>
          <div className="screen-reader-status" role="status" aria-live="polite" aria-atomic="true">
            {timerAnnouncement}
          </div>
          {error ? <div className="round-error" role="alert"><span aria-hidden="true">!</span>{error}</div> : null}
        </section>

        <CandidateBoard
          candidates={scenario.candidates}
          plausibleCandidateIds={plausibleCandidateIds}
          committedCandidateIds={committedCandidateIds}
          disabled={waiting || diagnosing}
          onToggleCandidate={onToggleCandidate}
        />
      </div>
    </main>
  );
}
