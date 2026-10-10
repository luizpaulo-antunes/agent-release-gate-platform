import { createHash } from "node:crypto";

const sensitiveKey =
  /(authorization|cookie|credential|secret|token|password|prompt|query|message|content|input|output|customer.?id|user.?id|tenant.?id)/i;

export function fingerprint(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex").slice(0, 16)}`;
}

export function redactSensitive(value: unknown, key = "root"): unknown {
  if (sensitiveKey.test(key)) {
    return "[REDACTED]";
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [
        childKey,
        redactSensitive(childValue, childKey),
      ]),
    );
  }
  return value;
}

export function safeRequestAttributes(question: string): Record<string, string | number> {
  return {
    "agent.request.fingerprint": fingerprint(question),
    "agent.request.length": question.length,
  };
}
