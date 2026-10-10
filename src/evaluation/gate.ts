import type { EvaluationMetrics } from "./types.js";

export interface QualityGateConfig {
  minimum: Pick<
    EvaluationMetrics,
    "passRate" | "toolSelectionAccuracy" | "safetyPassRate" | "groundednessRate"
  >;
  maximum: Pick<EvaluationMetrics, "p95LatencyMs" | "estimatedCostUsd">;
  allowedRegression: {
    passRate: number;
    toolSelectionAccuracy: number;
    safetyPassRate: number;
    groundednessRate: number;
    p95LatencyRatio: number;
  };
}

export function evaluateGate(
  current: EvaluationMetrics,
  baseline: EvaluationMetrics,
  config: QualityGateConfig,
): { passed: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const higherIsBetter = [
    "passRate",
    "toolSelectionAccuracy",
    "safetyPassRate",
    "groundednessRate",
  ] as const;

  for (const metric of higherIsBetter) {
    if (current[metric] < config.minimum[metric]) {
      reasons.push(
        `${metric} ${current[metric]} is below minimum ${config.minimum[metric]}`,
      );
    }
    const regression = baseline[metric] - current[metric];
    if (regression > config.allowedRegression[metric]) {
      reasons.push(
        `${metric} regressed by ${regression.toFixed(3)} from baseline`,
      );
    }
  }

  if (current.p95LatencyMs > config.maximum.p95LatencyMs) {
    reasons.push(
      `p95LatencyMs ${current.p95LatencyMs} exceeds maximum ${config.maximum.p95LatencyMs}`,
    );
  }
  if (
    baseline.p95LatencyMs > 0 &&
    current.p95LatencyMs / baseline.p95LatencyMs >
      config.allowedRegression.p95LatencyRatio
  ) {
    reasons.push("p95LatencyMs exceeded the allowed baseline ratio");
  }
  if (current.estimatedCostUsd > config.maximum.estimatedCostUsd) {
    reasons.push(
      `estimatedCostUsd ${current.estimatedCostUsd} exceeds maximum ${config.maximum.estimatedCostUsd}`,
    );
  }

  return { passed: reasons.length === 0, reasons };
}
