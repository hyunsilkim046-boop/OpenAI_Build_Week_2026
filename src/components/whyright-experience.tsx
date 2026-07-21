"use client";

import { useCallback, useEffect, useState } from "react";
import { GameScreen } from "@/components/game-screen";
import { ResultsScreen } from "@/components/results-screen";
import { StartScreen } from "@/components/start-screen";
import type {
  DiagnoseResponse,
  DiagnosisResult,
  ScenarioSummary,
  SessionStartResponse,
  TranscriptItem,
  TurnResponse,
} from "@/components/whyright-types";

type ExperiencePhase = "start" | "round" | "results";

function readableApiError(error: unknown): string {
  if (
    error instanceof DOMException &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  ) {
    return "That took too long. Check your connection and try once more.";
  }
  if (error instanceof TypeError) {
    return "We couldn't reach the simulator. Check your connection, then try again.";
  }
  if (error instanceof Error) return error.message;
  return "Something interrupted the round. Please try again.";
}

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const timeoutSignal = AbortSignal.timeout(25_000);
  const signal = init?.signal
    ? AbortSignal.any([init.signal, timeoutSignal])
    : timeoutSignal;
  const response = await fetch(url, {
    ...init,
    signal,
    headers: init?.body ? { "Content-Type": "application/json", ...init.headers } : init?.headers,
  });

  const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok) {
    const nestedError = payload?.error;
    const detail =
      typeof nestedError === "object" && nestedError !== null && "message" in nestedError
        ? (nestedError as { message?: unknown }).message
        : nestedError ?? payload?.message;
    if (response.status === 503) {
      throw new Error(typeof detail === "string" ? detail : "The live simulator is not configured yet. Add an OpenAI API key, then try again.");
    }
    if (response.status === 429) {
      throw new Error("The simulator is busy right now. Wait a moment, then retry.");
    }
    throw new Error(typeof detail === "string" ? detail : "The simulator couldn't complete that request.");
  }
  return payload as T;
}

export function WhyRightExperience() {
  const [phase, setPhase] = useState<ExperiencePhase>("start");
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [activeScenario, setActiveScenario] = useState<ScenarioSummary | null>(null);
  const [sessionToken, setSessionToken] = useState("");
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [plausibleCandidateIds, setPlausibleCandidateIds] = useState<string[]>([]);
  const [committedCandidateIds, setCommittedCandidateIds] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [remainingTurns, setRemainingTurns] = useState(3);
  const [secondsLeft, setSecondsLeft] = useState(90);
  const [roundEndsAt, setRoundEndsAt] = useState(0);
  const [diagnosisMode, setDiagnosisMode] = useState(false);
  const [diagnosisId, setDiagnosisId] = useState("");
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [loadingScenarios, setLoadingScenarios] = useState(true);
  const [starting, setStarting] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [diagnosing, setDiagnosing] = useState(false);
  const [scenarioError, setScenarioError] = useState("");
  const [startError, setStartError] = useState("");
  const [roundError, setRoundError] = useState("");
  const [questionFocusRequest, setQuestionFocusRequest] = useState(0);

  const loadScenarios = useCallback(async () => {
    setLoadingScenarios(true);
    setScenarioError("");
    try {
      const data = await apiRequest<{ scenarios: ScenarioSummary[] }>("/api/session");
      setScenarios(data.scenarios);
      setSelectedScenarioId((current) => current || data.scenarios[0]?.id || "");
    } catch (requestError) {
      setScenarioError(readableApiError(requestError));
    } finally {
      setLoadingScenarios(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    apiRequest<{ scenarios: ScenarioSummary[] }>("/api/session", { signal: controller.signal })
      .then((data) => {
        if (ignore) return;
        setScenarios(data.scenarios);
        setSelectedScenarioId(data.scenarios[0]?.id || "");
      })
      .catch((requestError: unknown) => {
        if (!ignore) setScenarioError(readableApiError(requestError));
      })
      .finally(() => {
        if (!ignore) setLoadingScenarios(false);
      });

    return () => {
      ignore = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (phase !== "round" || roundEndsAt <= 0) return;

    const syncClock = () => {
      setSecondsLeft(
        Math.max(0, Math.ceil((roundEndsAt - Date.now()) / 1_000)),
      );
    };
    syncClock();
    const timer = window.setInterval(syncClock, 250);
    return () => window.clearInterval(timer);
  }, [phase, roundEndsAt]);

  async function startRound() {
    if (!selectedScenarioId) return;
    setStarting(true);
    setStartError("");
    try {
      const data = await apiRequest<SessionStartResponse>("/api/session", {
        method: "POST",
        body: JSON.stringify({ scenarioId: selectedScenarioId }),
      });
      setActiveScenario(data.scenario);
      setSessionToken(data.sessionToken);
      setTranscript([{ id: "opening", role: "student", text: data.initialMessage.text }]);
      const initialCandidateIds = data.scenario.candidates.map((candidate) => candidate.id);
      setPlausibleCandidateIds(initialCandidateIds);
      setCommittedCandidateIds(initialCandidateIds);
      setRemainingTurns(data.remainingTurns);
      setRoundEndsAt(data.roundEndsAt);
      setSecondsLeft(
        Math.max(0, Math.ceil((data.roundEndsAt - Date.now()) / 1_000)),
      );
      setDiagnosisMode(false);
      setDiagnosisId("");
      setQuestion("");
      setResult(null);
      setRoundError("");
      setPhase("round");
      window.scrollTo({ top: 0, behavior: "auto" });
    } catch (requestError) {
      setStartError(readableApiError(requestError));
    } finally {
      setStarting(false);
    }
  }

  async function submitQuestion() {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || waiting || !sessionToken || remainingTurns <= 0) return;

    const teacherItem: TranscriptItem = {
      id: `teacher-${transcript.length}-${Date.now()}`,
      role: "teacher",
      text: trimmedQuestion,
    };
    setTranscript((current) => [...current, teacherItem]);
    setQuestion("");
    setWaiting(true);
    setRoundError("");

    try {
      const data = await apiRequest<TurnResponse>("/api/turn", {
        method: "POST",
        body: JSON.stringify({
          sessionToken,
          question: trimmedQuestion,
          plausibleCandidateIds,
        }),
      });
      setSessionToken(data.sessionToken);
      setCommittedCandidateIds(plausibleCandidateIds);
      setTranscript((current) => [
        ...current,
        {
          id: `student-${data.turnNumber}-${Date.now()}`,
          role: "student",
          text: data.studentReply,
          responseMode: data.responseMode,
        },
      ]);
      setRemainingTurns(data.remainingTurns);
      if (data.remainingTurns === 0) setDiagnosisMode(true);
    } catch (requestError) {
      setTranscript((current) => current.filter((item) => item.id !== teacherItem.id));
      setQuestion(trimmedQuestion);
      setRoundError(readableApiError(requestError));
      setQuestionFocusRequest((current) => current + 1);
    } finally {
      setWaiting(false);
    }
  }

  function toggleCandidate(candidateId: string) {
    if (plausibleCandidateIds.includes(candidateId)) {
      if (plausibleCandidateIds.length === 1) return;
      setPlausibleCandidateIds((current) =>
        current.filter((id) => id !== candidateId),
      );
      if (diagnosisId === candidateId) setDiagnosisId("");
      return;
    }

    if (committedCandidateIds.includes(candidateId)) {
      setPlausibleCandidateIds((current) => [...current, candidateId]);
    }
  }

  async function submitDiagnosis() {
    if (!diagnosisId || diagnosing || !sessionToken) return;
    setDiagnosing(true);
    setRoundError("");
    try {
      const data = await apiRequest<DiagnoseResponse>("/api/diagnose", {
        method: "POST",
        body: JSON.stringify({ sessionToken, diagnosisId, plausibleCandidateIds }),
      });
      setResult(data.result);
      setPhase("results");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (requestError) {
      setRoundError(readableApiError(requestError));
    } finally {
      setDiagnosing(false);
    }
  }

  function resetToStart() {
    setPhase("start");
    setActiveScenario(null);
    setSessionToken("");
    setTranscript([]);
    setPlausibleCandidateIds([]);
    setCommittedCandidateIds([]);
    setResult(null);
    setStartError("");
    setRoundError("");
    setQuestion("");
    setDiagnosisMode(false);
    setDiagnosisId("");
    setRoundEndsAt(0);
    setSecondsLeft(90);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (phase === "round" && activeScenario) {
    const effectiveDiagnosisMode = diagnosisMode || secondsLeft === 0;
    const completedProbeCount = 3 - remainingTurns;
    return (
      <GameScreen
        scenario={activeScenario}
        transcript={transcript}
        plausibleCandidateIds={plausibleCandidateIds}
        committedCandidateIds={committedCandidateIds}
        question={question}
        remainingTurns={remainingTurns}
        secondsLeft={secondsLeft}
        waiting={waiting}
        diagnosing={diagnosing}
        diagnosisMode={effectiveDiagnosisMode}
        diagnosisId={diagnosisId}
        completedProbeCount={completedProbeCount}
        error={roundError}
        questionFocusRequest={questionFocusRequest}
        onQuestionChange={setQuestion}
        onSubmitQuestion={submitQuestion}
        onToggleCandidate={toggleCandidate}
        onOpenDiagnosis={() => {
          if (completedProbeCount > 0 || secondsLeft === 0) {
            setDiagnosisMode(true);
          }
        }}
        onCloseDiagnosis={() => setDiagnosisMode(false)}
        onDiagnosisChange={setDiagnosisId}
        onSubmitDiagnosis={submitDiagnosis}
        onExit={resetToStart}
      />
    );
  }

  if (phase === "results" && activeScenario && result) {
    return <ResultsScreen result={result} scenario={activeScenario} onTryAnother={resetToStart} />;
  }

  return (
    <StartScreen
      scenarios={scenarios}
      selectedScenarioId={selectedScenarioId}
      loading={loadingScenarios}
      starting={starting}
      scenarioError={scenarioError}
      startError={startError}
      onSelectScenario={(scenarioId) => {
        setSelectedScenarioId(scenarioId);
        setStartError("");
      }}
      onStart={startRound}
      onRetryScenarios={loadScenarios}
      onRetryStart={startRound}
    />
  );
}
