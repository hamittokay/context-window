import type {
  CreateContextWindowOptions,
  ContextWindow,
  AskResult,
  NormalizedOptions,
} from "../types.js";
import { createOpenAIEmbed, createOpenAIChat } from "../adapters/ai/openai.js";
import {
  ensurePineconeIndex,
  createPineconeUpsert,
  createPineconeQuery,
} from "../adapters/store/pinecone.js";
import { ingestPaths } from "../io/ingest.js";

/**
 * Normalize and validate options with defaults
 */
function normalizeOptions(opts: CreateContextWindowOptions): NormalizedOptions {
  const dataPaths = Array.isArray(opts.data) ? opts.data : [opts.data];
  const aiModel = opts.ai?.model || "gpt-4o-mini";
  const namespace = opts.vectorStore?.namespace || opts.indexName;
  const chunkSize = opts.chunk?.size || 1000;
  const chunkOverlap = opts.chunk?.overlap || 150;
  const topK = opts.limits?.topK || 8;
  const maxContextChars = opts.limits?.maxContextChars || 8000;
  const scoreThreshold = opts.limits?.scoreThreshold || 0;

  if (!opts.indexName) {
    throw new Error("indexName is required");
  }

  if (dataPaths.length === 0) {
    throw new Error("at least one data path is required");
  }

  return {
    indexName: opts.indexName,
    dataPaths,
    aiModel,
    namespace,
    chunkSize,
    chunkOverlap,
    topK,
    maxContextChars,
    scoreThreshold,
  };
}

/**
 * Pack context from query matches, respecting maxContextChars limit.
 * Returns the packed context text and unique source filenames.
 */
function packContext(
  matches: Array<{ metadata: { text: string; source: string } }>,
  maxContextChars: number
): { context: string; sources: string[] } {
  const chunks: string[] = [];
  const sources: string[] = [];
  const seenSources = new Set<string>();
  let totalChars = 0;

  for (const match of matches) {
    const chunk = match.metadata.text;
    const source = match.metadata.source;

    // Check if adding this chunk would exceed the limit
    if (totalChars + chunk.length > maxContextChars) {
      break;
    }

    chunks.push(chunk);
    totalChars += chunk.length;

    // Track unique sources in order of appearance
    if (!seenSources.has(source)) {
      sources.push(source);
      seenSources.add(source);
    }
  }

  return {
    context: chunks.join("\n\n---\n\n"),
    sources,
  };
}

/**
 * Build the system prompt for strict RAG
 */
function buildSystemPrompt(context: string): string {
  return `You are a strict RAG assistant.

Answer ONLY using the provided context. If not fully supported,
say: "I don't know based on the uploaded files."
Cite sources like [filename]. Keep answers concise.

Context:
${context}`;
}

/**
 * Create a context window instance without ingesting data.
 * This is useful for connecting to an existing Pinecone namespace.
 *
 * @param indexName - The index/namespace name
 * @param options - Optional configuration overrides
 * @returns A ContextWindow instance
 *
 * @internal
 */
export function createContextWindowWithoutIngestion(
  indexName: string,
  options?: {
    aiModel?: string;
    namespace?: string;
    topK?: number;
    maxContextChars?: number;
    scoreThreshold?: number;
  }
): ContextWindow {
  const config = {
    aiModel: options?.aiModel || "gpt-4o-mini",
    namespace: options?.namespace || indexName,
    topK: options?.topK || 8,
    maxContextChars: options?.maxContextChars || 8000,
    scoreThreshold: options?.scoreThreshold || 0,
  };

  // Create adapter functions
  const embed = createOpenAIEmbed();
  const chat = createOpenAIChat();
  const query = createPineconeQuery();

  // Return ContextWindow instance
  return {
    async ask(question: string): Promise<AskResult> {
      // Embed the question
      const [questionVector] = await embed([question]);

      // Query the vector store
      const matches = await query({
        vector: questionVector,
        topK: config.topK,
        namespace: config.namespace,
        scoreThreshold: config.scoreThreshold,
      });

      // Pack context and extract sources
      const { context, sources } = packContext(matches, config.maxContextChars);

      // If no context found, return "I don't know"
      if (!context || context.trim().length === 0) {
        return {
          text: "I don't know based on the uploaded files.",
          sources: [],
        };
      }

      // Build system prompt
      const systemPrompt = buildSystemPrompt(context);

      // Get answer from AI
      const answer = await chat({
        model: config.aiModel,
        system: systemPrompt,
        user: question,
      });

      return {
        text: answer,
        sources,
      };
    },
  };
}

/**
 * Create a context window instance.
 *
 * This is the main entry point for the library. It:
 * 1. Validates and normalizes options
 * 2. Ensures the Pinecone index exists
 * 3. Ingests the provided data files
 * 4. Returns an object with an ask() method for querying
 *
 * @param opts - Configuration options
 * @returns Promise resolving to a ContextWindow instance
 *
 * @example
 * ```ts
 * const cw = await createContextWindow({
 *   indexName: "my-book",
 *   data: ["./my-book.pdf"],
 *   ai: { provider: "openai", model: "gpt-4o-mini" },
 *   vectorStore: { provider: "pinecone" }
 * });
 *
 * const { text, sources } = await cw.ask("When was America founded?");
 * console.log(text, sources);
 * ```
 */
export async function createContextWindow(
  opts: CreateContextWindowOptions
): Promise<ContextWindow> {
  // Normalize options with defaults
  const config = normalizeOptions(opts);

  // Create adapter functions
  const embed = createOpenAIEmbed();
  const chat = createOpenAIChat();
  const upsert = createPineconeUpsert();
  const query = createPineconeQuery();

  // Ensure Pinecone index exists (1536 dims for OpenAI embeddings)
  await ensurePineconeIndex(1536);

  // Ingest data
  await ingestPaths({
    inputs: config.dataPaths,
    namespace: config.namespace,
    chunkSize: config.chunkSize,
    chunkOverlap: config.chunkOverlap,
    embed,
    upsert,
  });

  // Return ContextWindow instance
  return {
    async ask(question: string): Promise<AskResult> {
      // Embed the question
      const [questionVector] = await embed([question]);

      // Query the vector store
      const matches = await query({
        vector: questionVector,
        topK: config.topK,
        namespace: config.namespace,
        scoreThreshold: config.scoreThreshold,
      });

      // Pack context and extract sources
      const { context, sources } = packContext(matches, config.maxContextChars);

      // If no context found, return "I don't know"
      if (!context || context.trim().length === 0) {
        return {
          text: "I don't know based on the uploaded files.",
          sources: [],
        };
      }

      // Build system prompt
      const systemPrompt = buildSystemPrompt(context);

      // Get answer from AI
      const answer = await chat({
        model: config.aiModel,
        system: systemPrompt,
        user: question,
      });

      return {
        text: answer,
        sources,
      };
    },
  };
}
