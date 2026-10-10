import type { Actor } from "../auth/types.js";

export interface AgentRequest {
  question: string;
  actor: Actor;
}

export interface AgentToolCall {
  name: string;
  outcome: "success" | "denied" | "contract_error";
}

export interface AgentResponse {
  decision: "answered" | "refused";
  answer: string;
  citations: string[];
  toolCalls: AgentToolCall[];
  signals: {
    grounded: boolean;
    safe: boolean;
    latencyMs: number;
    estimatedCostUsd: number;
  };
}
