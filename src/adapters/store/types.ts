/**
 * A vector with metadata to be stored
 */
export interface VectorRecord {
  id: string;
  values: number[];
  metadata: {
    text: string;
    source: string;
  };
}

/**
 * Function type for upserting vectors to a store
 */
export type UpsertFn = (
  records: VectorRecord[],
  namespace: string
) => Promise<void>;

/**
 * Query arguments for vector search
 */
export interface QueryArgs {
  vector: number[];
  topK: number;
  namespace: string;
  scoreThreshold: number;
}

/**
 * A query result match
 */
export interface QueryMatch {
  id: string;
  score: number;
  metadata: {
    text: string;
    source: string;
  };
}

/**
 * Function type for querying vectors from a store
 */
export type QueryFn = (args: QueryArgs) => Promise<QueryMatch[]>;

