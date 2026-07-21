export type StudentResponseMode = "answer" | "uncertain" | "boundary";

export interface PublicCandidate {
  id: string;
  label: string;
  shortDescription: string;
}

export interface PublicScenario {
  id: string;
  title: string;
  subject: string;
  grade: string;
  challenge: string;
  openingAnswer: string;
  candidates: PublicCandidate[];
  accent: string;
}

export interface TranscriptMessage {
  role: "teacher" | "student";
  text: string;
}

export interface SessionState {
  version: 1;
  issuedAt: number;
  roundEndsAt: number;
  expiresAt: number;
  scenarioId: string;
  transcript: TranscriptMessage[];
  candidateHistory: string[][];
  turnCount: number;
}

export interface ScoreBreakdown {
  diagnosis: number;
  candidateDiscipline: number;
  candidateReduction: number;
}

export interface DiagnosisScore {
  score: number;
  total: 100;
  isCorrect: boolean;
  breakdown: ScoreBreakdown;
}
