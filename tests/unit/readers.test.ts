import { describe, it, expect, vi } from "vitest";
import { isSupportedFile } from "../../src/io/readers.js";

describe("isSupportedFile", () => {
  it("should return true for .txt files", () => {
    expect(isSupportedFile("document.txt")).toBe(true);
    expect(isSupportedFile("path/to/file.txt")).toBe(true);
  });

  it("should return true for .md files", () => {
    expect(isSupportedFile("README.md")).toBe(true);
    expect(isSupportedFile("docs/guide.md")).toBe(true);
  });

  it("should return true for .pdf files", () => {
    expect(isSupportedFile("report.pdf")).toBe(true);
    expect(isSupportedFile("papers/research.pdf")).toBe(true);
  });

  it("should return false for unsupported files", () => {
    expect(isSupportedFile("image.jpg")).toBe(false);
    expect(isSupportedFile("video.mp4")).toBe(false);
    expect(isSupportedFile("archive.zip")).toBe(false);
    expect(isSupportedFile("script.js")).toBe(false);
  });

  it("should be case-insensitive", () => {
    expect(isSupportedFile("FILE.TXT")).toBe(true);
    expect(isSupportedFile("README.MD")).toBe(true);
    expect(isSupportedFile("DOCUMENT.PDF")).toBe(true);
  });
});

// Note: We skip actual file reading tests since they require filesystem access
// In a real-world scenario, you'd use a test fixture directory or mock the fs module

