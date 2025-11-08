import type {
  UpsertFn,
  QueryFn,
  QueryMatch,
  VectorRecord,
} from "../../src/adapters/store/types.js";

// In-memory store for mock
const mockStore: Map<string, Map<string, VectorRecord>> = new Map();

/**
 * Mock function to ensure index exists (no-op for testing)
 */
export async function mockEnsurePineconeIndex(): Promise<void> {
  // No-op for testing
}

/**
 * Mock upsert function that stores vectors in memory
 */
export function createMockUpsert(): UpsertFn {
  return async (records: VectorRecord[], namespace: string): Promise<void> => {
    if (!mockStore.has(namespace)) {
      mockStore.set(namespace, new Map());
    }

    const nsStore = mockStore.get(namespace)!;
    for (const record of records) {
      nsStore.set(record.id, record);
    }
  };
}

/**
 * Mock query function that returns stored vectors based on simple similarity
 */
export function createMockQuery(): QueryFn {
  return async ({ vector, topK, namespace, scoreThreshold }): Promise<QueryMatch[]> => {
    const nsStore = mockStore.get(namespace);
    if (!nsStore) {
      return [];
    }

    // Calculate cosine similarity for each stored vector
    const matches: QueryMatch[] = [];

    for (const [id, record] of nsStore.entries()) {
      const score = cosineSimilarity(vector, record.values);

      if (score >= scoreThreshold) {
        matches.push({
          id,
          score,
          metadata: record.metadata,
        });
      }
    }

    // Sort by score descending and take topK
    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, topK);
  };
}

/**
 * Simple cosine similarity calculation
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Clear mock store (for test cleanup)
 */
export function clearMockStore(): void {
  mockStore.clear();
}

