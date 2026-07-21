import { describe, expect, it } from "vitest";

import { ApiError } from "../lib/errors";
import {
  assertDiagnosisAllowed,
  assertRoundActive,
  createInitialSessionState,
  openSessionToken,
  ROUND_DURATION_MS,
  sealSessionState,
  SESSION_TTL_MS,
} from "../lib/session-token";

const TEST_SECRET = "test-only-session-secret-at-least-32-characters";
const NOW = 1_800_000_000_000;

function makeState() {
  return createInitialSessionState(
    "fraction-multiplication",
    "3 × 5 = 15.",
    ["a", "b", "c", "d"],
    NOW,
  );
}

describe("encrypted session tokens", () => {
  it("round-trips a valid state", () => {
    const state = makeState();
    const token = sealSessionState(state, { secret: TEST_SECRET });

    expect(
      openSessionToken(token, { now: NOW + 1_000, secret: TEST_SECRET }),
    ).toEqual(state);
    expect(token).not.toContain(state.scenarioId);
    expect(token).not.toContain(state.transcript[0].text);
  });

  it("rejects a modified ciphertext", () => {
    const token = sealSessionState(makeState(), { secret: TEST_SECRET });
    const parts = token.split(".");
    parts[2] = `${parts[2][0] === "A" ? "B" : "A"}${parts[2].slice(1)}`;

    expect(() =>
      openSessionToken(parts.join("."), {
        now: NOW + 1_000,
        secret: TEST_SECRET,
      }),
    ).toThrowError(ApiError);

    try {
      openSessionToken(parts.join("."), {
        now: NOW + 1_000,
        secret: TEST_SECRET,
      });
    } catch (error) {
      expect(error).toMatchObject({ code: "INVALID_SESSION", status: 401 });
    }
  });

  it("rejects a token after the fixed 15-minute lifetime", () => {
    const token = sealSessionState(makeState(), { secret: TEST_SECRET });

    expect(() =>
      openSessionToken(token, {
        now: NOW + SESSION_TTL_MS + 1,
        secret: TEST_SECRET,
      }),
    ).toThrowError(ApiError);

    try {
      openSessionToken(token, {
        now: NOW + SESSION_TTL_MS + 1,
        secret: TEST_SECRET,
      });
    } catch (error) {
      expect(error).toMatchObject({ code: "SESSION_EXPIRED", status: 401 });
    }
  });

  it("keeps diagnosis available but blocks probes after 90 seconds", () => {
    const state = makeState();
    const token = sealSessionState(state, { secret: TEST_SECRET });
    const afterRound = openSessionToken(token, {
      now: NOW + ROUND_DURATION_MS,
      secret: TEST_SECRET,
    });

    expect(afterRound).toEqual(state);
    expect(() =>
      assertRoundActive(afterRound, NOW + ROUND_DURATION_MS),
    ).toThrowError(ApiError);

    try {
      assertRoundActive(afterRound, NOW + ROUND_DURATION_MS);
    } catch (error) {
      expect(error).toMatchObject({ code: "ROUND_EXPIRED", status: 409 });
    }
  });

  it("requires a successful probe before diagnosis while the round is active", () => {
    const state = makeState();

    expect(() => assertDiagnosisAllowed(state, NOW + 1_000)).toThrowError(
      ApiError,
    );

    try {
      assertDiagnosisAllowed(state, NOW + 1_000);
    } catch (error) {
      expect(error).toMatchObject({ code: "PROBE_REQUIRED", status: 409 });
    }
  });

  it("allows diagnosis after a successful probe or when the round expires", () => {
    const initialState = makeState();
    const probedState = {
      ...initialState,
      transcript: [
        ...initialState.transcript,
        { role: "teacher" as const, text: "Why?" },
        { role: "student" as const, text: "Because it gets bigger." },
      ],
      candidateHistory: [
        ...initialState.candidateHistory,
        [...initialState.candidateHistory[0]],
      ],
      turnCount: 1,
    };

    expect(() => assertDiagnosisAllowed(probedState, NOW + 1_000)).not.toThrow();
    expect(() =>
      assertDiagnosisAllowed(initialState, NOW + ROUND_DURATION_MS),
    ).not.toThrow();
  });

  it("rejects a token with a forged round deadline", () => {
    const state = { ...makeState(), roundEndsAt: NOW + ROUND_DURATION_MS + 1 };
    const token = sealSessionState(state, { secret: TEST_SECRET });

    expect(() =>
      openSessionToken(token, { now: NOW + 1_000, secret: TEST_SECRET }),
    ).toThrowError(ApiError);
  });
});
