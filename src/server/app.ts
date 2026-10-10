import { randomUUID } from "node:crypto";

import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";

import { AgentService } from "../agent/agent-service.js";
import { buildMcpServer } from "../mcp/server.js";
import { AccessDeniedError, ToolContractError } from "../tools/errors.js";
import type { ToolRegistry } from "../tools/registry.js";
import { actorFromRequest } from "./actor.js";

const runSchema = z.object({
  question: z.string().min(2).max(2_000),
});

export function createApp(registry: ToolRegistry) {
  const app = express();
  const agent = new AgentService(registry);

  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));
  app.use((request, response, next) => {
    response.setHeader("x-correlation-id", request.header("x-correlation-id") ?? randomUUID());
    next();
  });

  app.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.post("/v1/agent/run", async (request, response, next) => {
    try {
      const actor = actorFromRequest(request);
      if (!actor) {
        response.status(401).json({
          error: "missing_identity",
          requiredHeaders: ["x-user-id", "x-tenant-id", "x-role"],
        });
        return;
      }
      const parsed = runSchema.safeParse(request.body);
      if (!parsed.success) {
        response.status(400).json({
          error: "invalid_request",
          details: parsed.error.issues.map((issue) => issue.message),
        });
        return;
      }
      response.json(await agent.run({ question: parsed.data.question, actor }));
    } catch (error) {
      next(error);
    }
  });

  app.post("/mcp", async (request, response, next) => {
    const actor = actorFromRequest(request);
    if (!actor) {
      response.status(401).json({ error: "missing_identity" });
      return;
    }

    const server = buildMcpServer(actor, registry);
    const transport = new StreamableHTTPServerTransport({
      enableJsonResponse: true,
    });

    response.on("close", () => {
      void transport.close();
      void server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(request, response, request.body);
    } catch (error) {
      next(error);
    }
  });

  app.get("/mcp", (_request, response) => {
    response.status(405).json({ error: "use_post_for_stateless_mcp" });
  });

  app.use(
    (error: unknown, _request: Request, response: Response, _next: NextFunction) => {
      if (error instanceof AccessDeniedError) {
        response.status(403).json({ error: "access_denied" });
        return;
      }
      if (error instanceof ToolContractError) {
        response.status(400).json({
          error: "tool_contract_error",
          details: error.details,
        });
        return;
      }
      console.error(error);
      response.status(500).json({ error: "internal_error" });
    },
  );

  return app;
}
