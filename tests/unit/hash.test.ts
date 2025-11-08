import { describe, it, expect } from "vitest";
import { stableHash } from "../../src/util/hash.js";

describe("stableHash", () => {
  it("should generate consistent hashes for the same input", () => {
    const input = "test-file.txt#0:first 64 characters";
    const hash1 = stableHash(input);
    const hash2 = stableHash(input);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(40); // SHA-1 hex is 40 chars
  });

  it("should generate different hashes for different inputs", () => {
    const hash1 = stableHash("input-1");
    const hash2 = stableHash("input-2");

    expect(hash1).not.toBe(hash2);
  });

  it("should handle empty strings", () => {
    const hash = stableHash("");
    expect(hash).toHaveLength(40);
  });

  it("should handle unicode characters", () => {
    const hash = stableHash("Hello 世界 🌍");
    expect(hash).toHaveLength(40);
  });
});

