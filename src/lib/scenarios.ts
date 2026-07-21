import type { PublicScenario } from "./types";

interface CandidateDefinition {
  readonly id: string;
  readonly label: string;
  readonly shortDescription: string;
}

export interface ServerScenario {
  readonly id: string;
  readonly title: string;
  readonly subject: string;
  readonly grade: string;
  readonly challenge: string;
  readonly openingAnswer: string;
  readonly candidates: readonly CandidateDefinition[];
  readonly accent: string;
  readonly correctDiagnosisId: string;
  readonly hiddenBelief: string;
  readonly simulationContext: string;
  readonly reveal: string;
  readonly clues: readonly string[];
  readonly strongerQuestion: string;
  readonly transferPrompt: string;
}

const SCENARIOS = [
  {
    id: "fraction-multiplication",
    title: "The Shrinking Product",
    subject: "Mathematics",
    grade: "Middle school",
    challenge:
      "A student gets 3 × 5 right. Find the rule behind the answer before fractions expose it.",
    openingAnswer: "3 × 5 = 15.",
    accent: "coral",
    candidates: [
      {
        id: "always-larger",
        label: "Multiplication always makes quantities larger",
        shortDescription:
          "The operation is treated as a guarantee that the starting amount grows.",
      },
      {
        id: "repeated-addition-only",
        label: "Multiplication only means repeated addition",
        shortDescription:
          "Whole-number facts are built from equal groups, with no model for fractional multipliers.",
      },
      {
        id: "memorized-fact-no-transfer",
        label: "The fact is memorized without a transferable model",
        shortDescription:
          "The answer is recalled correctly, but the learner has no rule to apply in a new case.",
      },
      {
        id: "multiplier-scales-starting-quantity",
        label: "The multiplier scales the starting quantity",
        shortDescription:
          "Multiplication is understood as scaling, including shrinkage for multipliers below one.",
      },
    ],
    correctDiagnosisId: "always-larger",
    hiddenBelief:
      "Multiplying a positive quantity must make it larger than the quantity it started from. Whole-number multiplication facts still work, but a fractional multiplier is expected to increase the starting amount.",
    simulationContext:
      "The student can recall common whole-number multiplication facts. When asked about one-half times eight, the student predicts a result greater than eight or is surprised by a smaller result. The student does not volunteer the underlying rule unless a focused question brings it out.",
    reveal:
      "The correct answer hid an overgeneralization: the student expects multiplication to enlarge every positive quantity. That pattern works for whole-number factors above one, then fails when a factor lies between zero and one.",
    clues: [
      "A correct whole-number fact does not distinguish procedural recall from a general model.",
      "A factor between zero and one is the fastest discriminating case.",
      "Ask for a prediction before calculation so the student's rule becomes visible.",
    ],
    strongerQuestion:
      "A full recipe uses 12 cups. Without calculating first, will 3/4 × 12 use more than, equal to, or less than 12 cups? Why?",
    transferPrompt:
      "Compare 0.3 × 20 with 1.3 × 20 before calculating. Which product shrinks the starting quantity, which grows it, and why?",
  },
  {
    id: "seasons-distance",
    title: "Two Julys, Two Seasons",
    subject: "Science",
    grade: "Middle school",
    challenge:
      "A student correctly identifies July in Korea as summer. Find the causal model behind that answer.",
    openingAnswer: "July is in summer in Korea.",
    accent: "sky",
    candidates: [
      {
        id: "tilt-direct-heat",
        label: "Axial tilt points a hemisphere toward direct sunlight",
        shortDescription:
          "Sun angle and energy concentration are used as the main explanation.",
      },
      {
        id: "daylight-only",
        label: "Day length alone causes the seasons",
        shortDescription:
          "Longer days are noticed, but sun angle and hemispheres are not connected.",
      },
      {
        id: "distance-causes-seasons",
        label: "Seasons happen because Earth moves closer to the Sun",
        shortDescription:
          "Orbital distance is treated as the direct cause of summer and winter.",
      },
      {
        id: "weather-calendar",
        label: "The calendar month determines the weather",
        shortDescription:
          "Season names are recalled without a physical mechanism.",
      },
    ],
    correctDiagnosisId: "distance-causes-seasons",
    hiddenBelief:
      "Summer occurs when Earth is nearer the Sun and winter occurs when Earth is farther away. Therefore both hemispheres should have roughly the same season at the same time.",
    simulationContext:
      "The student knows July is summer in Korea. When asked about Australia in July, the student expects summer there too or becomes uncertain because the distance explanation cannot account for opposite seasons. The student does not independently invoke axial tilt.",
    reveal:
      "The calendar answer was right for Korea, but the causal model was distance from the Sun. Opposite seasons in the two hemispheres expose the conflict: both hemispheres share essentially the same Earth–Sun distance at any moment.",
    clues: [
      "A memorized month-to-season match does not reveal a causal model.",
      "The two hemispheres provide a decisive comparison while Earth–Sun distance stays shared.",
      "Ask the student to reconcile two locations at the same moment.",
    ],
    strongerQuestion:
      "It is July in both Korea and Australia. Should both places be in summer? What physical difference could make their seasons opposite?",
    transferPrompt:
      "Use axial tilt and sunlight angle to explain why January can be summer in Australia while it is winter in Korea.",
  },
] as const satisfies readonly ServerScenario[];

function toPublicScenario(scenario: ServerScenario): PublicScenario {
  return {
    id: scenario.id,
    title: scenario.title,
    subject: scenario.subject,
    grade: scenario.grade,
    challenge: scenario.challenge,
    openingAnswer: scenario.openingAnswer,
    accent: scenario.accent,
    candidates: scenario.candidates.map((candidate) => ({ ...candidate })),
  };
}

export function listPublicScenarios(): PublicScenario[] {
  return SCENARIOS.map(toPublicScenario);
}

export function getServerScenario(id: string): ServerScenario | undefined {
  return SCENARIOS.find((scenario) => scenario.id === id);
}

export function getPublicScenario(id: string): PublicScenario | undefined {
  const scenario = getServerScenario(id);
  return scenario ? toPublicScenario(scenario) : undefined;
}
