import { Pinecone } from "@pinecone-database/pinecone";
import type { UpsertFn, QueryFn, VectorRecord } from "./types.js";

/**
 * Get Pinecone configuration from environment
 * @throws Error if required environment variables are not set
 */
function getPineconeConfig(): {
  apiKey: string;
  indexName: string;
  environment: string;
} {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX || "context-window";
  const environment = process.env.PINECONE_ENVIRONMENT || "us-east-1";

  if (!apiKey) {
    throw new Error(
      "PINECONE_API_KEY environment variable is required. Get your key from https://app.pinecone.io/"
    );
  }

  return { apiKey, indexName, environment };
}

let pineconeClient: Pinecone | null = null;

/**
 * Get or create Pinecone client instance
 */
function getClient(): Pinecone {
  if (!pineconeClient) {
    const { apiKey } = getPineconeConfig();
    pineconeClient = new Pinecone({ apiKey });
  }
  return pineconeClient;
}

/**
 * Ensure a Pinecone index exists. Creates it if it doesn't exist.
 *
 * @param dimension - Vector dimension (default: 1536 for OpenAI embeddings)
 * @returns Promise that resolves when index is ready
 *
 * @example
 * ```ts
 * await ensurePineconeIndex(1536);
 * ```
 */
export async function ensurePineconeIndex(
  dimension = 1536
): Promise<void> {
  const client = getClient();
  const { indexName, environment } = getPineconeConfig();

  try {
    // Check if index exists
    const indexes = await client.listIndexes();
    const indexExists = indexes.indexes?.some(
      (idx) => idx.name === indexName
    );

    if (!indexExists) {
      // Create serverless index
      await client.createIndex({
        name: indexName,
        dimension,
        metric: "cosine",
        spec: {
          serverless: {
            cloud: "aws",
            region: environment,
          },
        },
      });

      // Wait for index to be ready
      let ready = false;
      let attempts = 0;
      const maxAttempts = 30;

      while (!ready && attempts < maxAttempts) {
        const description = await client.describeIndex(indexName);
        ready = description.status?.ready ?? false;

        if (!ready) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          attempts++;
        }
      }

      if (!ready) {
        throw new Error(
          `Index ${indexName} creation timed out after ${maxAttempts * 2} seconds`
        );
      }
    }
  } catch (error) {
    throw new Error(`Failed to ensure Pinecone index: ${error}`);
  }
}

/**
 * Create an upsert function for Pinecone.
 *
 * @returns An upsert function
 *
 * @example
 * ```ts
 * const upsert = createPineconeUpsert();
 * await upsert(records, "my-namespace");
 * ```
 */
export function createPineconeUpsert(): UpsertFn {
  return async (records: VectorRecord[], namespace: string): Promise<void> => {
    if (records.length === 0) {
      return;
    }

    const client = getClient();
    const { indexName } = getPineconeConfig();

    try {
      const index = client.index(indexName);

      // Pinecone recommends batching upserts in chunks of 100
      const batchSize = 100;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        await index.namespace(namespace).upsert(batch);
      }
    } catch (error) {
      throw new Error(`Pinecone upsert failed: ${error}`);
    }
  };
}

/**
 * Create a query function for Pinecone.
 *
 * @returns A query function
 *
 * @example
 * ```ts
 * const query = createPineconeQuery();
 * const matches = await query({
 *   vector: [0.1, 0.2, ...],
 *   topK: 5,
 *   namespace: "my-namespace",
 *   scoreThreshold: 0.7
 * });
 * ```
 */
export function createPineconeQuery(): QueryFn {
  return async ({ vector, topK, namespace, scoreThreshold }) => {
    const client = getClient();
    const { indexName } = getPineconeConfig();

    try {
      const index = client.index(indexName);

      const response = await index.namespace(namespace).query({
        vector,
        topK,
        includeMetadata: true,
      });

      // Filter by score threshold and ensure metadata exists
      const matches = (response.matches || [])
        .filter((match) => match.score !== undefined && match.score >= scoreThreshold)
        .map((match) => ({
          id: match.id,
          score: match.score!,
          metadata: {
            text: (match.metadata?.text as string) || "",
            source: (match.metadata?.source as string) || "",
          },
        }));

      return matches;
    } catch (error) {
      throw new Error(`Pinecone query failed: ${error}`);
    }
  };
}

