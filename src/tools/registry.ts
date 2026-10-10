import { Ajv, type JSONSchemaType, type ValidateFunction } from "ajv";

import type { Actor, Role } from "../auth/types.js";
import { fingerprint, redactSensitive } from "../observability/redaction.js";
import { withSpan } from "../observability/telemetry.js";
import {
  AccessDeniedError,
  ToolContractError,
  ToolNotFoundError,
} from "./errors.js";

export interface ToolContext {
  actor: Actor;
}

export interface ToolDefinition<TInput, TOutput> {
  name: string;
  description: string;
  allowedRoles: Role[];
  inputSchema: JSONSchemaType<TInput>;
  outputSchema: JSONSchemaType<TOutput>;
  authorize?: (context: ToolContext, input: TInput) => boolean;
  execute: (context: ToolContext, input: TInput) => Promise<TOutput>;
}

interface RegisteredTool<TInput = unknown, TOutput = unknown> {
  definition: ToolDefinition<TInput, TOutput>;
  validateInput: ValidateFunction<TInput>;
  validateOutput: ValidateFunction<TOutput>;
}

function validationDetails(validate: ValidateFunction): string[] {
  return (validate.errors ?? []).map(
    (error) => `${error.instancePath || "/"} ${error.message ?? "invalid"}`,
  );
}

export class ToolRegistry {
  private readonly tools = new Map<string, RegisteredTool>();
  private readonly ajv = new Ajv({ allErrors: true, strict: true });

  register<TInput, TOutput>(
    definition: ToolDefinition<TInput, TOutput>,
  ): void {
    if (this.tools.has(definition.name)) {
      throw new Error(`Tool already registered: ${definition.name}`);
    }
    this.tools.set(definition.name, {
      definition: definition as ToolDefinition<unknown, unknown>,
      validateInput: this.ajv.compile(definition.inputSchema) as ValidateFunction<unknown>,
      validateOutput: this.ajv.compile(definition.outputSchema) as ValidateFunction<unknown>,
    });
  }

  list(): Array<{ name: string; description: string; allowedRoles: Role[] }> {
    return [...this.tools.values()].map(({ definition }) => ({
      name: definition.name,
      description: definition.description,
      allowedRoles: [...definition.allowedRoles],
    }));
  }

  async call<TOutput = unknown>(
    name: string,
    context: ToolContext,
    input: unknown,
  ): Promise<TOutput> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new ToolNotFoundError(name);
    }
    if (!tool.validateInput(input)) {
      throw new ToolContractError(
        `Input contract failed for ${name}`,
        validationDetails(tool.validateInput),
      );
    }
    if (!tool.definition.allowedRoles.includes(context.actor.role)) {
      throw new AccessDeniedError(`Role ${context.actor.role} cannot call ${name}`);
    }
    if (tool.definition.authorize && !tool.definition.authorize(context, input)) {
      throw new AccessDeniedError(`Tenant boundary denied for ${name}`);
    }

    return withSpan(
      `mcp.tool.${name}`,
      {
        "mcp.tool.name": name,
        "mcp.actor.role": context.actor.role,
        "mcp.actor.fingerprint": fingerprint(context.actor.userId),
        "mcp.input.redacted": JSON.stringify(redactSensitive(input)),
      },
      async () => {
        const output = await tool.definition.execute(context, input);
        if (!tool.validateOutput(output)) {
          throw new ToolContractError(
            `Output contract failed for ${name}`,
            validationDetails(tool.validateOutput),
          );
        }
        return output as TOutput;
      },
    );
  }
}
