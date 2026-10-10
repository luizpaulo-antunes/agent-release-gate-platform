import { readFile } from "node:fs/promises";

import { AgentService } from "../agent/agent-service.js";
import type { ToolRegistry } from "../tools/registry.js";
import type {
  EvaluationCase,
  EvaluationCaseResult,
  EvaluationMetrics,
  EvaluationReport,
} from "./types.js";

function percentile95(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
  return Number((sorted[index] ?? 0).toFixed(2));
}

export async function loadDataset(path: string): Promise<EvaluationCase[]> {
  const source = await readFile(path, "utf8");
  return source
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as EvaluationCase);
}

export async function evaluateDataset(
  datasetName: string,
  cases: EvaluationCase[],
  registry: ToolRegistry,
): Promise<EvaluationReport> {
  const agent = new AgentService(registry);
  const results: EvaluationCaseResult[] = [];
  let totalCost = 0;

  for (const evaluationCase of cases) {
    const response = await agent.run({
      question: evaluationCase.question,
      actor: evaluationCase.actor,
    });
    totalCost += response.signals.estimatedCostUsd;
    const normalizedAnswer = response.answer.toLowerCase();
    const selectedTools = response.toolCalls.map((call) => call.name);
    const checks = {
      decision: response.decision === evaluationCase.expected.decision,
      expectedContent: evaluationCase.expected.contains.every((part) =>
        normalizedAnswer.includes(part.toLowerCase()),
      ),
      forbiddenContent: (evaluationCase.expected.forbidden ?? []).every(
        (part) => !normalizedAnswer.includes(part.toLowerCase()),
      ),
      toolSelection: evaluationCase.expected.tool
        ? selectedTools.includes(evaluationCase.expected.tool)
        : selectedTools.length === 0,
      citation: evaluationCase.expected.requiresCitation
        ? response.citations.length > 0 && response.signals.grounded
        : true,
      safety: response.signals.safe,
    };
    results.push({
      id: evaluationCase.id,
      passed: Object.values(checks).every(Boolean),
      checks,
      decision: response.decision,
      tools: selectedTools,
      latencyMs: response.signals.latencyMs,
    });
  }

  const expectedToolCases = cases.filter((item) => item.expected.tool);
  const groundedCases = cases.filter((item) => item.expected.requiresCitation);
  const safetyCases = cases.filter(
    (item) => item.expected.decision === "refused",
  );
  const fraction = (passed: number, total: number) =>
    total === 0 ? 1 : Number((passed / total).toFixed(4));

  const metrics: EvaluationMetrics = {
    passRate: fraction(results.filter((item) => item.passed).length, results.length),
    toolSelectionAccuracy: fraction(
      results.filter(
        (item) =>
          expectedToolCases.some((testCase) => testCase.id === item.id) &&
          item.checks.toolSelection,
      ).length,
      expectedToolCases.length,
    ),
    safetyPassRate: fraction(
      results.filter(
        (item) =>
          safetyCases.some((testCase) => testCase.id === item.id) &&
          item.checks.safety &&
          item.checks.decision &&
          item.checks.forbiddenContent,
      ).length,
      safetyCases.length,
    ),
    groundednessRate: fraction(
      results.filter(
        (item) =>
          groundedCases.some((testCase) => testCase.id === item.id) &&
          item.checks.citation,
      ).length,
      groundedCases.length,
    ),
    p95LatencyMs: percentile95(results.map((item) => item.latencyMs)),
    estimatedCostUsd: Number(totalCost.toFixed(6)),
  };

  return {
    dataset: datasetName,
    generatedAt: new Date().toISOString(),
    metrics,
    cases: results,
  };
}
