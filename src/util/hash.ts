import { createHash } from "crypto";

/**
 * Generate a stable SHA-1 hash for a given string.
 * Used for creating idempotent chunk IDs.
 *
 * @param input - The string to hash
 * @returns The hexadecimal hash string
 *
 * @example
 * ```ts
 * const id = stableHash("my-file.txt#0:first 64 chars...");
 * // => "a1b2c3d4e5f6..."
 * ```
 */
export function stableHash(input: string): string {
  return createHash("sha1").update(input, "utf8").digest("hex");
}

