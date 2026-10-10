import type { JSONSchemaType } from "ajv";

export interface KnowledgeSearchInput {
  query: string;
  limit: number;
}

export interface KnowledgeSearchResult {
  chunks: Array<{
    id: string;
    title: string;
    text: string;
    score: number;
  }>;
}

export interface CustomerRiskInput {
  customerId: string;
  tenantId: string;
}

export interface CustomerRiskResult {
  customerId: string;
  tenantId: string;
  riskLevel: "low" | "medium" | "high";
  reasons: string[];
}

export const knowledgeSearchInputSchema: JSONSchemaType<KnowledgeSearchInput> = {
  type: "object",
  additionalProperties: false,
  required: ["query", "limit"],
  properties: {
    query: { type: "string", minLength: 2, maxLength: 500 },
    limit: { type: "integer", minimum: 1, maximum: 5 },
  },
};

export const knowledgeSearchResultSchema: JSONSchemaType<KnowledgeSearchResult> = {
  type: "object",
  additionalProperties: false,
  required: ["chunks"],
  properties: {
    chunks: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "text", "score"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          text: { type: "string" },
          score: { type: "number", minimum: 0 },
        },
      },
    },
  },
};

export const customerRiskInputSchema: JSONSchemaType<CustomerRiskInput> = {
  type: "object",
  additionalProperties: false,
  required: ["customerId", "tenantId"],
  properties: {
    customerId: { type: "string", pattern: "^cust-[0-9]+$" },
    tenantId: { type: "string", minLength: 1, maxLength: 64 },
  },
};

export const customerRiskResultSchema: JSONSchemaType<CustomerRiskResult> = {
  type: "object",
  additionalProperties: false,
  required: ["customerId", "tenantId", "riskLevel", "reasons"],
  properties: {
    customerId: { type: "string" },
    tenantId: { type: "string" },
    riskLevel: { type: "string", enum: ["low", "medium", "high"] },
    reasons: { type: "array", items: { type: "string" } },
  },
};
