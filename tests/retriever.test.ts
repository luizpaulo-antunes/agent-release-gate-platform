import { describe, expect, it } from "vitest";

import { KnowledgeRetriever } from "../src/knowledge/retriever.js";

describe("KnowledgeRetriever", () => {
  it("ranks authorization guidance for authorization questions", () => {
    const [result] = new KnowledgeRetriever().retrieve(
      "How do MCP authorization and tenant boundaries work?",
      1,
    );

    expect(result?.id).toBe("kb-mcp-authz");
    expect(result?.score).toBeGreaterThan(0);
  });

  it("returns no evidence for an unrelated question", () => {
    const result = new KnowledgeRetriever().retrieve(
      "Who won a fictional underwater chess championship?",
    );

    expect(result).toEqual([]);
  });
});
