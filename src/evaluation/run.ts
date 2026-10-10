import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createToolRegistry } from "../tools/create-registry.js";
import { evaluateDataset, loadDataset } from "./evaluator.js";
import { evaluateGate, type QualityGateConfig } from "./gate.js";
import { writeReport } from "./report.js";
import type { EvaluationMetrics } from "./types.js";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const datasetName = "release-gate.v1";
const datasetPath = resolve(projectRoot, `evals/datasets/${datasetName}.jsonl`);
const baselinePath = resolve(projectRoot, "evals/baseline.v1.json");
const gatePath = resolve(projectRoot, "evals/quality-gate.json");
const shouldGate = process.argv.includes("--gate");

const cases = await loadDataset(datasetPath);
const report = await evaluateDataset(datasetName, cases, createToolRegistry());

if (shouldGate) {
  const baseline = JSON.parse(await readFile(baselinePath, "utf8")) as {
    metrics: EvaluationMetrics;
  };
  const gateConfig = JSON.parse(
    await readFile(gatePath, "utf8"),
  ) as QualityGateConfig;
  report.gate = evaluateGate(report.metrics, baseline.metrics, gateConfig);
}

await writeReport(
  report,
  resolve(projectRoot, "reports/latest.json"),
  resolve(projectRoot, "reports/latest.md"),
);

console.log(JSON.stringify(report.metrics, null, 2));
if (report.gate) {
  console.log(
    report.gate.passed
      ? "Quality gate: PASS"
      : `Quality gate: FAIL\n${report.gate.reasons.join("\n")}`,
  );
  if (!report.gate.passed) process.exitCode = 1;
}
