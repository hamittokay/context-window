import { readFile } from "fs/promises";
import { extname } from "path";
import pdf from "pdf-parse";

/**
 * Read a file and extract its text content based on file type.
 *
 * Supported formats:
 * - .txt: Plain text
 * - .md: Markdown
 * - .pdf: PDF documents
 *
 * @param filepath - Path to the file to read
 * @returns Promise resolving to the extracted text
 * @throws Error if file type is unsupported or file cannot be read
 *
 * @example
 * ```ts
 * const text = await readAsText("./document.pdf");
 * console.log(text);
 * ```
 */
export async function readAsText(filepath: string): Promise<string> {
  const ext = extname(filepath).toLowerCase();

  try {
    switch (ext) {
      case ".txt":
      case ".md": {
        const content = await readFile(filepath, "utf-8");
        return content;
      }

      case ".pdf": {
        const dataBuffer = await readFile(filepath);
        const pdfData = await pdf(dataBuffer);
        return pdfData.text;
      }

      default:
        throw new Error(
          `Unsupported file type: ${ext}. Supported types: .txt, .md, .pdf`
        );
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unsupported")) {
      throw error;
    }
    throw new Error(`Failed to read file ${filepath}: ${error}`);
  }
}

/**
 * Check if a file is supported based on its extension.
 *
 * @param filepath - Path to check
 * @returns True if the file type is supported
 *
 * @example
 * ```ts
 * if (isSupportedFile("doc.pdf")) {
 *   // Process file
 * }
 * ```
 */
export function isSupportedFile(filepath: string): boolean {
  const ext = extname(filepath).toLowerCase();
  return [".txt", ".md", ".pdf"].includes(ext);
}

