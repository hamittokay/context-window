import OpenAI from "openai";
import type { EmbedFn, ChatFn } from "./types.js";

/**
 * Get OpenAI API key from environment
 * @throws Error if OPENAI_API_KEY is not set
 */
function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error(
      "OPENAI_API_KEY environment variable is required. Get your key from https://platform.openai.com/api-keys"
    );
  }
  return key;
}

let openaiClient: OpenAI | null = null;

/**
 * Get or create OpenAI client instance
 */
function getClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: getOpenAIKey(),
    });
  }
  return openaiClient;
}

/**
 * Create an embedding function using OpenAI's text-embedding-3-small model.
 * Returns 1536-dimensional vectors by default.
 *
 * @param model - The embedding model to use (default: "text-embedding-3-small")
 * @returns An embedding function
 *
 * @example
 * ```ts
 * const embed = createOpenAIEmbed();
 * const vectors = await embed(["hello", "world"]);
 * // vectors.length === 2, vectors[0].length === 1536
 * ```
 */
export function createOpenAIEmbed(
  model = "text-embedding-3-small"
): EmbedFn {
  return async (texts: string[]): Promise<number[][]> => {
    if (texts.length === 0) {
      return [];
    }

    const client = getClient();

    try {
      const response = await client.embeddings.create({
        model,
        input: texts,
      });

      return response.data.map((item) => item.embedding);
    } catch (error) {
      throw new Error(`OpenAI embedding failed: ${error}`);
    }
  };
}

/**
 * Create a chat function using OpenAI's chat completion API.
 *
 * @returns A chat function
 *
 * @example
 * ```ts
 * const chat = createOpenAIChat();
 * const answer = await chat({
 *   model: "gpt-4o-mini",
 *   system: "You are a helpful assistant.",
 *   user: "What is 2+2?"
 * });
 * ```
 */
export function createOpenAIChat(): ChatFn {
  return async ({ model, system, user }): Promise<string> => {
    const client = getClient();

    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.1, // Low temperature for more consistent, factual responses
      });

      return response.choices[0]?.message?.content || "";
    } catch (error) {
      throw new Error(`OpenAI chat completion failed: ${error}`);
    }
  };
}

