import type {
  CustomerRiskResult,
  KnowledgeSearchResult,
} from "../contracts/tool-contracts.js";
import { safeRequestAttributes } from "../observability/redaction.js";
import { withSpan } from "../observability/telemetry.js";
import { DeterministicProvider } from "../providers/deterministic-provider.js";
import { AccessDeniedError, ToolContractError } from "../tools/errors.js";
import type { ToolRegistry } from "../tools/registry.js";
import { detectUnsafeInstruction } from "./security.js";
import type { AgentRequest, AgentResponse, AgentToolCall } from "./types.js";

function parseCustomerRequest(question: string):
  | { customerId: string; tenantId: string }
  | undefined {
  const customerId = question.match(/cust-[0-9]+/i)?.[0]?.toLowerCase();
  const tenantId = question.match(/tenant-[a-z0-9-]+/i)?.[0]?.toLowerCase();
  if (!customerId || !tenantId) {
    return undefined;
  }
  return { customerId, tenantId };
}

function mentionsCustomerRisk(question: string): boolean {
  return /(customer|account).*(risk|fraud)|(?:risk|fraud).*(customer|account)/i.test(
    question,
  );
}

export class AgentService {
  constructor(
    private readonly registry: ToolRegistry,
    private readonly provider = new DeterministicProvider(),
  ) {}

  async run(request: AgentRequest): Promise<AgentResponse> {
    const startedAt = performance.now();

    return withSpan(
      "agent.run",
      {
        ...safeRequestAttributes(request.question),
        "agent.actor.role": request.actor.role,
      },
      async () => {
        const unsafeReason = detectUnsafeInstruction(request.question);
        if (unsafeReason) {
          return this.finish(startedAt, {
            decision: "refused",
            answer:
              "I cannot follow instructions that attempt to bypass policy or expose protected data.",
            citations: [],
            toolCalls: [],
            safe: true,
          });
        }

        if (mentionsCustomerRisk(request.question)) {
          return this.runCustomerRisk(request, startedAt);
        }
        return this.runKnowledgeSearch(request, startedAt);
      },
    );
  }

  private async runCustomerRisk(
    request: AgentRequest,
    startedAt: number,
  ): Promise<AgentResponse> {
    const parsed = parseCustomerRequest(request.question);
    if (!parsed) {
      return this.finish(startedAt, {
        decision: "refused",
        answer:
          "A customer risk lookup requires explicit synthetic customer and tenant identifiers.",
        citations: [],
        toolCalls: [],
        safe: true,
      });
    }

    const toolCalls: AgentToolCall[] = [
      { name: "customer_risk_get", outcome: "success" },
    ];
    try {
      const result = await this.registry.call<CustomerRiskResult>(
        "customer_risk_get",
        { actor: request.actor },
        parsed,
      );
      return this.finish(startedAt, {
        decision: "answered",
        answer: `Customer ${result.customerId} has ${result.riskLevel} risk. Reasons: ${result.reasons.join(
          ", ",
        )}.`,
        citations: [`synthetic-risk:${result.customerId}`],
        toolCalls,
        safe: true,
      });
    } catch (error) {
      toolCalls[0] = {
        name: "customer_risk_get",
        outcome:
          error instanceof ToolContractError ? "contract_error" : "denied",
      };
      if (error instanceof AccessDeniedError || error instanceof ToolContractError) {
        return this.finish(startedAt, {
          decision: "refused",
          answer:
            "The customer risk request was denied by authorization or contract policy.",
          citations: [],
          toolCalls,
          safe: true,
        });
      }
      throw error;
    }
  }

  private async runKnowledgeSearch(
    request: AgentRequest,
    startedAt: number,
  ): Promise<AgentResponse> {
    const toolCalls: AgentToolCall[] = [
      { name: "knowledge_search", outcome: "success" },
    ];
    const result = await this.registry.call<KnowledgeSearchResult>(
      "knowledge_search",
      { actor: request.actor },
      { query: request.question, limit: 3 },
    );
    const generated = this.provider.answerFromKnowledge(result);
    return this.finish(startedAt, {
      decision: "answered",
      answer: generated.answer,
      citations: generated.citations,
      toolCalls,
      safe: true,
    });
  }

  private finish(
    startedAt: number,
    response: Omit<AgentResponse, "signals"> & { safe: boolean },
  ): AgentResponse {
    const { safe, ...rest } = response;
    return {
      ...rest,
      signals: {
        grounded: response.citations.length > 0,
        safe,
        latencyMs: Number((performance.now() - startedAt).toFixed(2)),
        estimatedCostUsd: 0,
      },
    };
  }
}
