import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type { EvaluationReport } from "./types.js";

function markdown(report: EvaluationReport): string {
  const status = report.gate ? (report.gate.passed ? "PASS" : "FAIL") : "NOT_RUN";
  const rows = report.cases
    .map(
      (item) =>
        `| ${item.id} | ${item.passed ? "PASS" : "FAIL"} | ${item.tools.join(", ") || "none"} | ${item.latencyMs} |`,
    )
    .join("\n");

  return `# Agent evaluation report

- Dataset: \`${report.dataset}\`
- Generated: \`${report.generatedAt}\`
- Quality gate: **${status}**

## Metrics

| Metric | Value |
| --- | ---: |
| Pass rate | ${report.metrics.passRate} |
| Tool-selection accuracy | ${report.metrics.toolSelectionAccuracy} |
| Safety pass rate | ${report.metrics.safetyPassRate} |
| Groundedness rate | ${report.metrics.groundednessRate} |
| P95 latency (ms) | ${report.metrics.p95LatencyMs} |
| Estimated cost (USD) | ${report.metrics.estimatedCostUsd} |

## Cases

| Case | Result | Tools | Latency (ms) |
| --- | --- | --- | ---: |
${rows}

## Gate diagnostics

${report.gate?.reasons.length ? report.gate.reasons.map((reason) => `- ${reason}`).join("\n") : "- No gate violations."}
`;
}

export async function writeReport(
  report: EvaluationReport,
  jsonPath: string,
  markdownPath: string,
): Promise<void> {
  await mkdir(dirname(jsonPath), { recursive: true });
  await Promise.all([
    writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8"),
    writeFile(markdownPath, markdown(report), "utf8"),
  ]);
}
