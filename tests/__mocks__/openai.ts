import type { EmbedFn, ChatFn } from "../../src/adapters/ai/types.js";

/**
 * Mock embedding function that returns deterministic vectors
 */
export function createMockEmbed(): EmbedFn {
  return async (texts: string[]): Promise<number[][]> => {
    // Generate deterministic vectors based on text content
    return texts.map((text) => {
      const seed = text.length + text.charCodeAt(0);
      const vector = new Array(1536).fill(0).map((_, i) => {
        // Simple deterministic pseudo-random number based on seed and index
        return Math.sin(seed * (i + 1)) * 0.5 + 0.5;
      });
      return vector;
    });
  };
}

/**
 * Mock chat function that returns a simple response
 */
export function createMockChat(): ChatFn {
  return async ({ user }): Promise<string> => {
    // Simple mock response that includes the question
    return `Mock answer to: ${user}. Based on the provided context, this is a test response. [source.txt]`;
  };
}

