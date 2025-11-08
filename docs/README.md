# context-window Documentation

This directory contains the documentation for **context-window**, a production-grade RAG (Retrieval-Augmented Generation) library with OpenAI embeddings and Pinecone vector storage.

## Documentation Structure

- **[index.mdx](index.mdx)** - Introduction and overview
- **[quickstart.mdx](quickstart.mdx)** - Getting started guide
- **[use-cases.mdx](use-cases.mdx)** - Real-world applications and examples
- **[best-practices.mdx](best-practices.mdx)** - Optimization tips and recommendations
- **[examples.mdx](examples.mdx)** - Code examples and patterns
- **[troubleshooting.mdx](troubleshooting.mdx)** - Common issues and solutions
- **[faq.mdx](faq.mdx)** - Frequently asked questions
- **[development.mdx](development.mdx)** - Contributing and development guide
- **api-reference/** - Complete API documentation
  - [introduction.mdx](api-reference/introduction.mdx)
  - [create-context-window.mdx](api-reference/create-context-window.mdx)
  - [create-ctx-window.mdx](api-reference/create-ctx-window.mdx)
  - [get-ctx-window.mdx](api-reference/get-ctx-window.mdx)
  - [ask.mdx](api-reference/ask.mdx)
  - [utility-functions.mdx](api-reference/utility-functions.mdx)
  - [configuration.mdx](api-reference/configuration.mdx)

## About context-window

context-window is a TypeScript library that simplifies building RAG (Retrieval-Augmented Generation) applications. It provides:

- 📄 Document ingestion (.txt, .md, .pdf)
- ✂️ Smart text chunking with overlap
- 🧮 OpenAI embeddings (text-embedding-3-small)
- 🗄️ Pinecone vector storage
- 🔍 Semantic search and retrieval
- 💬 Accurate answers with source citations
- ✅ Strict RAG - no hallucinations

## Local Development

Install the [Mintlify CLI](https://www.npmjs.com/package/mint) to preview your documentation changes locally:

```bash
npm i -g mint
```

Run the following command in this docs directory:

```bash
cd docs
mint dev
```

View your local preview at `http://localhost:3000`.

## Publishing Changes

Documentation is built with Mintlify. Install the GitHub app from your [dashboard](https://dashboard.mintlify.com/settings/organization/github-app) to automatically deploy changes to production after pushing to the default branch.

## Contributing to Documentation

Found an issue or want to improve the docs? Contributions are welcome!

1. Fork the repository
2. Make your changes to the documentation files
3. Test locally using `mint dev`
4. Submit a pull request

### Mintlify Troubleshooting

- If your dev environment isn't running: Run `mint update` to ensure you have the most recent version of the CLI
- If a page loads as a 404: Make sure you are running in a folder with a valid `docs.json`
- For more help: [Mintlify documentation](https://mintlify.com/docs)

## Resources

- [Main Project README](../README.md) - Full library documentation
- [NPM Package](https://www.npmjs.com/package/context-window) - Published package
- [GitHub Repository](https://github.com/yourusername/context-window) - Source code
- [Mintlify Docs](https://mintlify.com/docs) - Documentation platform
