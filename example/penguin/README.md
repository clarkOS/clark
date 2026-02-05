# 🐧 Nietzsche Penguin - ClarkOS Plugin Example

**Friedrich Nietzsche reborn as an AI penguin - speaks in his own voice using vector search + LLM synthesis**

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
- 🔍 Semantic search + LLM synthesis
- 🗣️ **Speaks AS Nietzsche** - responds in authentic first-person voice
- 💬 Always answers, even without exact passages
- 🎲 Random passage browsing
- 🐧 Philosophical penguin embodiment

**Available Books:**
- Beyond Good and Evil
- Thus Spoke Zarathustra
- On the Genealogy of Morals
- Twilight of the Idols

---

## Quick Start

### TL;DR - Interactive Chat
```bash
npm install
npx convex dev --once
npm run nietzsche:chat
```

Then ask questions like: `ask What is the will to power?`

---

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
MODEL_ID=anthropic/claude-3.5-haiku
LLM_PROVIDER=openrouter
```

### 3. Deploy Schema

```bash
npx convex dev --once
```

This creates the Convex database tables with vector search support.

### 4. Run Example

**Quick Demo:**
```bash
npm run nietzsche
```

This will:
1. Connect to Convex
2. List available books
3. Ingest "Beyond Good and Evil" (~2 minutes)
4. Ask a sample question
5. Get a random passage

**Interactive Q&A:**
```bash
npm run nietzsche:chat
```

This starts an interactive terminal where you can:
- **Dialogue with Nietzsche** - He responds in his own voice using LLM synthesis
- **Ask any question** - Even without exact passages, he answers philosophically
- **Get random passages** - Browse his original writings
- **Ingest multiple books** - Expand the knowledge base
- **View statistics** - Track ingestion progress

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

// Ask a question - get response in Nietzsche's voice
const result = await agent.executeAction('nietzsche', 'ask', {
  question: 'What does Nietzsche say about truth?',
  limit: 5
});
console.log(result.answer);       // Nietzsche's synthesized response
console.log(result.passages);     // Source passages used
console.log(result.passageCount); // Number of passages found

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
| `ask` | `question: string, limit?: number` | **Synthesized response in Nietzsche's voice** using vector search + LLM (always responds) |
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
- **Recommended model**: `anthropic/claude-3.5-haiku` (fast & affordable)
- **Other models**: Claude Sonnet, GPT-4, Llama, DeepSeek, etc.

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

### Example 1: Quick Demo (Non-Interactive)

```bash
npm run nietzsche
```

Runs through a complete workflow: list books, ingest, Q&A, random passage.

### Example 2: Interactive Chat Session

```bash
npm run nietzsche:chat
```

**Sample Session:**
```
🐧 Nietzsche Penguin - Interactive Dialogue

════════════════════════════════════════════════════════════
I AM Nietzsche, reborn as a penguin.
Ask me anything - I will answer in my own voice.
════════════════════════════════════════════════════════════

✓ Connected to Convex
✓ Found 1 book(s) with 194 passages

🐧 > ask What does Nietzsche say about truth?

💭 "What does Nietzsche say about truth?"

📖 Found 5 relevant passages
═════════════════════════════════════════════════════════════
🐧 Nietzsche speaks:
═════════════════════════════════════════════════════════════
Truth? Ah, you ask about truth as if it were something
fixed, something holy! Let me tell you - the will to truth
itself requires a critique. Why do we value truth over
illusion? Perhaps life itself depends on error, on
perspectival falsifications!

As I wrote, the value of truth must be experimentally
called into question. What if nothing about our condition
is "true"? What if truth is simply the kind of error
without which a certain species of life could not live?

Even we seekers of knowledge are not immune - we too
create fictions, we too impose interpretations. From this
frozen wasteland where I waddle, I see clearly: there are
no facts, only interpretations. And yes, that too is an
interpretation.
═════════════════════════════════════════════════════════════

📚 Based on 5 passage(s) from my works:

  1. Beyond Good and Evil (94% relevant)
  2. Beyond Good and Evil (89% relevant)
  3. Beyond Good and Evil (87% relevant)

🐧 > passage

📖 Random passage from Beyond Good and Evil:

─────────────────────────────────────────────────────────────
One must imagine the penguin happy, waddling boldly into
the abyss of truth...
─────────────────────────────────────────────────────────────

🐧 > stats

📊 Ingestion Statistics:

  Total Books: 1
  Total Passages: 194
  Total Size: 467.2 KB

  Recent Ingestions:
    • Beyond Good and Evil (194 passages) - 2/4/2026

🐧 > quit

🐧 "One must imagine the penguin happy."
```

### Example 3: Agent Dashboard

```bash
npm run dev
```

Then use the terminal UI to interact with the agent.

### Example 4: Check Before Re-Ingesting

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

### Example 5: Get Ingestion Stats

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

### Example 6: Autonomous Agent Integration

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

### LLM API error: "No endpoints found for x-ai/grok-beta"

The model ID in `.env.local` is invalid. Update to a working model:
```bash
MODEL_ID=anthropic/claude-3.5-haiku
```

See all available models at: https://openrouter.ai/models

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
