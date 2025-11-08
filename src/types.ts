/**
 * Core types for the context-window library
 */

/**
 * AI provider configuration
 */
export interface AIConfig {
  provider: "openai";
  model?: string;
}

/**
 * Vector store configuration
 */
export interface VectorStoreConfig {
  provider: "pinecone";
  namespace?: string;
}

/**
 * Text chunking configuration
 */
export interface ChunkConfig {
  size?: number;
  overlap?: number;
}

/**
 * Query limits configuration
 */
export interface LimitsConfig {
  topK?: number;
  maxContextChars?: number;
  scoreThreshold?: number;
}

/**
 * Options for creating a context window
 */
export interface CreateContextWindowOptions {
  /** Namespace for organizing data */
  namespace: string;
  /** File paths or directories to ingest */
  data: string | string[];
  /** AI provider configuration */
  ai?: AIConfig;
  /** Vector store configuration */
  vectorStore?: VectorStoreConfig;
  /** Text chunking configuration */
  chunk?: ChunkConfig;
  /** Query limits configuration */
  limits?: LimitsConfig;
}

/**
 * Result from asking a question
 */
export interface AskResult {
  /** The answer text */
  text: string;
  /** Source files cited in the answer */
  sources: string[];
}

/**
 * A context window instance
 */
export interface ContextWindow {
  /**
   * Ask a question and get an answer based on the ingested documents
   * @param question The question to ask
   * @returns Promise resolving to the answer and sources
   */
  ask(question: string): Promise<AskResult>;
}

/**
 * Internal chunk representation
 */
export interface Chunk {
  id: string;
  text: string;
  source: string;
  embedding?: number[];
}

/**
 * Normalized options with defaults applied
 */
export interface NormalizedOptions {
  namespace: string;
  dataPaths: string[];
  aiModel: string;
  chunkSize: number;
  chunkOverlap: number;
  topK: number;
  maxContextChars: number;
  scoreThreshold: number;
}

