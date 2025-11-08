# context-window

> A production-grade RAG (Retrieval-Augmented Generation) library with OpenAI embeddings and Pinecone vector storage

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg)](https://nodejs.org/)

## Why context-window?

Building AI applications that answer questions from your documents shouldn't be complicated. `context-window` provides a **simple, elegant API** that handles the entire RAG pipeline:

- 📄 **Ingest** documents (.txt, .md, .pdf)
- ✂️ **Chunk** text with smart overlapping
- 🧮 **Embed** using OpenAI's embeddings
- 🗄️ **Store** vectors in Pinecone
- 🔍 **Retrieve** relevant context
- 💬 **Answer** questions with source citations

**Strict RAG:** Never hallucinates. If the answer isn't in your documents, it says "I don't know based on the uploaded files."

**Idempotent:** Re-running ingestion with the same files won't create duplicates. Chunk IDs are content-based and stable.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Use Cases](#use-cases)
- [API Reference](#api-reference)
- [How It Works](#how-it-works)
- [Examples](#examples)
- [Supported File Types](#supported-file-types)
- [Best Practices](#best-practices)
- [Environment Variables](#environment-variables)
- [Idempotent Ingestion](#idempotent-ingestion)
- [Frequently Asked Questions](#frequently-asked-questions)
- [Limitations](#limitations-mvp)
- [Roadmap](#roadmap)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Prerequisites

Before using `context-window`, you'll need:

1. **Node.js 18+** - [Download here](https://nodejs.org/)
2. **OpenAI API account** - [Sign up here](https://platform.openai.com/signup)
3. **Pinecone account** - [Sign up here](https://www.pinecone.io/)

## Installation

```bash
npm install context-window
```

## Quick Start

### Initial Setup (First Time Only)

#### Step 1: Create a Pinecone Index

1. Go to [Pinecone Console](https://app.pinecone.io/)
2. Click "Create Index"
3. Configure your index:
   - **Name**: `context-window` (or any name you prefer)
   - **Dimensions**: `1536` (required for OpenAI text-embedding-3-small)
   - **Metric**: `cosine` (recommended)
   - **Cloud**: AWS or GCP (AWS us-east-1 recommended for free tier)
4. Click "Create Index"

> **Note**: The free tier includes 1 serverless index with 100K vectors. This is sufficient for testing and small projects.

#### Step 2: Get Your API Keys

**OpenAI API Key:**
1. Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Copy the key (starts with `sk-...`)

**Pinecone API Key:**
1. Visit [Pinecone API Keys](https://app.pinecone.io/)
2. Go to "API Keys" in the left sidebar
3. Copy your API key

## Quick Start

### 1. Set up environment variables

Create a `.env` file with your API keys:

```bash
# OpenAI API Key - Get from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-...

# Pinecone API Key - Get from https://app.pinecone.io/
PINECONE_API_KEY=...

# Pinecone Index Name
PINECONE_INDEX=context-window

# Pinecone Environment (e.g., us-east-1 for AWS serverless)
PINECONE_ENVIRONMENT=us-east-1
```

### 2. Use the library

**ESM (ES Modules):**
```typescript
import { createContextWindow } from "context-window";

const cw = await createContextWindow({
  indexName: "my-book",
  data: ["./my-book.pdf"],           // .txt/.md/.pdf supported
  ai: { provider: "openai", model: "gpt-4o-mini" },
  vectorStore: { provider: "pinecone" }
});

const { text, sources } = await cw.ask("When was America founded?");
console.log(text);     // "America was founded in 1776..."
console.log(sources);  // ["my-book.pdf"]
```

**CommonJS:**
```javascript
const { createContextWindow } = require("context-window");

(async () => {
  const cw = await createContextWindow({
    indexName: "my-book",
    data: ["./my-book.pdf"],
    ai: { provider: "openai", model: "gpt-4o-mini" },
    vectorStore: { provider: "pinecone" }
  });

  const { text, sources } = await cw.ask("When was America founded?");
  console.log(text);     // "America was founded in 1776..."
  console.log(sources);  // ["my-book.pdf"]
})();
```

That's it! Three steps: configure, create, ask.

## Use Cases

`context-window` is perfect for:

- 📚 **Document Q&A**: Build chatbots that answer questions from your documentation, manuals, or knowledge base
- 📖 **Research Assistant**: Query across multiple research papers, articles, or books
- 💼 **Business Intelligence**: Answer questions from reports, presentations, and internal documents
- 🎓 **Study Tool**: Create AI tutors that answer questions from textbooks and lecture notes
- 🏢 **Customer Support**: Build support bots that answer from product documentation and FAQs
- 📝 **Content Discovery**: Find relevant information across large document collections
- 🔍 **Legal/Compliance**: Search and query through contracts, policies, and legal documents

**What makes it different**: Unlike general chat models, `context-window` only answers from YOUR documents. No hallucinations, no made-up facts.

## API Reference

### `createCtxWindow(options)` (Recommended)

Creates and registers a context window instance by ingesting documents and setting up the RAG pipeline. The context window can later be retrieved using `getCtxWindow()`.

```typescript
import { createCtxWindow, getCtxWindow } from "context-window";

await createCtxWindow({
  indexName: "american-history",
  data: ["./examples/sample/README.md"],
  ai: { provider: "openai", model: "gpt-4o-mini" },
  vectorStore: { provider: "pinecone" }
});

// Later, retrieve and use it
const cw = getCtxWindow("american-history");
const result = await cw.ask("When was America founded?");
```

### `getCtxWindow(indexName)`

Retrieves a previously created context window by its index name.

```typescript
const cw = getCtxWindow("american-history");
const result = await cw.ask("Your question here");
```

**Throws an error** if no context window with the given name exists.

### `createContextWindow(options)` (Alternative)

Creates a context window instance directly without registering it. Use this if you don't need the registry pattern.

```typescript
import { createContextWindow } from "context-window";

const cw = await createContextWindow({
  indexName: "my-book",
  data: ["./my-book.pdf"],
  ai: { provider: "openai", model: "gpt-4o-mini" },
  vectorStore: { provider: "pinecone" }
});

const result = await cw.ask("Your question here");
```

#### Options

```typescript
interface CreateContextWindowOptions {
  /** Index name (also used as default namespace) */
  indexName: string;

  /** File paths or directories to ingest */
  data: string | string[];

  /** AI provider configuration */
  ai?: {
    provider: "openai";
    model?: string;  // Default: "gpt-4o-mini"
  };

  /** Vector store configuration */
  vectorStore?: {
    provider: "pinecone";
    namespace?: string;  // Default: index name
  };

  /** Text chunking configuration */
  chunk?: {
    size?: number;      // Default: 1000
    overlap?: number;   // Default: 150
  };

  /** Query limits configuration */
  limits?: {
    topK?: number;              // Default: 8
    maxContextChars?: number;   // Default: 8000
    scoreThreshold?: number;    // Default: 0 (no filtering)
  };
}
```

#### Returns

A `ContextWindow` instance with an `ask()` method.

### Utility Functions

- `hasCtxWindow(indexName)` - Check if a context window exists
- `deleteCtxWindow(indexName)` - Remove a context window from the registry
- `clearCtxWindows()` - Clear all context windows from the registry
- `listCtxWindows()` - Get all registered index names

### `ask(question)`

Ask a question and get an answer based on the ingested documents.

```typescript
const result = await cw.ask("What is the capital of France?");
```

#### Returns

```typescript
interface AskResult {
  /** The answer text */
  text: string;

  /** Source files cited in the answer */
  sources: string[];
}
```

## How It Works

The RAG (Retrieval-Augmented Generation) pipeline consists of two phases:

### Phase 1: Ingestion (One Time)

```
Your Documents → Parse Text → Chunk → Embed → Store in Pinecone
```

1. **File Reading**: Parse `.txt`, `.md`, or `.pdf` files to extract plain text
2. **Chunking**: Split text into overlapping chunks (default: 1000 chars, 150 overlap)
3. **Embedding**: Convert chunks to vectors using OpenAI's `text-embedding-3-small` (1536 dimensions)
4. **Storage**: Store vectors in Pinecone with metadata (text content, source file, chunk ID)
5. **Deduplication**: Use content-based hashing to prevent duplicates

### Phase 2: Query (Every Time You Ask)

```
Your Question → Embed → Search Pinecone → Retrieve Chunks → Generate Answer
```

1. **Question Embedding**: Convert your question to a vector (same model)
2. **Similarity Search**: Find top-K most similar chunks using cosine similarity
3. **Context Building**: Combine retrieved chunks (up to `maxContextChars` limit)
4. **Prompt Construction**: Build a prompt with strict RAG instructions:
   - "Answer ONLY from the provided context"
   - "If the answer is not in the context, say 'I don't know...'"
   - Include all retrieved chunks
5. **Generation**: OpenAI generates an answer using `gpt-4o-mini` (or your chosen model)
6. **Source Extraction**: Parse and return unique source files cited

### Key Features

- **Idempotent Ingestion**: Same files → same chunk IDs → updates instead of duplicates
- **Strict RAG**: Model is forced to answer only from your documents
- **Source Citation**: Every answer includes which files were used
- **Smart Chunking**: Overlapping chunks preserve context at boundaries

**Privacy Note**: Your files are parsed locally. Only extracted text is sent to OpenAI for embedding (not the original files).

## Examples

### Ingest a directory

```typescript
const cw = await createContextWindow({
  indexName: "documentation",
  data: ["./docs"],  // Recursively processes all .txt/.md/.pdf files
  ai: { provider: "openai" },
  vectorStore: { provider: "pinecone" }
});
```

### Multiple files

```typescript
const cw = await createContextWindow({
  indexName: "research",
  data: [
    "./papers/paper1.pdf",
    "./papers/paper2.pdf",
    "./notes.md"
  ],
  ai: { provider: "openai" },
  vectorStore: { provider: "pinecone" }
});
```

### Custom chunk size

```typescript
const cw = await createContextWindow({
  indexName: "legal-docs",
  data: ["./contracts"],
  chunk: {
    size: 2000,    // Larger chunks for legal documents
    overlap: 200   // More overlap to preserve context
  },
  ai: { provider: "openai" },
  vectorStore: { provider: "pinecone" }
});
```

### Filter by similarity score

```typescript
const cw = await createContextWindow({
  indexName: "technical-manual",
  data: ["./manual.pdf"],
  limits: {
    scoreThreshold: 0.7  // Only use chunks with >70% similarity
  },
  ai: { provider: "openai" },
  vectorStore: { provider: "pinecone" }
});
```

## Supported File Types

- `.txt` - Plain text
- `.md` - Markdown
- `.pdf` - PDF documents (parsed via pdf-parse)

**Note**: For optimal performance, keep individual files under ~5MB.

## Best Practices

### Choosing Chunk Size

The `chunk.size` parameter affects answer quality:

- **Smaller chunks (500-1000)**: Better for precise, specific questions
  - ✅ "What is the capital of France?"
  - ✅ "Define photosynthesis"

- **Larger chunks (1500-2000)**: Better for conceptual questions
  - ✅ "Explain the process of photosynthesis"
  - ✅ "Compare democracy and authoritarianism"

**Recommendation**: Start with default (1000), adjust based on your content and query patterns.

### Optimizing Retrieval

```typescript
// For high-precision needs (research, legal)
const cw = await createContextWindow({
  indexName: "legal-docs",
  data: ["./contracts"],
  limits: {
    topK: 5,                // Fewer, more relevant chunks
    scoreThreshold: 0.75,   // Only high-confidence matches
    maxContextChars: 6000   // Less context, more focused
  }
});

// For comprehensive coverage (documentation, knowledge base)
const cw = await createContextWindow({
  indexName: "docs",
  data: ["./documentation"],
  limits: {
    topK: 12,               // More chunks for coverage
    scoreThreshold: 0,      // Include all matches
    maxContextChars: 12000  // More context
  }
});
```

### Organizing Your Documents

**Good document structure**:
```
./data/
  ├── product-docs/       # Group related docs
  │   ├── api.md
  │   ├── features.md
  │   └── installation.md
  └── support/
      ├── faq.md
      └── troubleshooting.md
```

**Tips**:
- Use descriptive filenames (they appear in `sources`)
- Group related documents by topic
- Keep documents focused (split large documents)
- Use consistent formatting (especially for PDFs)

### Handling Multiple Projects

Use different `indexName` values to keep data separate:

```typescript
// Customer support bot
const supportBot = await createContextWindow({
  indexName: "customer-support",    // Namespace: customer-support
  data: ["./support-docs"]
});

// Internal knowledge base
const internalKB = await createContextWindow({
  indexName: "internal-kb",         // Namespace: internal-kb
  data: ["./internal-docs"]
});
```

Each index gets its own Pinecone namespace, preventing data mixing.

### Cost Optimization

**OpenAI Costs**:
- Embeddings: ~$0.02 per 1M tokens (very cheap)
- Chat: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens (gpt-4o-mini)

**Pinecone Costs**:
- Free tier: 1 serverless index, 100K vectors (~100MB text)
- Paid: $0.096/million read units

**Tips to reduce costs**:
1. Increase `chunk.size` to reduce total vectors
2. Use `scoreThreshold` to reduce LLM context usage
3. Cache repeated questions (not built-in yet)
4. Choose smaller models when possible

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key from platform.openai.com |
| `PINECONE_API_KEY` | Yes | Pinecone API key from app.pinecone.io |
| `PINECONE_INDEX` | No | Pinecone index name (default: "context-window") |
| `PINECONE_ENVIRONMENT` | No | Pinecone region (default: "us-east-1") |

## Idempotent Ingestion

The library uses content-based hashing to generate stable chunk IDs:

```
chunk_id = sha1(filepath + "#" + chunk_index + ":" + first_64_chars)
```

This means:
- ✅ Re-running ingestion with same files → updates existing chunks
- ✅ Adding new files → only ingests new content
- ✅ Modifying files → updates only changed chunks
- ✅ No duplicate chunks in your vector store

## Frequently Asked Questions

### Can I use this in production?

Yes! The library is production-ready with:
- ✅ TypeScript for type safety
- ✅ Idempotent operations (safe to re-run)
- ✅ Proper error handling
- ✅ Battle-tested dependencies (OpenAI, Pinecone)

**Recommendations for production**:
- Use environment-specific API keys
- Implement rate limiting for public endpoints
- Monitor API costs
- Add caching for repeated questions
- Use a secret manager (AWS Secrets Manager, etc.)

### How much does it cost to run?

**Example: 100-page book (~50,000 words)**
- Ingestion: ~$0.10 (one time)
- Per question: ~$0.001-0.002
- Pinecone storage: Free (under 100K vectors)

**Typical monthly costs** (1000 questions/day):
- OpenAI: ~$30-60/month
- Pinecone: Free tier or ~$20/month

### Can I update documents without re-ingesting everything?

Yes! The library is idempotent:
- Add new files → only new files are processed
- Update existing files → only changed chunks are updated
- Re-run with same files → no duplicates created

### How do I delete old documents?

Currently, you need to delete via Pinecone Console:
1. Go to your index
2. Find the namespace (your index name)
3. Delete specific vectors by ID or delete the entire namespace

**Future feature**: Built-in deletion by document fingerprint.

### Can I use a different AI model?

Yes! Change the `model` parameter:

```typescript
const cw = await createContextWindow({
  indexName: "my-project",
  data: ["./docs"],
  ai: {
    provider: "openai",
    model: "gpt-4o"  // or "gpt-4-turbo", "gpt-3.5-turbo", etc.
  }
});
```

**Note**: Only OpenAI models are supported in v1. Other providers (Anthropic, Cohere) are on the roadmap.

### Does it work with scanned PDFs?

No, scanned PDFs (images of text) won't work. You need:
- Text-based PDFs (searchable/selectable text)
- Or use OCR software first to convert scans to text

### How accurate is it?

Accuracy depends on:
- **Document quality**: Clear, well-written docs → better answers
- **Chunk size**: Appropriate for your content type
- **Question phrasing**: Specific questions → better retrieval
- **Content coverage**: Answer must be IN your documents

The library uses strict RAG, so it won't hallucinate. If it doesn't know, it says so.

### Can I use this for real-time chat?

Yes, but responses are not streamed. Each question takes:
- Embedding: ~100-200ms
- Vector search: ~50-100ms
- LLM generation: ~1-3 seconds

Total: **1-4 seconds per question**

For faster responses, consider:
- Using `gpt-4o-mini` (faster than `gpt-4o`)
- Reducing `maxContextChars` to send less context
- Implementing client-side caching

### What about data privacy?

**Your data flow**:
1. Files are parsed **locally** on your machine
2. Only extracted **text** is sent to OpenAI for embedding
3. Vectors + text are stored in **your** Pinecone index
4. Questions and context are sent to OpenAI for answers

**Privacy considerations**:
- OpenAI: Data sent via API is not used for training (per their policy)
- Pinecone: You control the index, can delete anytime
- No data is stored by this library itself

For sensitive data, consider:
- Self-hosted vector stores (pgvector)
- Local LLMs (future feature)
- OpenAI's Azure deployment (GDPR compliant)

### Can I run this offline?

No, currently requires:
- Internet connection
- OpenAI API access
- Pinecone API access

**Future consideration**: Support for local embeddings and vector stores.

## Limitations (MVP)

This is an MVP focused on core functionality. The following are not yet supported:

- **AI Providers**: Only OpenAI (adapters structure ready for expansion)
- **Vector Stores**: Only Pinecone (adapters structure ready for expansion)
- **File Types**: Only .txt, .md, .pdf (easy to extend in `src/io/readers.ts`)
- **Streaming**: Responses are not streamed (TODO for future version)
- **Connectors**: Only local files (no web/Notion/Google Drive/GitHub)
- **Document Deletion**: Must be done via Pinecone Console
- **Batch Processing**: Large files processed in memory (may need optimization)

## Roadmap

Future enhancements under consideration:

- 📄 **Additional file formats**: .docx, .html, .csv, .json, .epub, .pptx
- 🤖 **More AI providers**: Anthropic, Cohere, local models
- 🗄️ **More vector stores**: Qdrant, pgvector, Weaviate, Chroma
- 🔄 **Streaming responses**: SSE streaming for real-time answers
- 🔗 **Web connectors**: Notion, Google Drive, GitHub, web scraping
- 🎯 **Reranking**: Add reranking stage for better relevance
- 🗑️ **Deletion**: Remove documents by fingerprint
- 🔍 **Metadata filtering**: Filter by document metadata

## Security

- ⚠️ **Never commit API keys** - Use `.env` files (already in `.gitignore`)
- 🔐 **API keys are loaded from environment variables only**
- 🚫 **Keys are never logged or exposed**
- ✅ **All dependencies are from trusted sources**

Recommend using:
- Environment-specific `.env` files
- Secret management services in production (AWS Secrets Manager, etc.)
- Read-only API keys where possible

## Troubleshooting

### Common Issues

#### "Error: Pinecone index not found"

**Solution**: Ensure your Pinecone index exists and the name matches your `.env` configuration.

```bash
# Check your PINECONE_INDEX value in .env
PINECONE_INDEX=context-window
```

Visit [Pinecone Console](https://app.pinecone.io/) to verify the index exists.

#### "Error: Incorrect dimensions"

**Solution**: Your Pinecone index must have **1536 dimensions** to work with OpenAI's text-embedding-3-small model.

If you created an index with wrong dimensions:
1. Delete the old index in Pinecone Console
2. Create a new one with 1536 dimensions
3. Re-run your ingestion

#### "Error: Invalid API key"

**Solution**: Verify your API keys are correct:

```bash
# Test OpenAI key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# If you get an error, regenerate your key at platform.openai.com/api-keys
```

For Pinecone, check [app.pinecone.io](https://app.pinecone.io/) API Keys section.

#### PDF parsing fails

**Solution**: Ensure your PDF is text-based (not scanned images). If it's a scanned PDF:
1. Use OCR software to convert it to searchable text first
2. Or extract text and save as `.txt` or `.md`

#### Out of memory errors

**Solution**: For large files:
1. Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=4096 node your-script.js`
2. Or split large files into smaller chunks
3. Or increase `chunk.size` to reduce total chunks

#### "I don't know based on the uploaded files" for every question

**Possible causes**:
1. **Documents didn't ingest**: Check for errors during `createContextWindow()`
2. **Wrong namespace**: Ensure you're using the same `indexName` value
3. **Score threshold too high**: Try lowering or removing `scoreThreshold`
4. **Question too different from content**: Try rephrasing your question

**Debug steps**:
```typescript
// Add more context and lower threshold
const cw = await createContextWindow({
  indexName: "my-project",
  data: ["./my-file.pdf"],
  limits: {
    topK: 10,              // Retrieve more chunks
    scoreThreshold: 0,     // Remove filtering
    maxContextChars: 12000 // Allow more context
  },
  ai: { provider: "openai" },
  vectorStore: { provider: "pinecone" }
});
```

### Getting Help

If you're still stuck:

1. **Check the examples**: See `examples/quickstart.mjs` for a working reference
2. **Enable debug logging**: Check console output for detailed error messages
3. **Open an issue**: [GitHub Issues](https://github.com/yourusername/context-window/issues) with:
   - Your code snippet
   - Error message
   - Node.js version (`node --version`)
   - Package version (`npm list context-window`)

## Development

```bash
# Clone and install
git clone <repo-url>
cd context-window
pnpm install  # or npm install

# Set up environment variables
# Create a .env file with your keys (see "Quick Start" section above)

# Build
pnpm run build

# Run tests
pnpm test

# Type check
pnpm run check

# Lint
pnpm run lint

# Format code
pnpm run format

# Try the example (requires .env setup)
node examples/quickstart.mjs
```

### Project Structure

```
context-window/
├── src/
│   ├── adapters/       # Provider adapters (OpenAI, Pinecone)
│   │   ├── ai/         # AI provider interfaces
│   │   └── store/      # Vector store interfaces
│   ├── core/           # Core ContextWindow class
│   ├── io/             # File ingestion and reading
│   ├── util/           # Chunking, hashing utilities
│   └── types.ts        # TypeScript type definitions
├── tests/
│   ├── unit/           # Unit tests
│   ├── e2e/            # End-to-end tests
│   └── __mocks__/      # Test mocks
└── examples/           # Usage examples
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test tests/unit/chunker.test.ts

# Run with coverage
pnpm test -- --coverage
```

**Note**: E2E tests require valid API keys in `.env` and will make real API calls.

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure `npm run lint` and `npm test` pass
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details

## Acknowledgments

Built with:
- [OpenAI](https://openai.com/) - Embeddings and chat completions
- [Pinecone](https://www.pinecone.io/) - Vector database
- [pdf-parse](https://www.npmjs.com/package/pdf-parse) - PDF text extraction

---

## Quick Reference

### Common Configuration Patterns

```typescript
// 🚀 Quick & Simple (defaults)
const cw = await createContextWindow({
  indexName: "my-docs",
  data: ["./docs"],
  ai: { provider: "openai" },
  vectorStore: { provider: "pinecone" }
});

// 🎯 High Precision (legal, research)
const cw = await createContextWindow({
  indexName: "legal",
  data: ["./contracts"],
  chunk: { size: 1500, overlap: 200 },
  limits: { topK: 5, scoreThreshold: 0.75 },
  ai: { provider: "openai", model: "gpt-4o" }
});

// 📚 Comprehensive Coverage (documentation)
const cw = await createContextWindow({
  indexName: "docs",
  data: ["./documentation"],
  chunk: { size: 1000, overlap: 150 },
  limits: { topK: 12, maxContextChars: 12000 },
  ai: { provider: "openai", model: "gpt-4o-mini" }
});

// 💰 Cost-Optimized (budget-conscious)
const cw = await createContextWindow({
  indexName: "budget",
  data: ["./data"],
  chunk: { size: 2000, overlap: 100 },  // Fewer chunks
  limits: { topK: 5, scoreThreshold: 0.6 },  // Less retrieval
  ai: { provider: "openai", model: "gpt-4o-mini" }
});
```

### Parameter Cheat Sheet

| Parameter | Default | Range | Use Case |
|-----------|---------|-------|----------|
| `chunk.size` | 1000 | 500-2000 | Smaller for specific Q&A, larger for explanations |
| `chunk.overlap` | 150 | 50-300 | Higher for fragmented content, lower for distinct sections |
| `limits.topK` | 8 | 3-15 | Higher for broad coverage, lower for precision |
| `limits.scoreThreshold` | 0 | 0-1 | Use 0.7+ for high-confidence answers only |
| `limits.maxContextChars` | 8000 | 4000-16000 | Balance between context and token costs |

---

Made with ❤️ for developers building AI-powered applications

