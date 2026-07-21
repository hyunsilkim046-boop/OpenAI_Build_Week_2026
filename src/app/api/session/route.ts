import { ApiError, readJsonObject, toErrorResponse } from "@/lib/errors";
import {
  getPublicScenario,
  getServerScenario,
  listPublicScenarios,
} from "@/lib/scenarios";
import {
  createInitialSessionState,
  sealSessionState,
} from "@/lib/session-token";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requireString } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(): Response {
  return Response.json(
    { scenarios: listPublicScenarios() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request): Promise<Response> {
  try {
    enforceRateLimit(request, {
      scope: "session:create",
      limit: 12,
      windowMs: 60_000,
    });
    const body = await readJsonObject(request);
    const scenarioId = requireString(body.scenarioId, "scenarioId", {
      max: 100,
    });
    const scenario = getServerScenario(scenarioId);

    if (!scenario) {
      throw new ApiError(
        "SCENARIO_NOT_FOUND",
        "Choose one of the available scenarios.",
        404,
      );
    }

    const publicScenario = getPublicScenario(scenario.id);
    if (!publicScenario) {
      throw new ApiError("SCENARIO_NOT_FOUND", "Scenario is unavailable.", 404);
    }

    const state = createInitialSessionState(
      scenario.id,
      scenario.openingAnswer,
      scenario.candidates.map((candidate) => candidate.id),
    );

    return Response.json(
      {
        sessionToken: sealSessionState(state),
        scenario: publicScenario,
        initialMessage: { role: "student", text: scenario.openingAnswer },
        remainingTurns: 3,
        roundEndsAt: state.roundEndsAt,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
