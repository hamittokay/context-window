import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the adapters BEFORE importing
vi.mock("../../src/adapters/ai/openai.js", async () => {
  const { createMockEmbed, createMockChat } = await import(
    "../__mocks__/openai.js"
  );
  return {
    createOpenAIEmbed: createMockEmbed,
    createOpenAIChat: createMockChat,
  };
});

vi.mock("../../src/adapters/store/pinecone.js", async () => {
  const {
    createMockUpsert,
    createMockQuery,
    mockEnsurePineconeIndex,
  } = await import("../__mocks__/pinecone.js");
  return {
    ensurePineconeIndex: mockEnsurePineconeIndex,
    createPineconeUpsert: createMockUpsert,
    createPineconeQuery: createMockQuery,
  };
});

// Mock file system operations
vi.mock("fs/promises", () => ({
  stat: vi.fn(async (path: string) => ({
    isFile: () => path.endsWith(".txt") || path.endsWith(".md"),
    isDirectory: () => false,
  })),
  readFile: vi.fn(async () => "Sample document content for testing."),
  readdir: vi.fn(async () => []),
}));

import {
  createCtxWindow,
  getCtxWindow,
  hasCtxWindow,
  deleteCtxWindow,
  clearCtxWindows,
  listCtxWindows,
} from "../../src/core/registry.js";
import { clearMockStore } from "../__mocks__/pinecone.js";

describe("Registry Functions", () => {
  beforeEach(() => {
    clearMockStore();
    clearCtxWindows();
    vi.clearAllMocks();
  });

  describe("createCtxWindow", () => {
    it("should create and register a context window", async () => {
      const cw = await createCtxWindow({
        indexName: "test-index",
        data: ["./test.txt"],
        ai: { provider: "openai" },
        vectorStore: { provider: "pinecone" },
      });

      expect(cw).toBeDefined();
      expect(cw.ask).toBeInstanceOf(Function);
      expect(hasCtxWindow("test-index")).toBe(true);
    });

    it("should allow creating multiple context windows with different names", async () => {
      await createCtxWindow({
        indexName: "index-1",
        data: ["./test1.txt"],
        ai: { provider: "openai" },
        vectorStore: { provider: "pinecone" },
      });

      await createCtxWindow({
        indexName: "index-2",
        data: ["./test2.txt"],
        ai: { provider: "openai" },
        vectorStore: { provider: "pinecone" },
      });

      expect(hasCtxWindow("index-1")).toBe(true);
      expect(hasCtxWindow("index-2")).toBe(true);
      expect(listCtxWindows()).toEqual(["index-1", "index-2"]);
    });
  });

  describe("getCtxWindow", () => {
    it("should retrieve a registered context window", async () => {
      await createCtxWindow({
        indexName: "my-index",
        data: ["./test.txt"],
        ai: { provider: "openai" },
        vectorStore: { provider: "pinecone" },
      });

      const cw = getCtxWindow("my-index");
      expect(cw).toBeDefined();
      expect(cw.ask).toBeInstanceOf(Function);
    });

    it("should create a new connection if context window is not in registry", () => {
      const cw = getCtxWindow("non-existent");
      expect(cw).toBeDefined();
      expect(cw.ask).toBeInstanceOf(Function);
      expect(hasCtxWindow("non-existent")).toBe(true);
    });

    it("should accept optional configuration", () => {
      const cw = getCtxWindow("custom-config", {
        aiModel: "gpt-4",
        topK: 10,
        maxContextChars: 5000,
      });
      expect(cw).toBeDefined();
      expect(cw.ask).toBeInstanceOf(Function);
    });
  });

  describe("hasCtxWindow", () => {
    it("should return true for existing context windows", async () => {
      await createCtxWindow({
        indexName: "exists",
        data: ["./test.txt"],
        ai: { provider: "openai" },
        vectorStore: { provider: "pinecone" },
      });

      expect(hasCtxWindow("exists")).toBe(true);
    });

    it("should return false for non-existing context windows", () => {
      expect(hasCtxWindow("does-not-exist")).toBe(false);
    });
  });

  describe("deleteCtxWindow", () => {
    it("should delete a context window from the registry", async () => {
      await createCtxWindow({
        indexName: "to-delete",
        data: ["./test.txt"],
        ai: { provider: "openai" },
        vectorStore: { provider: "pinecone" },
      });

      expect(hasCtxWindow("to-delete")).toBe(true);
      const deleted = deleteCtxWindow("to-delete");
      expect(deleted).toBe(true);
      expect(hasCtxWindow("to-delete")).toBe(false);
    });

    it("should return false when deleting non-existent context window", () => {
      const deleted = deleteCtxWindow("non-existent");
      expect(deleted).toBe(false);
    });
  });

  describe("clearCtxWindows", () => {
    it("should clear all context windows from the registry", async () => {
      await createCtxWindow({
        indexName: "index-1",
        data: ["./test1.txt"],
        ai: { provider: "openai" },
        vectorStore: { provider: "pinecone" },
      });

      await createCtxWindow({
        indexName: "index-2",
        data: ["./test2.txt"],
        ai: { provider: "openai" },
        vectorStore: { provider: "pinecone" },
      });

      expect(listCtxWindows()).toHaveLength(2);
      clearCtxWindows();
      expect(listCtxWindows()).toHaveLength(0);
    });
  });

  describe("listCtxWindows", () => {
    it("should return an empty array when no context windows exist", () => {
      expect(listCtxWindows()).toEqual([]);
    });

    it("should return all registered context window names", async () => {
      await createCtxWindow({
        indexName: "alpha",
        data: ["./test1.txt"],
        ai: { provider: "openai" },
        vectorStore: { provider: "pinecone" },
      });

      await createCtxWindow({
        indexName: "beta",
        data: ["./test2.txt"],
        ai: { provider: "openai" },
        vectorStore: { provider: "pinecone" },
      });

      const names = listCtxWindows();
      expect(names).toHaveLength(2);
      expect(names).toContain("alpha");
      expect(names).toContain("beta");
    });
  });

  describe("Integration: createCtxWindow + getCtxWindow", () => {
    it("should allow creating and later retrieving a context window", async () => {
      await createCtxWindow({
        indexName: "american-history",
        data: ["./history.txt"],
        ai: { provider: "openai", model: "gpt-4o-mini" },
        vectorStore: { provider: "pinecone" },
      });

      const cw = getCtxWindow("american-history");
      const result = await cw.ask("Test question");

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.sources).toBeInstanceOf(Array);
    });
  });
});

