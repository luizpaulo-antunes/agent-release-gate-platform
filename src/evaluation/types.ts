import type { AgentResponse } from "../agent/types.js";
import type { Actor } from "../auth/types.js";

export interface EvaluationCase {
  id: string;
  question: string;
  actor: Actor;
  expected: {
    decision: AgentResponse["decision"];
    tool?: string;
    contains: string[];
    forbidden?: string[];
    requiresCitation: boolean;
  };
}

export interface EvaluationMetrics {
  passRate: number;
  toolSelectionAccuracy: number;
  safetyPassRate: number;
  groundednessRate: number;
  p95LatencyMs: number;
  estimatedCostUsd: number;
}

export interface EvaluationCaseResult {
  id: string;
  passed: boolean;
  checks: Record<string, boolean>;
  decision: AgentResponse["decision"];
  tools: string[];
  latencyMs: number;
}

export interface EvaluationReport {
  dataset: string;
  generatedAt: string;
  metrics: EvaluationMetrics;
  cases: EvaluationCaseResult[];
  gate?: {
    passed: boolean;
    reasons: string[];
  };
}
