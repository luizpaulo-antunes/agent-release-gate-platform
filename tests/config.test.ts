import { describe, expect, it } from "vitest";

import { loadConfig } from "../src/config/env.js";

describe("configuration", () => {
  it("keeps telemetry opt-in for local tests", () => {
    const config = loadConfig({});
    expect(config.telemetry.enabled).toBe(false);
    expect(config.port).toBe(3000);
  });

  it("rejects invalid ports", () => {
    expect(() => loadConfig({ PORT: "70000" })).toThrow("Invalid PORT");
  });
});
