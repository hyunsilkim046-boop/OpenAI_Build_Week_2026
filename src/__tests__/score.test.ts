import { describe, expect, it } from "vitest";

import { getServerScenario } from "../lib/scenarios";
import { scoreDiagnosis } from "../lib/score";

const scenario = getServerScenario("fraction-multiplication");

if (!scenario) {
  throw new Error("Test scenario is missing.");
}

const allCandidates = scenario.candidates.map((candidate) => candidate.id);

describe("deterministic diagnosis score", () => {
  it("awards 100 for the correct diagnosis, disciplined retention, and full reduction", () => {
    expect(
      scoreDiagnosis(scenario, scenario.correctDiagnosisId, [
        allCandidates,
        [scenario.correctDiagnosisId],
      ], 1),
    ).toEqual({
      score: 100,
      total: 100,
      isCorrect: true,
      breakdown: {
        diagnosis: 70,
        candidateDiscipline: 10,
        candidateReduction: 20,
      },
    });
  });

  it("rounds proportional wrong-candidate reduction", () => {
    const oneWrongCandidate = allCandidates.find(
      (candidateId) => candidateId !== scenario.correctDiagnosisId,
    );
    expect(oneWrongCandidate).toBeDefined();

    const result = scoreDiagnosis(scenario, scenario.correctDiagnosisId, [
      allCandidates,
      [scenario.correctDiagnosisId, oneWrongCandidate as string],
    ], 1);

    expect(result.breakdown).toEqual({
      diagnosis: 70,
      candidateDiscipline: 10,
      candidateReduction: 13,
    });
    expect(result.score).toBe(93);
  });

  it("does not award diagnosis or discipline after eliminating the answer", () => {
    const wrongCandidate = allCandidates.find(
      (candidateId) => candidateId !== scenario.correctDiagnosisId,
    );
    expect(wrongCandidate).toBeDefined();

    const result = scoreDiagnosis(scenario, wrongCandidate as string, [
      allCandidates,
      [wrongCandidate as string],
    ], 1);

    expect(result.isCorrect).toBe(false);
    expect(result.breakdown.diagnosis).toBe(0);
    expect(result.breakdown.candidateDiscipline).toBe(0);
    expect(result.breakdown.candidateReduction).toBe(13);
    expect(result.score).toBe(13);
  });

  it("caps a zero-probe best guess at 80 by withholding reduction points", () => {
    const result = scoreDiagnosis(
      scenario,
      scenario.correctDiagnosisId,
      [allCandidates, [scenario.correctDiagnosisId]],
      0,
    );

    expect(result.breakdown).toEqual({
      diagnosis: 70,
      candidateDiscipline: 10,
      candidateReduction: 0,
    });
    expect(result.score).toBe(80);
  });
});
