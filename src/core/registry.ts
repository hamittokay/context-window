import type { ContextWindow, CreateContextWindowOptions } from "../types.js";
import {
  createContextWindow,
  createContextWindowWithoutIngestion,
} from "./ContextWindow.js";

/**
 * Global registry to store context windows by index name
 */
const registry = new Map<string, ContextWindow>();

/**
 * Default options for getCtxWindow when connecting to existing namespace
 */
export interface GetContextWindowOptions {
  aiModel?: string;
  namespace?: string;
  topK?: number;
  maxContextChars?: number;
  scoreThreshold?: number;
}

/**
 * Create a context window and register it with the given index name.
 * The context window can later be retrieved using getCtxWindow.
 *
 * @param opts - Configuration options including indexName
 * @returns Promise resolving to the created ContextWindow instance
 *
 * @example
 * ```ts
 * await createCtxWindow({
 *   indexName: "american-history",
 *   data: ["./examples/sample/README.md"],
 *   ai: { provider: "openai", model: "gpt-4o-mini" },
 *   vectorStore: { provider: "pinecone" }
 * });
 *
 * // Later, retrieve and use it
 * const cw = getCtxWindow("american-history");
 * const result = await cw.ask("When was America founded?");
 * ```
 */
export async function createCtxWindow(
  opts: CreateContextWindowOptions
): Promise<ContextWindow> {
  const cw = await createContextWindow(opts);
  registry.set(opts.indexName, cw);
  return cw;
}

/**
 * Retrieve or create a context window by its index name.
 *
 * If the context window is already in the registry, returns it immediately.
 * Otherwise, creates a new connection to the Pinecone namespace with the given name.
 * This allows you to reconnect to existing data without calling createCtxWindow.
 *
 * @param indexName - The name of the context window to retrieve
 * @param options - Optional configuration overrides
 * @returns The ContextWindow instance
 *
 * @example
 * ```ts
 * // Connect to existing Pinecone namespace
 * const cw = getCtxWindow("american-history");
 * const result = await cw.ask("When was America founded?");
 *
 * // With custom options
 * const cw2 = getCtxWindow("my-docs", { topK: 10, aiModel: "gpt-4" });
 * ```
 */
export function getCtxWindow(
  indexName: string,
  options?: GetContextWindowOptions
): ContextWindow {
  // Check if already in registry
  let cw = registry.get(indexName);

  if (!cw) {
    // Create a new connection to the existing Pinecone namespace
    cw = createContextWindowWithoutIngestion(indexName, options);
    registry.set(indexName, cw);
  }

  return cw;
}

/**
 * Check if a context window with the given name exists in the registry.
 *
 * @param indexName - The name to check
 * @returns true if the context window exists, false otherwise
 */
export function hasCtxWindow(indexName: string): boolean {
  return registry.has(indexName);
}

/**
 * Remove a context window from the registry.
 *
 * @param indexName - The name of the context window to remove
 * @returns true if removed, false if it didn't exist
 */
export function deleteCtxWindow(indexName: string): boolean {
  return registry.delete(indexName);
}

/**
 * Clear all context windows from the registry.
 */
export function clearCtxWindows(): void {
  registry.clear();
}

/**
 * Get all registered context window names.
 *
 * @returns Array of index names
 */
export function listCtxWindows(): string[] {
  return Array.from(registry.keys());
}

