import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { POST } from "../app/api/diagnose/route";
import { getServerScenario } from "../lib/scenarios";
import {
  createInitialSessionState,
  ROUND_DURATION_MS,
  sealSessionState,
} from "../lib/session-token";

const TEST_SECRET = "test-only-session-secret-at-least-32-characters";
const originalSessionSecret = process.env.SESSION_SECRET;
const loadedScenario = getServerScenario("fraction-multiplication");

if (!loadedScenario) {
  throw new Error("Test scenario is missing.");
}

const scenario = loadedScenario;
const allCandidates = scenario.candidates.map((candidate) => candidate.id);

function diagnoseRequest(sessionToken: string): Request {
  return new Request("https://whyright.test/api/diagnose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionToken,
      diagnosisId: scenario.correctDiagnosisId,
      plausibleCandidateIds: allCandidates,
    }),
  });
}

describe("diagnosis readiness guard", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    if (originalSessionSecret === undefined) {
      delete process.env.SESSION_SECRET;
    } else {
      process.env.SESSION_SECRET = originalSessionSecret;
    }
  });

  it("returns a stable 409 before any successful probe", async () => {
    const state = createInitialSessionState(
      scenario.id,
      scenario.openingAnswer,
      allCandidates,
    );
    const sessionToken = sealSessionState(state, { secret: TEST_SECRET });

    const response = await POST(diagnoseRequest(sessionToken));

    expect(response.status).toBe(409);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "PROBE_REQUIRED",
        message:
          "Ask at least one successful probe before diagnosing, or wait for the 90-second round to end.",
      },
    });
  });

  it("allows a zero-probe diagnosis once the round has expired", async () => {
    const state = createInitialSessionState(
      scenario.id,
      scenario.openingAnswer,
      allCandidates,
      Date.now() - ROUND_DURATION_MS,
    );
    const sessionToken = sealSessionState(state, { secret: TEST_SECRET });

    const response = await POST(diagnoseRequest(sessionToken));
    const payload = (await response.json()) as {
      result: { score: number; breakdown: { candidateReduction: number } };
    };

    expect(response.status).toBe(200);
    expect(payload.result.score).toBe(80);
    expect(payload.result.breakdown.candidateReduction).toBe(0);
  });
});
