import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import type { Actor } from "../auth/types.js";
import type { CustomerRiskResult, KnowledgeSearchResult } from "../contracts/tool-contracts.js";
import type { ToolRegistry } from "../tools/registry.js";

function asToolResult(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value) }],
    structuredContent: value as Record<string, unknown>,
  };
}

export function buildMcpServer(actor: Actor, registry: ToolRegistry): McpServer {
  const server = new McpServer({
    name: "agent-release-gate-platform",
    version: "0.1.0",
  });

  server.registerTool(
    "knowledge_search",
    {
      title: "Knowledge Search",
      description: "Search sanitized quality-engineering guidance.",
      inputSchema: {
        query: z.string().min(2).max(500),
        limit: z.number().int().min(1).max(5).default(3),
      },
    },
    async (input) =>
      asToolResult(
        await registry.call<KnowledgeSearchResult>(
          "knowledge_search",
          { actor },
          input,
        ),
      ),
  );

  server.registerTool(
    "customer_risk_get",
    {
      title: "Customer Risk Lookup",
      description:
        "Read synthetic risk data. Enforces role and tenant boundaries at execution time.",
      inputSchema: {
        customerId: z.string().regex(/^cust-[0-9]+$/),
        tenantId: z.string().min(1).max(64),
      },
    },
    async (input) =>
      asToolResult(
        await registry.call<CustomerRiskResult>(
          "customer_risk_get",
          { actor },
          input,
        ),
      ),
  );

  return server;
}
