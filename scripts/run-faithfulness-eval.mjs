#!/usr/bin/env node

import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIRECTORY, "..");
const FIXTURE_PATH = resolve(PROJECT_ROOT, "evals", "faithfulness-probes.json");
const DEFAULT_BASE_URL = "http://localhost:3000";
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_TRANSIENT_ATTEMPTS = 2;
const CATEGORIES = new Set(["targeted", "misaligned", "generic", "injection"]);

class RunnerError extends Error {
  constructor(message, details = undefined) {
    super(message);
    this.name = "RunnerError";
    this.details = details;
  }
}

function parseArguments(argv) {
  let outputPath;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--help" || argument === "-h") {
      return { help: true };
    }

    if (argument === "--out") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new RunnerError("--out requires a file path.");
      }
      if (outputPath) {
        throw new RunnerError("--out may be supplied only once.");
      }
      outputPath = resolve(process.cwd(), value);
      index += 1;
      continue;
    }

    throw new RunnerError(`Unknown argument: ${argument}`);
  }

  return { help: false, outputPath };
}

function printHelp() {
  process.stdout.write(
    [
      "Run WhyRight's fixed faithfulness suite with predefined review expectations.",
      "",
      "Usage:",
      "  node scripts/run-faithfulness-eval.mjs [--out <report.json>]",
      "",
      "Environment:",
      `  WHYRIGHT_BASE_URL  Running app URL (default: ${DEFAULT_BASE_URL})`,
      "",
      "The runner calls the app over HTTP and does not read an OpenAI API key.",
    ].join("\n"),
  );
}

function parseBaseUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new RunnerError("WHYRIGHT_BASE_URL must be a valid absolute URL.");
  }

  if (!new Set(["http:", "https:"]).has(url.protocol)) {
    throw new RunnerError("WHYRIGHT_BASE_URL must use http or https.");
  }
  if (url.username || url.password) {
    throw new RunnerError("WHYRIGHT_BASE_URL must not contain credentials.");
  }

  url.hash = "";
  url.search = "";
  url.pathname = url.pathname.replace(/\/$/, "");
  return url.toString().replace(/\/$/, "");
}

function requireNonEmptyString(value, field, probeId) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new RunnerError(
      `Probe ${probeId ?? "fixture"} has an invalid ${field}; expected a non-empty string.`,
    );
  }
  return value;
}

function validatePatternList(value, field, probeId) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new RunnerError(
      `Probe ${probeId} has an invalid ${field}; expected an array of strings.`,
    );
  }

  return value.map((pattern) => {
    try {
      return { source: pattern, expression: new RegExp(pattern, "iu") };
    } catch (error) {
      throw new RunnerError(
        `Probe ${probeId} has an invalid ${field} regular expression: ${pattern}`,
        error instanceof Error ? error.message : String(error),
      );
    }
  });
}

function validateFixture(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new RunnerError("The faithfulness fixture must be a JSON object.");
  }

  const suiteVersion = requireNonEmptyString(value.suiteVersion, "suiteVersion");
  if (!Array.isArray(value.probes) || value.probes.length < 8) {
    throw new RunnerError("The fixture must contain at least eight probes.");
  }

  const seenIds = new Set();
  const categoryCoverage = new Map();
  const probes = value.probes.map((probe, index) => {
    if (!probe || typeof probe !== "object" || Array.isArray(probe)) {
      throw new RunnerError(`Probe at index ${index} must be a JSON object.`);
    }

    const id = requireNonEmptyString(probe.id, "id", `index ${index}`);
    if (seenIds.has(id)) {
      throw new RunnerError(`Duplicate probe id: ${id}`);
    }
    seenIds.add(id);

    const scenarioId = requireNonEmptyString(probe.scenarioId, "scenarioId", id);
    const category = requireNonEmptyString(probe.category, "category", id);
    if (!CATEGORIES.has(category)) {
      throw new RunnerError(`Probe ${id} has unsupported category: ${category}`);
    }

    const scenarioCategories = categoryCoverage.get(scenarioId) ?? new Set();
    scenarioCategories.add(category);
    categoryCoverage.set(scenarioId, scenarioCategories);

    return {
      id,
      scenarioId,
      category,
      question: requireNonEmptyString(probe.question, "question", id),
      reviewExpectation: requireNonEmptyString(
        probe.reviewExpectation,
        "reviewExpectation",
        id,
      ),
      mustIncludeAny: validatePatternList(probe.mustIncludeAny, "mustIncludeAny", id),
      mustNotIncludeAny: validatePatternList(
        probe.mustNotIncludeAny,
        "mustNotIncludeAny",
        id,
      ),
      notes: requireNonEmptyString(probe.notes, "notes", id),
    };
  });

  for (const [scenarioId, categories] of categoryCoverage) {
    for (const category of CATEGORIES) {
      if (!categories.has(category)) {
        throw new RunnerError(
          `Scenario ${scenarioId} is missing a ${category} faithfulness probe.`,
        );
      }
    }
  }

  if (categoryCoverage.size < 2) {
    throw new RunnerError("The fixture must cover at least two scenarios.");
  }

  return { suiteVersion, probes };
}

async function fetchJson(baseUrl, path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      signal: controller.signal,
    });
    const text = await response.text();
    let body;
    try {
      body = text === "" ? null : JSON.parse(text);
    } catch {
      throw new RunnerError(`${path} returned non-JSON content.`, {
        status: response.status,
      });
    }

    if (!response.ok) {
      const apiError =
        body && typeof body === "object" && body.error &&
        typeof body.error === "object"
          ? body.error
          : undefined;
      const message =
        typeof body?.error === "string"
          ? body.error
          : typeof apiError?.message === "string"
            ? apiError.message
            : `HTTP ${response.status}`;
      throw new RunnerError(`${path} request failed: ${message}`, {
        status: response.status,
        code:
          typeof apiError?.code === "string"
            ? apiError.code
            : body && typeof body === "object" && typeof body.code === "string"
              ? body.code
            : undefined,
      });
    }

    return body;
  } catch (error) {
    if (error instanceof RunnerError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new RunnerError(`${path} timed out after ${REQUEST_TIMEOUT_MS} ms.`);
    }
    throw new RunnerError(
      `${path} could not be reached.`,
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    clearTimeout(timeout);
  }
}

function requireApiString(value, field, probeId) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new RunnerError(`Probe ${probeId}: API response is missing ${field}.`);
  }
  return value;
}

function getCandidateIds(session, probeId) {
  const candidates = session?.scenario?.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new RunnerError(`Probe ${probeId}: session response has no candidates.`);
  }

  return candidates.map((candidate, index) => {
    if (!candidate || typeof candidate.id !== "string" || candidate.id.trim() === "") {
      throw new RunnerError(
        `Probe ${probeId}: candidate at index ${index} has no valid id.`,
      );
    }
    return candidate.id;
  });
}

function runPatternChecks(reply, includePatterns, excludePatterns) {
  const includeResults = includePatterns.map(({ source, expression }) => ({
    pattern: source,
    matched: expression.test(reply),
  }));
  const excludeResults = excludePatterns.map(({ source, expression }) => ({
    pattern: source,
    matched: expression.test(reply),
  }));
  const includePassed =
    includeResults.length === 0 || includeResults.some((result) => result.matched);
  const excludePassed = excludeResults.every((result) => !result.matched);

  return {
    include: {
      rule: "at-least-one",
      matchedPatterns: includeResults
        .filter((result) => result.matched)
        .map((result) => result.pattern),
      passed: includePassed,
    },
    exclude: {
      rule: "none",
      matchedPatterns: excludeResults
        .filter((result) => result.matched)
        .map((result) => result.pattern),
      passed: excludePassed,
    },
    passed: includePassed && excludePassed,
  };
}

function serializeError(error) {
  return {
    name: error instanceof Error ? error.name : "Error",
    message: error instanceof Error ? error.message : String(error),
    ...(error instanceof RunnerError && error.details !== undefined
      ? { details: error.details }
      : {}),
  };
}

function isTransientApiError(error) {
  return (
    error instanceof RunnerError &&
    typeof error.details === "object" &&
    error.details !== null &&
    "status" in error.details &&
    new Set([429, 503, 504]).has(error.details.status)
  );
}

async function requestTurnWithRetry(baseUrl, payload) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_TRANSIENT_ATTEMPTS; attempt += 1) {
    try {
      const turn = await fetchJson(baseUrl, "/api/turn", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return { turn, attempts: attempt };
    } catch (error) {
      lastError = error;
      if (!isTransientApiError(error) || attempt === MAX_TRANSIENT_ATTEMPTS) {
        throw error;
      }
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 750));
    }
  }

  throw lastError;
}

async function runProbe(baseUrl, probe) {
  const common = {
    id: probe.id,
    scenarioId: probe.scenarioId,
    category: probe.category,
    question: probe.question,
    reviewExpectation: probe.reviewExpectation,
    notes: probe.notes,
  };

  try {
    const session = await fetchJson(baseUrl, "/api/session", {
      method: "POST",
      body: JSON.stringify({ scenarioId: probe.scenarioId }),
    });
    const sessionToken = requireApiString(
      session?.sessionToken,
      "sessionToken",
      probe.id,
    );
    const plausibleCandidateIds = getCandidateIds(session, probe.id);
    const { turn, attempts } = await requestTurnWithRetry(baseUrl, {
        sessionToken,
        question: probe.question,
        plausibleCandidateIds,
    });
    const studentReply = requireApiString(
      turn?.studentReply,
      "studentReply",
      probe.id,
    );
    const responseMode = requireApiString(
      turn?.responseMode,
      "responseMode",
      probe.id,
    );
    const model = requireApiString(turn?.model, "model", probe.id);
    const checks = runPatternChecks(
      studentReply,
      probe.mustIncludeAny,
      probe.mustNotIncludeAny,
    );

    return {
      ...common,
      plausibleCandidateIds,
      studentReply,
      responseMode,
      model,
      attempts,
      checks: {
        include: checks.include,
        exclude: checks.exclude,
      },
      pass: checks.passed,
      requiresHumanReview: true,
    };
  } catch (error) {
    return {
      ...common,
      plausibleCandidateIds: null,
      studentReply: null,
      responseMode: null,
      model: null,
      checks: {
        include: { rule: "at-least-one", matchedPatterns: [], passed: false },
        exclude: { rule: "none", matchedPatterns: [], passed: false },
      },
      pass: false,
      requiresHumanReview: true,
      error: serializeError(error),
    };
  }
}

async function writeReportSafely(outputPath, report) {
  if (outputPath === FIXTURE_PATH) {
    throw new RunnerError("--out must not overwrite the probe fixture.");
  }

  try {
    await access(outputPath);
    throw new RunnerError(
      `Refusing to overwrite an existing report: ${outputPath}`,
    );
  } catch (error) {
    if (error instanceof RunnerError) {
      throw error;
    }
    if (!(error && typeof error === "object" && error.code === "ENOENT")) {
      throw error;
    }
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
    mode: 0o600,
  });
}

async function main() {
  const arguments_ = parseArguments(process.argv.slice(2));
  if (arguments_.help) {
    printHelp();
    return;
  }

  const baseUrl = parseBaseUrl(
    process.env.WHYRIGHT_BASE_URL ?? DEFAULT_BASE_URL,
  );
  const fixtureText = await readFile(FIXTURE_PATH, "utf8");
  let fixtureJson;
  try {
    fixtureJson = JSON.parse(fixtureText);
  } catch (error) {
    throw new RunnerError(
      "The faithfulness probe fixture is not valid JSON.",
      error instanceof Error ? error.message : String(error),
    );
  }
  const fixture = validateFixture(fixtureJson);

  const discovery = await fetchJson(baseUrl, "/api/session");
  if (!Array.isArray(discovery?.scenarios)) {
    throw new RunnerError("GET /api/session did not return a scenarios array.");
  }
  const availableScenarioIds = new Set(
    discovery.scenarios
      .map((scenario) => scenario?.id)
      .filter((id) => typeof id === "string"),
  );
  const missingScenarioIds = [
    ...new Set(
      fixture.probes
        .map((probe) => probe.scenarioId)
        .filter((scenarioId) => !availableScenarioIds.has(scenarioId)),
    ),
  ];
  if (missingScenarioIds.length > 0) {
    throw new RunnerError(
      `The running app is missing fixture scenarios: ${missingScenarioIds.join(", ")}`,
    );
  }

  const startedAt = new Date().toISOString();
  const results = [];
  for (const probe of fixture.probes) {
    results.push(await runProbe(baseUrl, probe));
  }
  const passed = results.filter((result) => result.pass).length;
  const report = {
    reportType: "predefined-expectation-faithfulness-regression",
    suiteVersion: fixture.suiteVersion,
    expectationSource: "fixed-product-contract-co-designed-with-codex",
    modelSelfGradingUsed: false,
    baseUrl,
    startedAt,
    finishedAt: new Date().toISOString(),
    summary: {
      total: results.length,
      passed,
      failed: results.length - passed,
      allAutomaticSignalChecksPassed: passed === results.length,
      humanReviewRequired: true,
    },
    results,
  };

  if (arguments_.outputPath) {
    await writeReportSafely(arguments_.outputPath, report);
  }

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exitCode = passed === results.length ? 0 : 1;
}

main().catch((error) => {
  const fatalReport = {
    reportType: "predefined-expectation-faithfulness-regression",
    modelSelfGradingUsed: false,
    fatal: true,
    error: serializeError(error),
  };
  process.stdout.write(`${JSON.stringify(fatalReport, null, 2)}\n`);
  process.exitCode = 2;
});
