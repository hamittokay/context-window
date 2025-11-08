/**
 * Chunk configuration
 */
export interface ChunkOptions {
  size: number;
  overlap: number;
}

/**
 * Split text into overlapping chunks using a sliding window approach.
 *
 * @param text - The text to chunk
 * @param options - Chunking options (size and overlap)
 * @returns Array of text chunks
 *
 * @example
 * ```ts
 * const chunks = chunkText("Long document text...", { size: 1000, overlap: 150 });
 * // Returns array of overlapping text chunks
 * ```
 */
export function chunkText(
  text: string,
  options: ChunkOptions = { size: 1000, overlap: 150 }
): string[] {
  const { size, overlap } = options;

  // Handle empty or very short text
  if (!text || text.length === 0) {
    return [];
  }

  if (text.length <= size) {
    return [text];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = start + size;
    const chunk = text.slice(start, end);
    chunks.push(chunk);

    // If we've reached the end, break
    if (end >= text.length) {
      break;
    }

    // Move forward by (size - overlap) to create overlapping chunks
    start += size - overlap;
  }

  return chunks;
}

