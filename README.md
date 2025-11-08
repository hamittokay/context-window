# context-window

A simple RAG (Retrieval-Augmented Generation) library that lets you ask questions about your documents using OpenAI and Pinecone.

## Installation

```bash
npm install context-window
```

## Setup

1. Get API keys from [OpenAI](https://platform.openai.com/api-keys) and [Pinecone](https://app.pinecone.io/)
2. Set environment variables:

```bash
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
PINECONE_INDEX=context-window
PINECONE_ENVIRONMENT=us-east-1
```

## Usage

```typescript
import { createCtxWindow, getCtxWindow } from "context-window";

// Ingest documents
await createCtxWindow({
  namespace: "my-docs",
  data: ["./my-book.pdf"],  // .txt, .md, .pdf supported
  ai: { provider: "openai", model: "gpt-4o-mini" },
  vectorStore: { provider: "pinecone" }
});

// Ask questions
const cw = getCtxWindow("my-docs");
const { text, sources } = await cw.ask("What is this document about?");
console.log(text);
console.log(sources);
```


## API

### Main Functions

**`createCtxWindow(options)`** - Ingest documents and create a context window
- `namespace`: Unique identifier
- `data`: File paths or directories (`.txt`, `.md`, `.pdf`)
- `ai`: `{ provider: "openai", model?: "gpt-4o-mini" }`
- `vectorStore`: `{ provider: "pinecone" }`
- `chunk`: `{ size?: 1000, overlap?: 150 }`
- `limits`: `{ topK?: 8, maxContextChars?: 8000, scoreThreshold?: 0 }`

**`getCtxWindow(namespace)`** - Retrieve a context window

**`cw.ask(question)`** - Returns `{ text: string, sources: string[] }`

### Utilities

- `hasCtxWindow(namespace)` - Check if exists
- `deleteCtxWindow(namespace)` - Remove from registry
- `clearCtxWindows()` - Clear all
- `listCtxWindows()` - List all


## License

MIT

