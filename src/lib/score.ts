import type { ServerScenario } from "./scenarios";
import type { DiagnosisScore } from "./types";

export function scoreDiagnosis(
  scenario: ServerScenario,
  diagnosisId: string,
  candidateHistory: readonly (readonly string[])[],
  completedProbeCount: number,
): DiagnosisScore {
  const isCorrect = diagnosisId === scenario.correctDiagnosisId;
  const diagnosis = isCorrect ? 70 : 0;

  const candidateDiscipline = candidateHistory.every((candidateSet) =>
    candidateSet.includes(scenario.correctDiagnosisId),
  )
    ? 10
    : 0;

  const finalSelection = candidateHistory.at(-1) ?? [];
  const totalWrongCandidates = Math.max(1, scenario.candidates.length - 1);
  const remainingWrongCandidates = finalSelection.filter(
    (candidateId) => candidateId !== scenario.correctDiagnosisId,
  ).length;
  const removedWrongCandidates = Math.max(
    0,
    totalWrongCandidates - remainingWrongCandidates,
  );
  const candidateReduction =
    completedProbeCount > 0
      ? Math.round((removedWrongCandidates / totalWrongCandidates) * 20)
      : 0;

  return {
    score: diagnosis + candidateDiscipline + candidateReduction,
    total: 100,
    isCorrect,
    breakdown: {
      diagnosis,
      candidateDiscipline,
      candidateReduction,
    },
  };
}
