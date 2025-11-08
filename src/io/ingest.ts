import { stat, readdir } from "fs/promises";
import { join, basename } from "path";
import { readAsText, isSupportedFile } from "./readers.js";
import { chunkText } from "../util/chunker.js";
import { stableHash } from "../util/hash.js";
import type { EmbedFn } from "../adapters/ai/types.js";
import type { UpsertFn, VectorRecord } from "../adapters/store/types.js";

/**
 * Options for ingestion
 */
export interface IngestOptions {
  /** Input paths (files or directories) */
  inputs: string[];
  /** Vector store namespace */
  namespace: string;
  /** Chunk size */
  chunkSize: number;
  /** Chunk overlap */
  chunkOverlap: number;
  /** Embedding function */
  embed: EmbedFn;
  /** Upsert function */
  upsert: UpsertFn;
}

/**
 * Recursively collect all supported files from input paths.
 *
 * @param paths - Array of file or directory paths
 * @returns Array of file paths
 */
async function collectFiles(paths: string[]): Promise<string[]> {
  const files: string[] = [];

  for (const path of paths) {
    const stats = await stat(path);

    if (stats.isFile()) {
      if (isSupportedFile(path)) {
        files.push(path);
      }
    } else if (stats.isDirectory()) {
      const entries = await readdir(path, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(path, entry.name);

        if (entry.isDirectory()) {
          // Recursively process subdirectories
          const subFiles = await collectFiles([fullPath]);
          files.push(...subFiles);
        } else if (entry.isFile() && isSupportedFile(fullPath)) {
          files.push(fullPath);
        }
      }
    }
  }

  return files;
}

/**
 * Ingest files into the vector store.
 *
 * This function:
 * 1. Recursively collects all supported files from input paths
 * 2. Reads and chunks each file
 * 3. Generates stable IDs for idempotent ingestion
 * 4. Embeds chunks in batches
 * 5. Upserts to the vector store
 *
 * @param options - Ingestion options
 * @returns Promise that resolves when ingestion is complete
 *
 * @example
 * ```ts
 * await ingestPaths({
 *   inputs: ["./docs"],
 *   namespace: "my-project",
 *   chunkSize: 1000,
 *   chunkOverlap: 150,
 *   embed: embedFn,
 *   upsert: upsertFn
 * });
 * ```
 */
export async function ingestPaths(options: IngestOptions): Promise<void> {
  const { inputs, namespace, chunkSize, chunkOverlap, embed, upsert } = options;

  // Collect all files
  const files = await collectFiles(inputs);

  if (files.length === 0) {
    console.warn("No supported files found to ingest");
    return;
  }

  console.log(`Ingesting ${files.length} file(s)...`);

  // Process each file
  const allRecords: VectorRecord[] = [];

  for (const filepath of files) {
    try {
      // Read file content
      const text = await readAsText(filepath);

      if (!text || text.trim().length === 0) {
        console.warn(`Skipping empty file: ${filepath}`);
        continue;
      }

      // Chunk the text
      const chunks = chunkText(text, { size: chunkSize, overlap: chunkOverlap });

      // Create records with stable IDs
      const source = basename(filepath);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        // Use first 64 chars for ID stability
        const preview = chunk.slice(0, 64).replace(/\s+/g, " ");
        const id = stableHash(`${filepath}#${i}:${preview}`);

        // Note: embeddings will be added in batch below
        allRecords.push({
          id,
          values: [], // Placeholder, will be filled after embedding
          metadata: {
            text: chunk,
            source,
          },
        });
      }
    } catch (error) {
      console.error(`Failed to process ${filepath}:`, error);
      // Continue with other files
    }
  }

  if (allRecords.length === 0) {
    console.warn("No chunks generated from files");
    return;
  }

  console.log(`Generated ${allRecords.length} chunk(s), embedding...`);

  // Embed in batches of 100 (to manage rate limits)
  const batchSize = 100;
  for (let i = 0; i < allRecords.length; i += batchSize) {
    const batch = allRecords.slice(i, i + batchSize);
    const texts = batch.map((r) => r.metadata.text);

    try {
      const embeddings = await embed(texts);

      // Assign embeddings to records
      for (let j = 0; j < batch.length; j++) {
        batch[j].values = embeddings[j];
      }
    } catch (error) {
      throw new Error(`Embedding batch failed: ${error}`);
    }
  }

  console.log(`Upserting ${allRecords.length} chunk(s) to vector store...`);

  // Upsert to vector store (the upsert function handles batching internally)
  await upsert(allRecords, namespace);

  console.log("Ingestion complete!");
}

