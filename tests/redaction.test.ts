import { describe, expect, it } from "vitest";

import {
  fingerprint,
  redactSensitive,
  safeRequestAttributes,
} from "../src/observability/redaction.js";

describe("trace redaction", () => {
  it("redacts nested secrets and prompt content", () => {
    const source = {
      authorization: "Bearer secret-value",
      nested: {
        prompt: "private customer prompt",
        customerId: "cust-real-123",
        count: 2,
      },
    };
    const serialized = JSON.stringify(redactSensitive(source));

    expect(serialized).not.toContain("secret-value");
    expect(serialized).not.toContain("private customer prompt");
    expect(serialized).not.toContain("cust-real-123");
    expect(serialized).toContain("[REDACTED]");
    expect(serialized).toContain('"count":2');
  });

  it("uses stable fingerprints instead of raw questions", () => {
    const question = "private question";
    const attributes = safeRequestAttributes(question);

    expect(attributes["agent.request.fingerprint"]).toBe(fingerprint(question));
    expect(JSON.stringify(attributes)).not.toContain(question);
  });
});
