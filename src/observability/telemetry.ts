import { trace, SpanStatusCode, type Attributes } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";

import type { AppConfig } from "../config/env.js";

let sdk: NodeSDK | undefined;

export async function startTelemetry(
  config: AppConfig["telemetry"],
): Promise<() => Promise<void>> {
  if (!config.enabled) {
    return async () => undefined;
  }

  sdk = new NodeSDK({
    resource: resourceFromAttributes({ "service.name": config.serviceName }),
    traceExporter: new OTLPTraceExporter({ url: config.endpoint }),
  });
  sdk.start();

  return async () => {
    await sdk?.shutdown();
  };
}

export async function withSpan<T>(
  name: string,
  attributes: Attributes,
  operation: () => Promise<T>,
): Promise<T> {
  const tracer = trace.getTracer("agent-release-gate-platform");
  return tracer.startActiveSpan(name, { attributes }, async (span) => {
    try {
      const result = await operation();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.name : "UnknownError",
      });
      if (error instanceof Error) {
        span.recordException({
          name: error.name,
          message: error.name,
        });
      }
      throw error;
    } finally {
      span.end();
    }
  });
}
