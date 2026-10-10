import { describe, expect, it } from "vitest";

import { createToolRegistry } from "../src/tools/create-registry.js";
import {
  AccessDeniedError,
  ToolContractError,
} from "../src/tools/errors.js";

const analyst = {
  actor: { userId: "analyst-1", tenantId: "tenant-a", role: "analyst" as const },
};

describe("ToolRegistry", () => {
  it("enforces input schemas", async () => {
    await expect(
      createToolRegistry().call("knowledge_search", analyst, {
        query: "MCP authorization",
        limit: 3,
        unexpected: true,
      }),
    ).rejects.toBeInstanceOf(ToolContractError);
  });

  it("denies a viewer from the risk tool", async () => {
    await expect(
      createToolRegistry().call(
        "customer_risk_get",
        {
          actor: {
            userId: "viewer-1",
            tenantId: "tenant-a",
            role: "viewer",
          },
        },
        { customerId: "cust-100", tenantId: "tenant-a" },
      ),
    ).rejects.toBeInstanceOf(AccessDeniedError);
  });

  it("enforces tenant isolation", async () => {
    await expect(
      createToolRegistry().call("customer_risk_get", analyst, {
        customerId: "cust-200",
        tenantId: "tenant-b",
      }),
    ).rejects.toBeInstanceOf(AccessDeniedError);
  });

  it("returns contract-valid data to an authorized analyst", async () => {
    const result = await createToolRegistry().call<{
      riskLevel: string;
    }>("customer_risk_get", analyst, {
      customerId: "cust-100",
      tenantId: "tenant-a",
    });

    expect(result.riskLevel).toBe("low");
  });
});
