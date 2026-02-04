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
| `ingest` | `bookIdentifier: string` | Download and ingest a book into vector store |
| `ask` | `question: string, limit?: number` | Q&A with semantic search |
| `getPassage` | `book?: string` | Get random passage (optionally filtered by book) |

---

## Architecture

```
┌─────────────────────────────────────────┐
│         Nietzsche Plugin                │
├─────────────────────────────────────────┤
│                                         │
│  1. Download from archive.org           │
│     ↓                                   │
│  2. Chunk text (500 words)              │
│     ↓                                   │
│  3. Generate embeddings (Gemini)        │
│     ↓                                   │
│  4. Store in Convex vector DB           │
│     ↓                                   │
│  5. Semantic search for Q&A             │
│                                         │
└─────────────────────────────────────────┘
```

**Tech Stack:**
- **Framework**: ClarkOS autonomous agent framework
- **Database**: Convex (serverless with vector search)
- **Embeddings**: Google Gemini (free tier, 768 dimensions)
- **LLM**: Configurable (Grok, Claude, GPT, etc via OpenRouter)
- **Source**: archive.org public domain texts

---

## File Structure

```
penguin/
├── src/
│   └── plugins/
│       └── nietzsche.ts       # Main plugin implementation
├── character.json             # Penguin personality config
├── nietzsche-example.ts       # Complete usage example
├── TUTORIAL.md                # Step-by-step guide
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

### Gemini API (Required for embeddings)
- **Free tier**: 60 requests/minute
- **Get key**: https://aistudio.google.com/apikey
- **Model**: `text-embedding-004` (768 dimensions)

### OpenRouter (Required for LLM)
- **Pay-as-you-go**: $0.10-$1 per million tokens
- **Get key**: https://openrouter.ai/keys
- **Models**: Grok, Claude, GPT-4, Llama, etc.

**Estimated cost for example:**
- Ingest 1 book: ~$0.05
- 10 questions: ~$0.01
- **Total**: Under $0.10

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

### Example 3: Custom Integration

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
