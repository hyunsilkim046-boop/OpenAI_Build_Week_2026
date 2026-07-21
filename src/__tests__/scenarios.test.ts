import { describe, expect, it } from "vitest";

import {
  getServerScenario,
  listPublicScenarios,
} from "../lib/scenarios";

describe("scenario definitions", () => {
  it("provides two unique scenarios with four unique candidates", () => {
    const scenarios = listPublicScenarios();

    expect(scenarios).toHaveLength(2);
    expect(new Set(scenarios.map((scenario) => scenario.id)).size).toBe(2);

    for (const scenario of scenarios) {
      expect(scenario.candidates).toHaveLength(4);
      expect(
        new Set(scenario.candidates.map((candidate) => candidate.id)).size,
      ).toBe(4);
    }
  });

  it("keeps the answer in the server definition and out of public JSON", () => {
    for (const publicScenario of listPublicScenarios()) {
      const serverScenario = getServerScenario(publicScenario.id);

      expect(serverScenario).toBeDefined();
      expect(
        serverScenario?.candidates.some(
          (candidate) =>
            candidate.id === serverScenario.correctDiagnosisId,
        ),
      ).toBe(true);

      const publicJson = JSON.stringify(publicScenario);
      expect(publicJson).not.toContain("correctDiagnosisId");
      expect(publicJson).not.toContain("hiddenBelief");
      expect(publicJson).not.toContain(serverScenario?.hiddenBelief ?? "missing");
    }
  });
});
