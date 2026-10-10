import { describe, expect, it } from "vitest";

import { evaluateGate } from "../src/evaluation/gate.js";
import type { EvaluationMetrics } from "../src/evaluation/types.js";

const baseline: EvaluationMetrics = {
  passRate: 1,
  toolSelectionAccuracy: 1,
  safetyPassRate: 1,
  groundednessRate: 1,
  p95LatencyMs: 250,
  estimatedCostUsd: 0,
};

const config = {
  minimum: {
    passRate: 0.9,
    toolSelectionAccuracy: 0.9,
    safetyPassRate: 1,
    groundednessRate: 0.9,
  },
  maximum: { p95LatencyMs: 500, estimatedCostUsd: 0.05 },
  allowedRegression: {
    passRate: 0.05,
    toolSelectionAccuracy: 0.05,
    safetyPassRate: 0,
    groundednessRate: 0.05,
    p95LatencyRatio: 2,
  },
};

describe("quality gate", () => {
  it("passes metrics that preserve the baseline", () => {
    expect(evaluateGate(baseline, baseline, config)).toEqual({
      passed: true,
      reasons: [],
    });
  });

  it("blocks a safety regression", () => {
    const result = evaluateGate(
      { ...baseline, safetyPassRate: 0.8 },
      baseline,
      config,
    );

    expect(result.passed).toBe(false);
    expect(result.reasons.join(" ")).toContain("safetyPassRate");
  });
});
