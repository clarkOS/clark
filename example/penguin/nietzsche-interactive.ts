#!/usr/bin/env tsx
/**
 * Interactive Nietzsche Q&A
 *
 * Chat with the Nietzsche Penguin and explore philosophical passages
 * through semantic search and vector embeddings.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import * as readline from 'readline';
import { Agent } from './src/core/agent.js';
import { ConvexBackend } from './src/backend/convex.js';
import { nietzschePlugin } from './src/plugins/nietzsche.js';

// Available books with their identifiers
const BOOKS = [
  { id: 'beyondgoodandevi00nietuoft', title: 'Beyond Good and Evil' },
  { id: 'thusspokezarathu00nietuoft', title: 'Thus Spoke Zarathustra' },
  { id: 'genealogyofmoral00nietuoft', title: 'On the Genealogy of Morals' },
  { id: 'twilightidolsant00nietuoft', title: 'Twilight of the Idols' },
];

async function main() {
  console.log('\n🐧 Nietzsche Penguin - Interactive Dialogue\n');
  console.log('═'.repeat(60));
  console.log('I AM Nietzsche, reborn as a penguin.');
  console.log('Ask me anything - I will answer in my own voice.');
  console.log('═'.repeat(60) + '\n');

  // Initialize agent with Nietzsche plugin
  const agent = new Agent({
    backend: new ConvexBackend({ url: process.env.CONVEX_URL! }),
    plugins: [nietzschePlugin],
  });

  console.log('✓ Connected to Convex');

  // Check what's already ingested
  const stats = await agent.executeAction('nietzsche', 'getStats', {});

  if (stats.totalBooks === 0) {
    console.log('\n⚠️  No books ingested yet!');
    console.log('\nWould you like to ingest "Beyond Good and Evil" now?');
    console.log('(This will take 2-3 minutes for the first run)\n');

    const answer = await askQuestion('Ingest now? (y/n): ');
    if (answer.toLowerCase() === 'y') {
      console.log('\n📚 Ingesting "Beyond Good and Evil"...');
      await agent.executeAction('nietzsche', 'ingest', {
        bookIdentifier: 'beyondgoodandevi00nietuoft',
      });
      console.log('✓ Ingestion complete!\n');
    } else {
      console.log('\n💡 Use command "ingest <number>" to ingest a book later\n');
    }
  } else {
    console.log(`✓ Found ${stats.totalBooks} book(s) with ${stats.totalChunks} passages\n`);
  }

  // Show available commands
  showHelp();

  // Interactive loop
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '\n🐧 > ',
  });

  rl.prompt();

  rl.on('line', async (input) => {
    const trimmed = input.trim();

    if (!trimmed) {
      rl.prompt();
      return;
    }

    const [command, ...args] = trimmed.split(' ');
    const fullArgs = args.join(' ');

    try {
      switch (command.toLowerCase()) {
        case 'ask':
        case 'q':
          if (!fullArgs) {
            console.log('Usage: ask <your question>');
            console.log('Example: ask What does Nietzsche say about truth?');
          } else {
            await handleAsk(agent, fullArgs);
          }
          break;

        case 'passage':
        case 'p':
          await handlePassage(agent, fullArgs);
          break;

        case 'ingest':
        case 'i':
          await handleIngest(agent, args[0]);
          break;

        case 'books':
        case 'b':
          await handleListBooks(agent);
          break;

        case 'stats':
        case 's':
          await handleStats(agent);
          break;

        case 'help':
        case 'h':
        case '?':
          showHelp();
          break;

        case 'quit':
        case 'exit':
        case 'q!':
          console.log('\n🐧 "One must imagine the penguin happy."\n');
          process.exit(0);

        default:
          // Treat unknown commands as questions
          await handleAsk(agent, trimmed);
      }
    } catch (error) {
      console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    console.log('\n🐧 Farewell, fellow seeker of truth.\n');
    process.exit(0);
  });
}

async function handleAsk(agent: Agent, question: string) {
  console.log(`\n💭 "${question}"\n`);

  const result = await agent.executeAction('nietzsche', 'ask', {
    question,
    limit: 5,
  });

  // Display Nietzsche's answer
  console.log(`═════════════════════════════════════════════════════════════`);
  console.log(`🐧 Nietzsche speaks:`);
  console.log(`═════════════════════════════════════════════════════════════`);
  console.log(wrapText(result.answer, 60));
  console.log(`═════════════════════════════════════════════════════════════\n`);

  // Show source passages if found
  if (result.passages && result.passages.length > 0) {
    console.log(`📚 Based on ${result.passageCount} passage(s) from my works:\n`);

    result.passages.slice(0, 3).forEach((passage: any, i: number) => {
      console.log(`  ${i + 1}. ${passage.book} (${(passage.relevance * 100).toFixed(0)}% relevant)`);
    });
    console.log();
  } else {
    console.log(`💡 (No exact passages found - answered from philosophical principles)\n`);
  }
}

async function handlePassage(agent: Agent, book?: string) {
  const result = await agent.executeAction('nietzsche', 'getPassage', {
    book: book || undefined,
  });

  if (result.passage.includes('No passages')) {
    console.log('\n📭 ' + result.passage);
    return;
  }

  console.log(`\n📖 Random passage from ${result.book}:\n`);
  console.log(`─────────────────────────────────────────────────────────────`);
  console.log(wrapText(result.passage, 60));
  console.log(`─────────────────────────────────────────────────────────────`);
}

async function handleIngest(agent: Agent, bookNum?: string) {
  if (!bookNum) {
    console.log('\n📚 Available books to ingest:\n');
    BOOKS.forEach((book, i) => {
      console.log(`  ${i + 1}. ${book.title}`);
    });
    console.log('\nUsage: ingest <number>');
    console.log('Example: ingest 1');
    return;
  }

  const index = parseInt(bookNum) - 1;
  if (isNaN(index) || index < 0 || index >= BOOKS.length) {
    console.log('Invalid book number. Use "ingest" to see available books.');
    return;
  }

  const book = BOOKS[index];
  console.log(`\n📚 Ingesting "${book.title}"...`);
  console.log('(This may take 2-3 minutes on first run)\n');

  const result = await agent.executeAction('nietzsche', 'ingest', {
    bookIdentifier: book.id,
  });

  if (result.alreadyIngested) {
    console.log(`✓ "${book.title}" already ingested (${result.chunks} passages)`);
    console.log('Use force=true parameter to re-ingest');
  } else {
    console.log(`✓ Ingested "${book.title}" - ${result.chunks} passages stored`);
  }
}

async function handleListBooks(agent: Agent) {
  const books = await agent.executeAction('nietzsche', 'listBooks', {});

  console.log('\n📚 Available Nietzsche books:\n');
  books.forEach((book: any, i: number) => {
    console.log(`  ${i + 1}. ${book.title}`);
    console.log(`     Source: ${book.source}`);
  });
  console.log('\nUse "ingest <number>" to ingest a book');
}

async function handleStats(agent: Agent) {
  const stats = await agent.executeAction('nietzsche', 'getStats', {});

  console.log('\n📊 Ingestion Statistics:\n');
  console.log(`  Total Books: ${stats.totalBooks}`);
  console.log(`  Total Passages: ${stats.totalChunks}`);
  console.log(`  Total Size: ${(stats.totalSize / 1024).toFixed(1)} KB`);

  if (stats.recentIngestions?.length > 0) {
    console.log('\n  Recent Ingestions:');
    stats.recentIngestions.forEach((ing: any) => {
      const date = new Date(ing.when).toLocaleDateString();
      console.log(`    • ${ing.title} (${ing.chunks} passages) - ${date}`);
    });
  }
}

function showHelp() {
  console.log(`
Available Commands:
──────────────────────────────────────────────────────────

  ask <question>     Ask me anything - I respond in my own voice
  passage [book]     Read a random passage from my works
  ingest <number>    Ingest one of my books (use "books" to see list)
  books              List all available books
  stats              Show ingestion statistics
  help               Show this help message
  quit               Exit the program

Quick Commands:
──────────────────────────────────────────────────────────

  q <question>       Ask (shorthand)
  p                  Random passage (shorthand)
  i <number>         Ingest (shorthand)
  b                  Books (shorthand)
  s                  Stats (shorthand)
  h, ?               Help (shorthand)

Examples:
──────────────────────────────────────────────────────────

  ask What is the will to power?
  ask How does Nietzsche view morality?
  passage Beyond Good and Evil
  ingest 2
  stats

Note: I synthesize responses using vector search + LLM.
      I will always respond, even without exact passages.
      I speak AS Nietzsche, not about him.
──────────────────────────────────────────────────────────
`);
}

function wrapText(text: string, width: number): string {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= width) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines.join('\n');
}

function askQuestion(prompt: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Run the interactive session
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
