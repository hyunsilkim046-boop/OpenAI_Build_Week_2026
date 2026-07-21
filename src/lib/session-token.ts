import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

import { ApiError } from "./errors";
import type { SessionState, TranscriptMessage } from "./types";

export const SESSION_TTL_MS = 15 * 60 * 1_000;
export const ROUND_DURATION_MS = 90 * 1_000;
const TOKEN_VERSION = "v1";
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const CLOCK_SKEW_MS = 60_000;

interface TokenOptions {
  now?: number;
  secret?: string;
}

function getSecret(override?: string): string {
  const secret =
    override ?? process.env.SESSION_SECRET ?? process.env.OPENAI_API_KEY;

  if (!secret || secret.trim().length < 16) {
    throw new ApiError(
      "SESSION_NOT_CONFIGURED",
      "Set SESSION_SECRET or OPENAI_API_KEY before starting a session.",
      503,
    );
  }

  return secret;
}

function deriveKey(secret?: string): Buffer {
  return createHash("sha256").update(getSecret(secret), "utf8").digest();
}

function encode(value: Buffer): string {
  return value.toString("base64url");
}

function decode(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

function isTranscriptMessage(value: unknown): value is TranscriptMessage {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    (candidate.role === "teacher" || candidate.role === "student") &&
    typeof candidate.text === "string" &&
    candidate.text.length > 0 &&
    candidate.text.length <= 300
  );
}

function parseSessionState(value: unknown, now: number): SessionState {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ApiError("INVALID_SESSION", "Session token is invalid.", 401);
  }

  const state = value as Record<string, unknown>;
  const transcript = state.transcript;
  const candidateHistory = state.candidateHistory;

  if (
    state.version !== 1 ||
    typeof state.issuedAt !== "number" ||
    !Number.isInteger(state.issuedAt) ||
    typeof state.expiresAt !== "number" ||
    !Number.isInteger(state.expiresAt) ||
    typeof state.roundEndsAt !== "number" ||
    !Number.isInteger(state.roundEndsAt) ||
    typeof state.scenarioId !== "string" ||
    state.scenarioId.length === 0 ||
    state.scenarioId.length > 100 ||
    !Array.isArray(transcript) ||
    !transcript.every(isTranscriptMessage) ||
    !Array.isArray(candidateHistory) ||
    !candidateHistory.every(
      (candidateSet) =>
        Array.isArray(candidateSet) &&
        candidateSet.length > 0 &&
        candidateSet.length <= 4 &&
        candidateSet.every(
          (candidateId) =>
            typeof candidateId === "string" &&
            candidateId.length > 0 &&
            candidateId.length <= 100,
        ),
    ) ||
    typeof state.turnCount !== "number" ||
    !Number.isInteger(state.turnCount) ||
    state.turnCount < 0 ||
    state.turnCount > 3 ||
    transcript.length !== 1 + state.turnCount * 2 ||
    candidateHistory.length !== 1 + state.turnCount ||
    state.expiresAt - state.issuedAt !== SESSION_TTL_MS ||
    state.roundEndsAt - state.issuedAt !== ROUND_DURATION_MS ||
    state.roundEndsAt > state.expiresAt ||
    state.issuedAt > now + CLOCK_SKEW_MS
  ) {
    throw new ApiError("INVALID_SESSION", "Session token is invalid.", 401);
  }

  for (let index = 0; index < transcript.length; index += 1) {
    const expectedRole = index % 2 === 0 ? "student" : "teacher";
    if (transcript[index].role !== expectedRole) {
      throw new ApiError("INVALID_SESSION", "Session token is invalid.", 401);
    }
  }

  for (let index = 1; index < candidateHistory.length; index += 1) {
    const previous = new Set(candidateHistory[index - 1]);
    if (candidateHistory[index].some((id: unknown) => !previous.has(id))) {
      throw new ApiError("INVALID_SESSION", "Session token is invalid.", 401);
    }
  }

  if (state.expiresAt < now) {
    throw new ApiError(
      "SESSION_EXPIRED",
      "This 15-minute session has expired. Start a new round.",
      401,
    );
  }

  return state as unknown as SessionState;
}

export function createInitialSessionState(
  scenarioId: string,
  openingAnswer: string,
  candidateIds: string[],
  now = Date.now(),
): SessionState {
  return {
    version: 1,
    issuedAt: now,
    roundEndsAt: now + ROUND_DURATION_MS,
    expiresAt: now + SESSION_TTL_MS,
    scenarioId,
    transcript: [{ role: "student", text: openingAnswer }],
    candidateHistory: [[...candidateIds]],
    turnCount: 0,
  };
}

export function assertRoundActive(
  state: SessionState,
  now = Date.now(),
): void {
  if (now >= state.roundEndsAt) {
    throw new ApiError(
      "ROUND_EXPIRED",
      "The 90-second interview has ended. Make your final diagnosis.",
      409,
    );
  }
}

export function assertDiagnosisAllowed(
  state: SessionState,
  now = Date.now(),
): void {
  if (state.turnCount === 0 && now < state.roundEndsAt) {
    throw new ApiError(
      "PROBE_REQUIRED",
      "Ask at least one successful probe before diagnosing, or wait for the 90-second round to end.",
      409,
    );
  }
}

export function sealSessionState(
  state: SessionState,
  options: TokenOptions = {},
): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(options.secret), iv, {
    authTagLength: AUTH_TAG_BYTES,
  });
  cipher.setAAD(Buffer.from(TOKEN_VERSION, "utf8"));

  const plaintext = Buffer.from(JSON.stringify(state), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [TOKEN_VERSION, encode(iv), encode(ciphertext), encode(authTag)].join(
    ".",
  );
}

export function openSessionToken(
  token: string,
  options: TokenOptions = {},
): SessionState {
  try {
    const [version, encodedIv, encodedCiphertext, encodedAuthTag, extra] =
      token.split(".");

    if (
      version !== TOKEN_VERSION ||
      !encodedIv ||
      !encodedCiphertext ||
      !encodedAuthTag ||
      extra !== undefined
    ) {
      throw new ApiError("INVALID_SESSION", "Session token is invalid.", 401);
    }

    const iv = decode(encodedIv);
    const ciphertext = decode(encodedCiphertext);
    const authTag = decode(encodedAuthTag);

    if (iv.length !== IV_BYTES || authTag.length !== AUTH_TAG_BYTES) {
      throw new ApiError("INVALID_SESSION", "Session token is invalid.", 401);
    }

    const decipher = createDecipheriv(
      "aes-256-gcm",
      deriveKey(options.secret),
      iv,
      { authTagLength: AUTH_TAG_BYTES },
    );
    decipher.setAAD(Buffer.from(TOKEN_VERSION, "utf8"));
    decipher.setAuthTag(authTag);

    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");

    return parseSessionState(
      JSON.parse(plaintext) as unknown,
      options.now ?? Date.now(),
    );
  } catch (error) {
    if (
      error instanceof ApiError &&
      (error.code === "SESSION_EXPIRED" ||
        error.code === "SESSION_NOT_CONFIGURED")
    ) {
      throw error;
    }

    throw new ApiError("INVALID_SESSION", "Session token is invalid.", 401);
  }
}
