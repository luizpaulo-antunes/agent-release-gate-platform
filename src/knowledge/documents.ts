export interface KnowledgeDocument {
  id: string;
  title: string;
  text: string;
}

export const knowledgeDocuments: KnowledgeDocument[] = [
  {
    id: "kb-mcp-authz",
    title: "MCP authorization policy",
    text: "Every MCP tool call must be authorized at execution time using the caller role and tenant. Tool descriptions are not security boundaries, and cross-tenant access must be denied.",
  },
  {
    id: "kb-release-gates",
    title: "AI release gates",
    text: "An AI agent release is blocked when safety pass rate falls below the required threshold, tool-selection accuracy regresses, grounded answers lose citations, or latency exceeds the agreed budget.",
  },
  {
    id: "kb-telemetry",
    title: "Safe AI telemetry",
    text: "Production telemetry must not persist raw prompts, access tokens, secrets, or customer content. Store redacted operational attributes, stable fingerprints, correlation identifiers, latency, and outcome codes instead.",
  },
  {
    id: "kb-resilience",
    title: "Tool resilience",
    text: "Agent tools require bounded timeouts, schema validation, explicit failure responses, retry limits, and idempotency analysis before retries are enabled.",
  },
  {
    id: "kb-evaluation",
    title: "Evaluation datasets",
    text: "LLM evaluation should use versioned development and holdout datasets. Human-reviewed rubrics and calibrated automated checks should be tracked separately from deterministic contract tests.",
  },
];
