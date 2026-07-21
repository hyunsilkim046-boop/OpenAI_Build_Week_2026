import { ApiError } from "./errors";
import type { ServerScenario } from "./scenarios";

export function requireString(
  value: unknown,
  field: string,
  options: { min?: number; max?: number } = {},
): string {
  if (typeof value !== "string") {
    throw new ApiError(
      "INVALID_REQUEST",
      `${field} must be a string.`,
      400,
    );
  }

  const normalized = value.trim();
  const min = options.min ?? 1;

  if (normalized.length < min) {
    throw new ApiError("INVALID_REQUEST", `${field} cannot be empty.`, 400);
  }

  if (options.max !== undefined && normalized.length > options.max) {
    throw new ApiError(
      "INVALID_REQUEST",
      `${field} must be ${options.max} characters or fewer.`,
      400,
    );
  }

  return normalized;
}

export function normalizeCandidateSelection(
  scenario: ServerScenario,
  value: unknown,
  previousSelection: readonly string[],
): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ApiError(
      "INVALID_CANDIDATES",
      "Keep at least one plausible diagnosis.",
      400,
    );
  }

  if (!value.every((candidateId) => typeof candidateId === "string")) {
    throw new ApiError(
      "INVALID_CANDIDATES",
      "Candidate IDs must be strings.",
      400,
    );
  }

  const selected = value as string[];
  const selectedSet = new Set(selected);

  if (selectedSet.size !== selected.length) {
    throw new ApiError(
      "INVALID_CANDIDATES",
      "Candidate IDs cannot be duplicated.",
      400,
    );
  }

  const validIds = new Set(scenario.candidates.map((candidate) => candidate.id));
  if (selected.some((candidateId) => !validIds.has(candidateId))) {
    throw new ApiError(
      "INVALID_CANDIDATES",
      "One or more candidate IDs are not valid for this scenario.",
      400,
    );
  }

  const previousSet = new Set(previousSelection);
  if (selected.some((candidateId) => !previousSet.has(candidateId))) {
    throw new ApiError(
      "CANDIDATE_REINTRODUCED",
      "A diagnosis removed on an earlier turn cannot be reintroduced.",
      409,
    );
  }

  return scenario.candidates
    .map((candidate) => candidate.id)
    .filter((candidateId) => selectedSet.has(candidateId));
}

export function requireValidDiagnosis(
  scenario: ServerScenario,
  value: unknown,
  plausibleCandidateIds?: readonly string[],
): string {
  const diagnosisId = requireString(value, "diagnosisId", { max: 100 });

  if (!scenario.candidates.some((candidate) => candidate.id === diagnosisId)) {
    throw new ApiError(
      "INVALID_DIAGNOSIS",
      "Choose a diagnosis from this scenario.",
      400,
    );
  }

  if (
    plausibleCandidateIds !== undefined &&
    !plausibleCandidateIds.includes(diagnosisId)
  ) {
    throw new ApiError(
      "DIAGNOSIS_NOT_PLAUSIBLE",
      "Choose a diagnosis that remains in your plausible set.",
      409,
    );
  }

  return diagnosisId;
}
