import { describe, expect, it } from "vitest";

import { ApiError } from "../lib/errors";
import { getServerScenario } from "../lib/scenarios";
import {
  normalizeCandidateSelection,
  requireValidDiagnosis,
} from "../lib/validation";

const scenario = getServerScenario("seasons-distance");

if (!scenario) {
  throw new Error("Test scenario is missing.");
}

const allCandidates = scenario.candidates.map((candidate) => candidate.id);

describe("candidate-set monotonicity", () => {
  it("accepts an unchanged set or a non-empty subset", () => {
    expect(
      normalizeCandidateSelection(scenario, allCandidates, allCandidates),
    ).toEqual(allCandidates);
    expect(
      normalizeCandidateSelection(
        scenario,
        [allCandidates[0], allCandidates[2]],
        allCandidates,
      ),
    ).toEqual([allCandidates[0], allCandidates[2]]);
  });

  it("rejects reintroducing a previously removed candidate", () => {
    const previous = allCandidates.slice(0, 2);

    expect(() =>
      normalizeCandidateSelection(
        scenario,
        [previous[0], allCandidates[3]],
        previous,
      ),
    ).toThrowError(ApiError);

    try {
      normalizeCandidateSelection(
        scenario,
        [previous[0], allCandidates[3]],
        previous,
      );
    } catch (error) {
      expect(error).toMatchObject({ code: "CANDIDATE_REINTRODUCED" });
    }
  });

  it("rejects empty, duplicate, and unknown candidate sets", () => {
    expect(() =>
      normalizeCandidateSelection(scenario, [], allCandidates),
    ).toThrowError(ApiError);
    expect(() =>
      normalizeCandidateSelection(
        scenario,
        [allCandidates[0], allCandidates[0]],
        allCandidates,
      ),
    ).toThrowError(ApiError);
    expect(() =>
      normalizeCandidateSelection(scenario, ["not-a-candidate"], allCandidates),
    ).toThrowError(ApiError);
  });
});

describe("final diagnosis validation", () => {
  it("accepts only candidates that remain plausible", () => {
    const plausible = [allCandidates[0], allCandidates[2]];

    expect(
      requireValidDiagnosis(scenario, allCandidates[0], plausible),
    ).toBe(allCandidates[0]);
    expect(() =>
      requireValidDiagnosis(scenario, allCandidates[1], plausible),
    ).toThrowError(ApiError);

    try {
      requireValidDiagnosis(scenario, allCandidates[1], plausible);
    } catch (error) {
      expect(error).toMatchObject({
        code: "DIAGNOSIS_NOT_PLAUSIBLE",
        status: 409,
      });
    }
  });
});
