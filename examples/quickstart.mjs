#!/usr/bin/env node

/**
 * Quickstart example for context-window library
 *
 * Before running:
 * 1. Copy .env.example to .env
 * 2. Fill in your OPENAI_API_KEY and PINECONE_API_KEY
 * 3. Run: node examples/quickstart.mjs
 */

import "dotenv/config";
import { getCtxWindow } from "context-window";

async function main() {
  console.log("🚀 Context Window Quickstart\n");

  // Create a context window with sample data
  // console.log("📚 Creating context window and ingesting documents...");
  // await createCtxWindow({
  //   namespace: "american-history",
  //   data: ["./sample/README.md"],
  //   ai: { provider: "openai", model: "gpt-4o-mini" },
  //   vectorStore: { provider: "pinecone" },
  // });

  // console.log("✅ Context window created!\n");

  // Retrieve the context window by name
  const cw = getCtxWindow("american-history");

  // Ask a question
  console.log("❓ Asking: When was America founded?\n");
  const result = await cw.ask("When was America founded?");

  console.log("💬 Answer:");
  console.log(result.text);
  console.log("\n📄 Sources:", result.sources);

  // Ask another question
  console.log("\n❓ Asking: Who were the founding fathers?\n");
  const result2 = await cw.ask("Who were the founding fathers?");

  console.log("💬 Answer:");
  console.log(result2.text);
  console.log("\n📄 Sources:", result2.sources);

  console.log("\n✨ Done!");
}

main().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
