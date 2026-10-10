export interface AppConfig {
  port: number;
  telemetry: {
    enabled: boolean;
    serviceName: string;
    endpoint: string;
  };
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`Invalid PORT: ${env.PORT ?? "undefined"}`);
  }

  return {
    port,
    telemetry: {
      enabled: env.OTEL_ENABLED === "true",
      serviceName: env.OTEL_SERVICE_NAME ?? "agent-release-gate-platform",
      endpoint:
        env.OTEL_EXPORTER_OTLP_ENDPOINT ??
        "http://localhost:4318/v1/traces",
    },
  };
}
