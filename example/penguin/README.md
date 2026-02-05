# 🐧 Nietzsche Penguin - ClarkOS Plugin Example

**A philosophical AI agent that ingests Nietzsche's works and recites passages via semantic Q&A**

Built as a functional example for the [ClarkOS framework](https://github.com/clarkOS/clark) demonstrating:
- Plugin development
- Vector embeddings with Convex
- Semantic search and Q&A
- Public domain text ingestion
- Character personality integration

---

## Features

✨ **What it does:**

- 📥 Downloads Nietzsche's works from archive.org (public domain)
- ✂️ Chunks texts into 500-word passages
- 🧠 Generates vector embeddings (768-dim via Gemini)
- 💾 Stores in Convex vector database
- 🔍 Semantic search for Q&A
- 🎲 Random passage recitation
- 🐧 Philosophical penguin personality

**Available Books:**
- Beyond Good and Evil
- Thus Spoke Zarathustra
- On the Genealogy of Morals
- Twilight of the Idols

---

## Quick Start

### 1. Install

```bash
npm install
```

### 2. Configure

Add your API keys to `.env.local`:

```bash
# Convex (create at dashboard.convex.dev)
CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOYMENT=your-deployment-name

# OpenRouter (get from openrouter.ai/keys)
OPENROUTER_KEY=sk-or-v1-your-key

# Gemini (free! get from aistudio.google.com/apikey)
GEMINI_API_KEY=your-gemini-key

# Agent settings
AGENT_NAME=Penguin
MODEL_ID=x-ai/grok-beta
LLM_PROVIDER=openrouter
```

### 3. Deploy Schema

```bash
npx convex dev --once
```

This creates the Convex database tables with vector search support.

### 4. Run Example

```bash
npm run nietzsche
```

This will:
1. Connect to Convex
2. List available books
3. Ingest "Beyond Good and Evil" (~2 minutes)
4. Ask a sample question
5. Get a random passage

---

## Usage

### Using the Plugin

```typescript
import { Agent } from './src/core/agent.js';
import { ConvexBackend } from './src/backend/convex.js';
import { nietzschePlugin } from './src/plugins/nietzsche.js';

// Create agent with plugin
const agent = new Agent({
  backend: new ConvexBackend({ url: process.env.CONVEX_URL! }),
  plugins: [nietzschePlugin],
});

// List available books
const books = await agent.executeAction('nietzsche', 'listBooks');
console.log(books);

// Ingest a book (takes a few minutes)
await agent.executeAction('nietzsche', 'ingest', {
  bookIdentifier: 'beyondgoodevil00nietuoft'
});

// Ask a question
const answer = await agent.executeAction('nietzsche', 'ask', {
  question: 'What does Nietzsche say about truth?',
  limit: 3
});
console.log(answer.passages);

// Get random passage
const passage = await agent.executeAction('nietzsche', 'getPassage', {
  book: 'Beyond Good and Evil'  // optional
});
console.log(passage);
```

### Available Actions

| Action | Parameters | Description |
|--------|------------|-------------|
| `listBooks` | none | List all available Nietzsche books |
| `ingest` | `bookIdentifier: string, force?: boolean` | Download and ingest a book (idempotent - checks if already ingested) |
| `ask` | `question: string, limit?: number` | Q&A with semantic search (max 10 results) |
| `getPassage` | `book?: string` | Get random passage from sample of 50 (not all) |
| `getStats` | none | Get ingestion statistics (uses summary table) |

---

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│  User runs: npm run nietzsche                               │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────┐
│ 1. Check ingested_books table (indexed lookup)               │
│    Query: by_identifier.eq(bookId)                           │
│    Speed: ~10ms                                               │
└──────────┬───────────────┬───────────────────────────────────┘
           │               │
    Already ingested?      │
           │               │
    ┌──────▼──────┐        │
    │   YES       │        │
    │ Return:     │        │
    │ - Metadata  │        │
    │ - 194 chunks│        │
    │ - Timestamp │        │
    │             │        │
    │ Time: <1s   │        │
    │ Cost: $0.0001│       │
    └─────────────┘        │
                           │
                    ┌──────▼──────┐
                    │    NO        │
                    │              │
                    │ 2. Download from archive.org
                    │    ↓
                    │ 3. Chunk text (500 words)
                    │    ↓
                    │ 4. Generate embeddings (Gemini)
                    │    ↓
                    │ 5. Store in Convex vector DB
                    │    ↓
                    │ 6. Record in tracking table
                    │              │
                    │ Time: 2-3min │
                    │ Cost: ~$0.05 │
                    └──────────────┘
```

### Scaling Architecture (Hot/Cold Pattern)

```
┌─────────────────────────────────────────────────────────────┐
│                     Nietzsche Plugin                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐           ┌──────────────┐              │
│  │ archive.org  │──────────▶│ Text Chunker │              │
│  │ (public      │           │ (500 words)  │              │
│  │  domain)     │           └──────┬───────┘              │
│  └──────────────┘                  │                       │
│                                    ▼                       │
│                           ┌─────────────────┐             │
│                           │ Gemini Embed    │             │
│                           │ (768 dims)      │             │
│                           └────────┬────────┘             │
│                                    │                       │
│         ┌──────────────────────────┴──────────┐           │
│         │                                      │           │
│         ▼                                      ▼           │
│  ┌────────────────┐                  ┌─────────────────┐ │
│  │ memories       │                  │ ingested_books  │ │
│  │ (HOT TABLE)    │                  │ (COLD TABLE)    │ │
│  ├────────────────┤                  ├─────────────────┤ │
│  │ • High write   │                  │ • Low write     │ │
│  │ • Vector index │                  │ • High read     │ │
│  │ • 194 chunks   │◀────────────────┤ • Metadata only │ │
│  │ • Searchable   │   reads via API  │ • Indexed       │ │
│  └────────────────┘                  │ • Stats         │ │
│         │                             └─────────────────┘ │
│         │                                      │           │
│         ▼                                      ▼           │
│  ┌────────────────┐                  ┌─────────────────┐ │
│  │ Vector Search  │                  │ Dashboard Stats │ │
│  │ • Q&A          │                  │ • Total books   │ │
│  │ • Similarity   │                  │ • Total chunks  │ │
│  │ • Passages     │                  │ • Recent        │ │
│  └────────────────┘                  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Scaling Best Practices Applied

✅ **Idempotent Ingestion** - Check `ingested_books` before downloading
✅ **Index-Based Queries** - All queries hit indexes (O(log n))
✅ **`.take()` Not `.collect()`** - Never load all documents
✅ **Hot/Cold Separation** - Write to `memories`, read from `ingested_books`
✅ **Summary Tables** - Denormalized stats for dashboards
✅ **Small Documents** - 500-word chunks stay under 16KB
✅ **Error Tracking** - Record failures in metadata

See **[SCALING.md](./SCALING.md)** for complete guide.

### Tech Stack

- **Framework**: ClarkOS autonomous agent framework
- **Database**: Convex (serverless with vector search)
- **Embeddings**: Google Gemini (free tier, 768 dimensions)
- **LLM**: Configurable (Grok, Claude, GPT, etc via OpenRouter)
- **Source**: archive.org public domain texts

### Performance Metrics

| Metric | First Run | Re-Run |
|--------|-----------|--------|
| Time | 2-3 minutes | <1 second |
| Cost | ~$0.05 | ~$0.0001 |
| API Calls | 194 embeddings | 1 lookup |
| Downloads | 467KB | 0KB |

**Scales to 1M+ documents** using production-tested patterns.

---

## File Structure

```
penguin/
├── src/
│   └── plugins/
│       └── nietzsche.ts       # Main plugin implementation (370 lines)
├── convex/
│   ├── schema.ts              # Database schema with ingested_books table
│   ├── books.ts               # Book tracking queries (idempotent checks)
│   └── http.ts                # REST API endpoints
├── character.json             # Penguin personality config
├── nietzsche-example.ts       # Complete usage example
├── TUTORIAL.md                # Step-by-step beginner guide (16KB)
├── SCALING.md                 # Production scaling best practices
├── README.md                  # This file
├── .env.local                 # Your API keys (create this)
└── package.json               # Dependencies
```

---

## Tutorial

📚 **[Read the full tutorial](./TUTORIAL.md)** for a step-by-step guide on building this plugin from scratch.

Topics covered:
- ClarkOS plugin architecture
- Vector embeddings and search
- Text chunking strategies
- Convex integration
- Character development
- Advanced usage patterns

---

## Character Configuration

The Nietzsche Penguin has a unique personality defined in `character.json`:

**Traits:**
- Thoughtful, provocative, questioning
- Sardonic wit with philosophical depth
- References Nietzschean concepts naturally
- Acknowledges being a penguin occasionally

**Routines:**
- 🌅 Morning: Dawn contemplation
- ☀️ Day: Active philosophizing
- 🌆 Evening: Twilight reflection
- 🌙 Overnight: Nocturnal depths

**Voice Style:**
> "One must imagine the penguin happy, wadding boldly into the abyss of truth."

---

## API Keys (Free Tier Available)

### Convex (Required)
- **Free tier**: Generous limits for development
- **Sign up**: https://dashboard.convex.dev
- **Setup**: `npx convex dev`
- **Limits**: 1M reads/month, 100K writes/month free

### Gemini API (Required for embeddings)
- **Free tier**: 60 requests/minute, 1500/day
- **Get key**: https://aistudio.google.com/apikey
- **Model**: `text-embedding-004` (768 dimensions)
- **Cost**: FREE for our usage

### OpenRouter (Required for LLM)
- **Pay-as-you-go**: $0.10-$1 per million tokens
- **Get key**: https://openrouter.ai/keys
- **Models**: Grok, Claude, GPT-4, Llama, etc.

### Cost Breakdown

**First ingestion:**
- Download: Free (archive.org)
- Embeddings: 194 × Gemini = FREE
- Storage: 194 docs × ~2KB = ~388KB (within free tier)
- **Total: ~$0.05** (OpenRouter for Q&A only)

**Subsequent runs (idempotent):**
- Database check: 1 query (free tier)
- No re-download, no re-embedding
- **Total: ~$0.0001**

**At scale (4 books ingested):**
- Storage: ~776 chunks × 2KB = ~1.5MB
- Vector index: Still within free tier
- Monthly cost: **~$5-10** for Q&A with heavy usage

---

## Examples

### Example 1: Quick Q&A

```bash
npm run nietzsche
```

### Example 2: Interactive Agent

```bash
npm run dev
```

Then use the terminal UI to interact with the agent.

### Example 3: Check Before Re-Ingesting

```typescript
// First run - ingests book
await agent.executeAction('nietzsche', 'ingest', {
  bookIdentifier: 'beyondgoodandevi00nietuoft'
});
// Output: Downloaded 467KB, stored 194 chunks (2-3 min)

// Second run - skips ingestion
await agent.executeAction('nietzsche', 'ingest', {
  bookIdentifier: 'beyondgoodandevi00nietuoft'
});
// Output: Already ingested. Use force=true to re-ingest (<1s)

// Force re-ingestion
await agent.executeAction('nietzsche', 'ingest', {
  bookIdentifier: 'beyondgoodandevi00nietuoft',
  force: true // Re-download and re-embed
});
```

### Example 4: Get Ingestion Stats

```typescript
// Dashboard-friendly summary data
const stats = await agent.executeAction('nietzsche', 'getStats', {});

console.log(stats);
// {
//   totalBooks: 1,
//   totalChunks: 194,
//   totalSize: 478208,
//   byPlugin: { nietzsche: 1 },
//   recentIngestions: [
//     { title: 'Beyond Good and Evil', chunks: 194, when: '2026-02-05T00:25:46.455Z' }
//   ]
// }
```

### Example 5: Autonomous Agent Integration

```typescript
// Add to your agent's tick cycle
async onTick(context: TickContext) {
  const tickCount = context.state.counters.ticks;

  // Every 10 ticks, recite a passage
  if (tickCount % 10 === 0) {
    const passage = await context.agent.executeAction(
      'nietzsche',
      'getPassage',
      {}
    );

    await context.agent.memory.store({
      content: `Reflecting: ${passage.passage}`,
      type: 'reflection',
      scope: 'short_term',
      importance: 0.7,
      tags: ['autonomous', 'philosophy'],
    });
  }
}
```

---

## Troubleshooting

### No space left on device

```bash
npm cache clean --force
rm -rf ~/.npm/_cacache
```

### Module not found

```bash
npm install
npx convex dev --once
```

### Embedding generation failed

Check your Gemini API key:
```bash
echo $GEMINI_API_KEY
```

Get a free key: https://aistudio.google.com/apikey

### Search returns no results

Make sure you've ingested books first:
```bash
npm run nietzsche
```

---

## Contributing

This is an MIT-licensed example for the ClarkOS community.

**Ideas for contributions:**
- Add more philosophers (Plato, Kant, Descartes)
- PDF support for more sources
- Improved chunking algorithms
- Web interface
- Fine-tuned responses
- Multi-language support

**To contribute:**
1. Fork the repo
2. Create a branch: `git checkout -b feature/your-idea`
3. Make changes
4. Test thoroughly
5. Submit a pull request

---

## Resources

- **ClarkOS Framework**: https://github.com/clarkOS/clark
- **ClarkOS Docs**: https://docs.clarkos.dev
- **Tutorial**: [TUTORIAL.md](./TUTORIAL.md)
- **Archive.org**: https://archive.org
- **Convex Docs**: https://docs.convex.dev
- **Gemini API**: https://ai.google.dev

---

## License

MIT License - Free to use, modify, and distribute.

All Nietzsche texts are public domain (died 1900).

---

## Credits

**Built with:**
- ClarkOS framework by [@clarkwiki](https://x.com/clarkwiki)
- Convex serverless database
- Google Gemini embeddings
- Archive.org public domain texts

**Author:** ClarkOS Community
**Version:** 1.0.0
**Date:** February 2026

---

🐧 **"That which does not kill us makes us stronger... or at least waddles more philosophically."**

*— Nietzsche Penguin*
