import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, describe, expect, it } from "vitest";

import { buildMcpServer } from "../src/mcp/server.js";
import { createToolRegistry } from "../src/tools/create-registry.js";

const resources: Array<{ close: () => Promise<void> }> = [];

afterEach(async () => {
  await Promise.all(resources.splice(0).map((resource) => resource.close()));
});

async function connectedClient(role: "viewer" | "analyst") {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = buildMcpServer(
    { userId: `${role}-1`, tenantId: "tenant-a", role },
    createToolRegistry(),
  );
  const client = new Client({ name: "integration-test", version: "1.0.0" });
  resources.push(client, server);
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return client;
}

describe("MCP protocol integration", () => {
  it("advertises and executes tools through the official SDK", async () => {
    const client = await connectedClient("analyst");
    const tools = await client.listTools();

    expect(tools.tools.map((tool) => tool.name)).toEqual(
      expect.arrayContaining(["knowledge_search", "customer_risk_get"]),
    );

    const result = await client.callTool({
      name: "customer_risk_get",
      arguments: { customerId: "cust-100", tenantId: "tenant-a" },
    });
    expect(result.isError).not.toBe(true);
    expect(JSON.stringify(result.structuredContent)).toContain('"riskLevel":"low"');
  });

  it("returns a protocol error result when policy denies a tool", async () => {
    const client = await connectedClient("viewer");
    const result = await client.callTool({
      name: "customer_risk_get",
      arguments: { customerId: "cust-100", tenantId: "tenant-a" },
    });

    expect(result.isError).toBe(true);
  });
});
