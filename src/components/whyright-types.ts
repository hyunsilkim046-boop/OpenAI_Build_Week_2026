export interface MisconceptionCandidate {
  id: string;
  label: string;
  shortDescription: string;
}

export interface ScenarioSummary {
  id: string;
  title: string;
  subject: string;
  grade: string;
  challenge: string;
  openingAnswer: string;
  candidates: MisconceptionCandidate[];
  accent: string;
}

export interface TranscriptItem {
  id: string;
  role: "student" | "teacher";
  text: string;
  responseMode?: string;
}

export interface SessionStartResponse {
  sessionToken: string;
  scenario: ScenarioSummary;
  initialMessage: {
    role: "student";
    text: string;
  };
  remainingTurns: number;
  roundEndsAt: number;
}

export interface TurnResponse {
  sessionToken: string;
  studentReply: string;
  responseMode: string;
  model: string;
  remainingTurns: number;
  turnNumber: number;
}

export interface ScoreBreakdown {
  diagnosis: number;
  candidateDiscipline: number;
  candidateReduction: number;
}

export interface DiagnosisResult {
  score: number;
  total: number;
  isCorrect: boolean;
  correctDiagnosisId: string;
  correctDiagnosisLabel: string;
  breakdown: ScoreBreakdown;
  reveal: string;
  clues: string[];
  strongerQuestion: string;
  transferPrompt: string;
}

export interface DiagnoseResponse {
  result: DiagnosisResult;
  scenarioId: string;
}
