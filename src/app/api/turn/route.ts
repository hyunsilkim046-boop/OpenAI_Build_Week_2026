import { ApiError, readJsonObject, toErrorResponse } from "@/lib/errors";
import { simulateStudentReply } from "@/lib/openai";
import { getServerScenario } from "@/lib/scenarios";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  assertRoundActive,
  openSessionToken,
  sealSessionState,
} from "@/lib/session-token";
import { normalizeCandidateSelection, requireString } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request): Promise<Response> {
  try {
    enforceRateLimit(request, {
      scope: "turn:create",
      limit: 30,
      windowMs: 60_000,
    });
    const body = await readJsonObject(request);
    const sessionToken = requireString(body.sessionToken, "sessionToken", {
      max: 16_000,
    });
    const question = requireString(body.question, "question", { max: 300 });
    const state = openSessionToken(sessionToken);
    assertRoundActive(state);

    if (state.turnCount >= 3) {
      throw new ApiError(
        "TURN_LIMIT_REACHED",
        "You have used all three follow-up questions.",
        409,
      );
    }

    const scenario = getServerScenario(state.scenarioId);
    if (!scenario) {
      throw new ApiError("INVALID_SESSION", "Session token is invalid.", 401);
    }

    const previousCandidates = state.candidateHistory.at(-1);
    if (!previousCandidates) {
      throw new ApiError("INVALID_SESSION", "Session token is invalid.", 401);
    }

    const plausibleCandidateIds = normalizeCandidateSelection(
      scenario,
      body.plausibleCandidateIds,
      previousCandidates,
    );
    const transcriptWithQuestion = [
      ...state.transcript,
      { role: "teacher" as const, text: question },
    ];
    const modelReply = await simulateStudentReply(
      scenario,
      transcriptWithQuestion,
    );
    const turnNumber = state.turnCount + 1;
    const nextState = {
      ...state,
      transcript: [
        ...transcriptWithQuestion,
        { role: "student" as const, text: modelReply.studentReply },
      ],
      candidateHistory: [
        ...state.candidateHistory,
        plausibleCandidateIds,
      ],
      turnCount: turnNumber,
    };

    return Response.json(
      {
        sessionToken: sealSessionState(nextState),
        studentReply: modelReply.studentReply,
        responseMode: modelReply.responseMode,
        model: modelReply.model,
        remainingTurns: 3 - turnNumber,
        turnNumber,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
