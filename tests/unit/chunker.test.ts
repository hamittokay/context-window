import { describe, it, expect } from "vitest";
import { chunkText } from "../../src/util/chunker.js";

describe("chunkText", () => {
  it("should return empty array for empty text", () => {
    const chunks = chunkText("");
    expect(chunks).toEqual([]);
  });

  it("should return single chunk for text shorter than size", () => {
    const text = "Short text";
    const chunks = chunkText(text, { size: 100, overlap: 10 });
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(text);
  });

  it("should split text into overlapping chunks", () => {
    const text = "0123456789".repeat(20); // 200 chars
    const chunks = chunkText(text, { size: 100, overlap: 20 });

    expect(chunks.length).toBeGreaterThan(1);

    // Check overlap: end of chunk 1 should appear at start of chunk 2
    if (chunks.length > 1) {
      const endOfFirst = chunks[0].slice(-20);
      const startOfSecond = chunks[1].slice(0, 20);
      expect(startOfSecond).toBe(endOfFirst);
    }
  });

  it("should handle zero overlap", () => {
    const text = "0123456789".repeat(20); // 200 chars
    const chunks = chunkText(text, { size: 100, overlap: 0 });

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toHaveLength(100);
    expect(chunks[1]).toHaveLength(100);
  });

  it("should use default size and overlap", () => {
    const text = "a".repeat(2000);
    const chunks = chunkText(text);

    expect(chunks.length).toBeGreaterThan(1);
    // Default size is 1000, so we expect at least 2 chunks
  });

  it("should handle text exactly equal to chunk size", () => {
    const text = "a".repeat(100);
    const chunks = chunkText(text, { size: 100, overlap: 10 });

    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe(text);
  });
});

