/**
 * context-window - A production-grade RAG library with OpenAI embeddings and Pinecone vector storage
 *
 * @packageDocumentation
 */

export { createContextWindow } from "./core/ContextWindow.js";
export {
  createCtxWindow,
  getCtxWindow,
  hasCtxWindow,
  deleteCtxWindow,
  clearCtxWindows,
  listCtxWindows,
  type GetContextWindowOptions,
} from "./core/registry.js";

export type {
  CreateContextWindowOptions,
  AskResult,
  ContextWindow,
  AIConfig,
  VectorStoreConfig,
  ChunkConfig,
  LimitsConfig,
} from "./types.js";
