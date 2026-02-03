#!/usr/bin/env node
/**
 * CLI entry point for the agent framework.
 * @module cli
 */

import React from 'react';
import { render } from 'ink';
import { App } from './ui/App.js';
import { ConvexBackend } from './backend/convex.js';
import { MemoryBackend } from './backend/memory.js';

// Parse command line arguments
const args = process.argv.slice(2);

function printHelp() {
  console.log(`
Convex Agent Framework CLI

Usage:
  convex-agent [options]

Options:
  --url <url>       Convex deployment URL (or set CONVEX_URL env)
  --demo            Run in demo mode with in-memory backend
  --refresh <ms>    Refresh interval in milliseconds (default: 3000)
  --help            Show this help message

Environment Variables:
  CONVEX_URL        Convex deployment URL
  TICK_TOKEN        Auth token for tick operations
  WRITE_TOKEN       Auth token for write operations

Examples:
  convex-agent --url https://your-deployment.convex.site
  convex-agent --demo
  CONVEX_URL=https://... convex-agent
`);
}

function parseArgs() {
  const options: {
    url?: string;
    demo: boolean;
    refresh: number;
    help: boolean;
  } = {
    demo: false,
    refresh: 3000,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--demo') {
      options.demo = true;
    } else if (arg === '--url' && args[i + 1]) {
      options.url = args[++i];
    } else if (arg === '--refresh' && args[i + 1]) {
      options.refresh = parseInt(args[++i], 10);
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    printHelp();
    process.exit(0);
  }

  // Determine backend
  let backend;

  if (options.demo) {
    console.log('Starting in demo mode with in-memory backend...\n');
    backend = new MemoryBackend();

    // Add some sample data
    await backend.storeMemory({
      content: 'This is a demo memory',
      type: 'semantic',
      scope: 'short_term',
      importance: 0.7,
      salience: 0.5,
      valence: 0.2,
      confidence: 1,
      tags: ['demo'],
      sourceType: 'system',
      createdAt: new Date().toISOString(),
      accessCount: 0,
      unique: true,
    });

    await backend.addKnowledge({
      ts: new Date().toISOString(),
      textExcerpt: 'Demo knowledge item - framework is running',
      type: 'note',
      source: 'system',
    });
  } else {
    const url = options.url || process.env.CONVEX_URL;

    if (!url) {
      console.error('Error: No Convex URL provided.');
      console.error('Use --url <url> or set CONVEX_URL environment variable.');
      console.error('Or use --demo for in-memory mode.\n');
      printHelp();
      process.exit(1);
    }

    backend = new ConvexBackend({
      url,
      tickToken: process.env.TICK_TOKEN,
      writeToken: process.env.WRITE_TOKEN,
    });
  }

  // Render the app
  render(<App backend={backend} refreshInterval={options.refresh} />);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
