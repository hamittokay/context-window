/**
 * Function type for embedding text into vectors
 */
export type EmbedFn = (texts: string[]) => Promise<number[][]>;

/**
 * Arguments for chat completion
 */
export interface ChatArgs {
  model: string;
  system: string;
  user: string;
}

/**
 * Function type for chat completion
 */
export type ChatFn = (args: ChatArgs) => Promise<string>;

