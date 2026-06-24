// Critical-path tests: URL state encoding/decoding round-trip

import { describe, it, expect } from "vitest";
import { encodeState, decodeState } from "@/lib/url-state";

describe("URL State Encoding", () => {
  it("round-trip: encode → decode preserves data", () => {
    const decisions = {
      "has-users": "yes",
      "auth-strategy": "oauth",
      database: "postgresql",
      frontend: "nextjs",
      backend: "serverless",
      deployment: "vercel",
      "api-design": "rest",
      testing: "unit",
    };

    const encoded = encodeState(decisions);
    const decoded = decodeState(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded!.decisions).toEqual(decisions);
  });

  it("handles empty decisions object", () => {
    const encoded = encodeState({});
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.decisions).toEqual({});
  });

  it("handles partial decisions (3 of 8)", () => {
    const decisions = {
      database: "sqlite",
      frontend: "vite-react",
      testing: "manual",
    };

    const encoded = encodeState(decisions);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.decisions).toEqual(decisions);
  });

  it("returns null for invalid base64", () => {
    const decoded = decodeState("!!!not-valid-base64!!!");
    expect(decoded).toBeNull();
  });

  it("returns null for empty string", () => {
    const decoded = decodeState("");
    expect(decoded).toBeNull();
  });

  it("returns null for valid base64 but invalid JSON", () => {
    // base64 of "not json"
    const encoded = Buffer.from("not json", "utf-8").toString("base64");
    const decoded = decodeState(encoded);
    expect(decoded).toBeNull();
  });

  it("returns null for valid JSON but wrong type (array)", () => {
    const encoded = Buffer.from("[1,2,3]", "utf-8").toString("base64");
    const decoded = decodeState(encoded);
    expect(decoded).toBeNull();
  });

  it("encoded output is URL-safe (no +, /, or =)", () => {
    const decisions = { test: "value" };
    const encoded = encodeState(decisions);
    expect(encoded).not.toMatch(/[+/=]/);
  });
});
