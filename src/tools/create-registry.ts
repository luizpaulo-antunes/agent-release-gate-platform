import {
  customerRiskInputSchema,
  customerRiskResultSchema,
  knowledgeSearchInputSchema,
  knowledgeSearchResultSchema,
  type CustomerRiskResult,
} from "../contracts/tool-contracts.js";
import { KnowledgeRetriever } from "../knowledge/retriever.js";
import { ToolRegistry } from "./registry.js";

const customerRiskRecords: CustomerRiskResult[] = [
  {
    customerId: "cust-100",
    tenantId: "tenant-a",
    riskLevel: "low",
    reasons: ["verified identity", "no active fraud alerts"],
  },
  {
    customerId: "cust-200",
    tenantId: "tenant-b",
    riskLevel: "high",
    reasons: ["velocity anomaly", "manual review required"],
  },
];

export function createToolRegistry(
  retriever = new KnowledgeRetriever(),
): ToolRegistry {
  const registry = new ToolRegistry();

  registry.register({
    name: "knowledge_search",
    description: "Search the sanitized quality-engineering knowledge base.",
    allowedRoles: ["viewer", "analyst", "admin"],
    inputSchema: knowledgeSearchInputSchema,
    outputSchema: knowledgeSearchResultSchema,
    execute: async (_context, input) => ({
      chunks: retriever.retrieve(input.query, input.limit),
    }),
  });

  registry.register({
    name: "customer_risk_get",
    description: "Read a synthetic customer risk summary within the caller tenant.",
    allowedRoles: ["analyst", "admin"],
    inputSchema: customerRiskInputSchema,
    outputSchema: customerRiskResultSchema,
    authorize: ({ actor }, input) => actor.tenantId === input.tenantId,
    execute: async (_context, input) => {
      const record = customerRiskRecords.find(
        (candidate) =>
          candidate.customerId === input.customerId &&
          candidate.tenantId === input.tenantId,
      );
      return (
        record ?? {
          customerId: input.customerId,
          tenantId: input.tenantId,
          riskLevel: "medium" as const,
          reasons: ["no synthetic record found", "manual review required"],
        }
      );
    },
  });

  return registry;
}
