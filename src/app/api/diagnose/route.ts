import { ApiError, readJsonObject, toErrorResponse } from "@/lib/errors";
import { getServerScenario } from "@/lib/scenarios";
import { scoreDiagnosis } from "@/lib/score";
import { openSessionToken } from "@/lib/session-token";
import {
  normalizeCandidateSelection,
  requireString,
  requireValidDiagnosis,
} from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await readJsonObject(request);
    const sessionToken = requireString(body.sessionToken, "sessionToken", {
      max: 16_000,
    });
    const state = openSessionToken(sessionToken);
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
    const diagnosisId = requireValidDiagnosis(
      scenario,
      body.diagnosisId,
      plausibleCandidateIds,
    );
    const scoredHistory = [
      ...state.candidateHistory,
      plausibleCandidateIds,
    ];
    const score = scoreDiagnosis(
      scenario,
      diagnosisId,
      scoredHistory,
      state.turnCount,
    );
    const correctDiagnosis = scenario.candidates.find(
      (candidate) => candidate.id === scenario.correctDiagnosisId,
    );

    if (!correctDiagnosis) {
      throw new ApiError("INTERNAL_ERROR", "Scenario is incomplete.", 500);
    }

    return Response.json(
      {
        result: {
          ...score,
          correctDiagnosisId: correctDiagnosis.id,
          correctDiagnosisLabel: correctDiagnosis.label,
          reveal: scenario.reveal,
          clues: [...scenario.clues],
          strongerQuestion: scenario.strongerQuestion,
          transferPrompt: scenario.transferPrompt,
        },
        scenarioId: scenario.id,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
