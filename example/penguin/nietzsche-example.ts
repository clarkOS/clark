#!/usr/bin/env tsx
/**
 * Nietzsche Plugin Example
 *
 * This example demonstrates how to use the Nietzsche plugin to:
 * 1. Ingest public domain Nietzsche texts from archive.org
 * 2. Store them in Convex with vector embeddings
 * 3. Perform semantic Q&A on the texts
 *
 * MIT License
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { Agent } from './src/core/agent.js';
import { ConvexBackend } from './src/backend/convex.js';
import { nietzschePlugin } from './src/plugins/nietzsche.js';

async function main() {
  console.log('🐧 Nietzsche Penguin Agent - Example\n');

  // Step 1: Create backend connection
  console.log('📡 Connecting to Convex...');
  const backend = new ConvexBackend({
    url: process.env.CONVEX_URL!,
  });

  // Step 2: Create agent with Nietzsche plugin
  console.log('🤖 Creating agent with Nietzsche plugin...');
  const agent = new Agent({
    backend,
    plugins: [nietzschePlugin],
  });

  console.log('✅ Agent ready!\n');

  // Step 3: List available books
  console.log('📚 Available books:');
  const books = await agent.executeAction('nietzsche', 'listBooks');
  console.log(books);
  console.log();

  // Step 4: Ingest a book (example: Beyond Good and Evil)
  const bookToIngest = 'beyondgoodandevi00nietuoft';
  console.log(`\n📖 Ingesting "${bookToIngest}"...`);
  console.log('⏱️  This will take 2-3 minutes to download, chunk, and embed...\n');

  const ingestResult = await agent.executeAction('nietzsche', 'ingest', {
    bookIdentifier: bookToIngest,
  });
  console.log('Ingest result:', ingestResult);

  // Step 5: Ask a question - Nietzsche responds in his own voice
  console.log('\n\n💬 Q&A Example - Nietzsche speaks:');
  const question = 'What does Nietzsche say about truth?';
  console.log(`Question: ${question}\n`);

  const answer = await agent.executeAction('nietzsche', 'ask', {
    question,
    limit: 5,
  });

  // Display Nietzsche's synthesized response
  console.log('🐧 Nietzsche\'s Response:');
  console.log('═'.repeat(60));
  if (answer && typeof answer === 'object' && 'answer' in answer) {
    console.log(answer.answer);
  }
  console.log('═'.repeat(60));

  // Show source passages
  if (answer && typeof answer === 'object' && 'passages' in answer) {
    const passages = answer.passages as Array<{ text: string; book: string; relevance: number }>;
    console.log(`\n📚 Based on ${passages.length} passage(s):`);
    passages.slice(0, 3).forEach((passage, i) => {
      console.log(`   ${i + 1}. ${passage.book} (${(passage.relevance * 100).toFixed(0)}% relevant)`);
    });
  }

  // Step 6: Get a random passage
  console.log('\n\n🎲 Random passage:');
  const randomPassage = await agent.executeAction('nietzsche', 'getPassage', {});
  console.log(randomPassage);

  console.log('\n\n✅ Example complete!');
  console.log('\nNext steps:');
  console.log('- Ingest more books using different identifiers');
  console.log('- Ask different questions');
  console.log('- Integrate with the agent tick system for autonomous operation');

  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
