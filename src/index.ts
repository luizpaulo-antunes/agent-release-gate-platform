import { loadConfig } from "./config/env.js";
import { startTelemetry } from "./observability/telemetry.js";
import { createApp } from "./server/app.js";
import { createToolRegistry } from "./tools/create-registry.js";

const config = loadConfig();
const shutdownTelemetry = await startTelemetry(config.telemetry);
const app = createApp(createToolRegistry());

const server = app.listen(config.port, () => {
  console.log(`Agent Release Gate Platform listening on http://localhost:${config.port}`);
  console.log(`MCP endpoint: http://localhost:${config.port}/mcp`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`Received ${signal}; shutting down.`);
  server.close(async () => {
    await shutdownTelemetry();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
