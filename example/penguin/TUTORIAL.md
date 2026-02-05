# Building the Nietzsche Penguin Plugin for ClarkOS

**A Beginner-Friendly Tutorial**

This tutorial walks you through building a complete AI agent plugin that ingests public domain philosophical texts from archive.org, stores them in a vector database, and enables semantic Q&A using ClarkOS framework.

---

## Table of Contents

1. [What We're Building](#what-were-building)
2. [Prerequisites](#prerequisites)
3. [Architecture Overview](#architecture-overview)
4. [Step-by-Step Implementation](#step-by-step-implementation)
5. [Testing the Plugin](#testing-the-plugin)
6. [Advanced Usage](#advanced-usage)

---

## What We're Building

The **Nietzsche Penguin Plugin** is an autonomous agent plugin that:

- 📥 Downloads public domain Nietzsche texts from archive.org
- ✂️ Chunks large texts into manageable pieces
- 🧠 Generates vector embeddings using AI
- 💾 Stores embeddings in Convex database
- 🔍 Performs semantic search for Q&A
- 🎲 Recites random philosophical passages

**Key Features:**
- MIT Licensed (open source)
- Uses public domain texts only
- Full vector search capability
- Real-time Q&A with context
- Extensible to any text source

---

## Prerequisites

### 1. Environment Setup

```bash
# Node.js 18+ required
node --version  # Should be 18.0.0 or higher

# Clone ClarkOS
git clone https://github.com/clarkOS/clark
cd clark/example/penguin
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create `.env.local`:

```bash
# Convex deployment URL
CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOYMENT=your-deployment-name

# LLM API Key (for the agent's reasoning)
OPENROUTER_KEY=sk-or-v1-your-key

# Embedding API Key (for vector search) - FREE!
GEMINI_API_KEY=your-gemini-key
```

**Get API Keys:**
- OpenRouter: https://openrouter.ai/keys
- Gemini (free): https://aistudio.google.com/apikey

### 4. Deploy Convex Schema

```bash
npx convex dev --once
```

This creates the database tables with vector search support.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              Nietzsche Plugin                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────┐      ┌──────────────┐        │
│  │ archive.org │─────▶│ Text Chunker │        │
│  └─────────────┘      └──────────────┘        │
│        │                      │                 │
│        ▼                      ▼                 │
│  ┌─────────────┐      ┌──────────────┐        │
│  │  Public     │      │  500-word    │        │
│  │  Domain     │      │  Chunks      │        │
│  │  Texts      │      └──────────────┘        │
│  └─────────────┘              │                 │
│                                ▼                 │
│                       ┌──────────────┐         │
│                       │  Embeddings  │         │
│                       │  (Gemini)    │         │
│                       └──────────────┘         │
│                                │                 │
│                                ▼                 │
│  ┌──────────────────────────────────────┐     │
│  │    Convex Vector Database            │     │
│  │  - 768-dim embeddings                │     │
│  │  - Semantic memory type              │     │
│  │  - Similarity search                 │     │
│  └──────────────────────────────────────┘     │
│                                │                 │
│                                ▼                 │
│                       ┌──────────────┐         │
│                       │   Q&A API    │         │
│                       └──────────────┘         │
└─────────────────────────────────────────────────┘
```

---

## Step-by-Step Implementation

### Step 1: Understanding ClarkOS Plugin System

ClarkOS plugins follow this structure:

```typescript
export interface Plugin {
  name: string;           // Unique identifier
  version: string;        // Semantic version
  description?: string;   // What it does

  init?(agent: Agent): void;              // Called on load
  cleanup?(agent: Agent): void;           // Called on unload
  onTick?(context: TickContext): void;    // Called every tick

  actions?: Record<string, ActionHandler>; // Callable functions
}
```

**Key Concepts:**
- **Plugins** extend agent capabilities
- **Actions** are callable functions (like API endpoints)
- **Hooks** (init, onTick, cleanup) integrate with agent lifecycle
- **Agent** provides access to memory, knowledge, and LLM

### Step 2: Define Book Metadata

Create `src/plugins/nietzsche.ts`:

```typescript
/**
 * Book metadata from archive.org (public domain)
 */
interface NietzscheBook {
  identifier: string;  // Archive.org unique ID
  title: string;       // Human-readable title
  url: string;         // Direct download URL
}

const NIETZSCHE_BOOKS: NietzscheBook[] = [
  {
    identifier: 'beyondgoodevil00nietuoft',
    title: 'Beyond Good and Evil',
    url: 'https://archive.org/stream/beyondgoodevil00nietuoft/beyondgoodevil00nietuoft_djvu.txt'
  },
  // Add more books...
];
```

**Why This Works:**
- Archive.org provides plain text versions via `/stream/{id}/{id}_djvu.txt`
- All Nietzsche works are public domain (died 1900)
- No authentication needed

### Step 3: Create Plugin Structure

```typescript
export const nietzschePlugin: Plugin = {
  name: 'nietzsche',
  version: '1.0.0',
  description: 'Ingests Nietzsche texts and provides Q&A',

  async init(agent: Agent) {
    console.log('🐧 Nietzsche Plugin initialized');
  },

  actions: {
    // We'll implement these next
    listBooks: async () => { /* ... */ },
    ingest: async (params, agent) => { /* ... */ },
    ask: async (params, agent) => { /* ... */ },
    getPassage: async (params, agent) => { /* ... */ },
  },
};
```

### Step 4: Implement Text Chunking

Large texts need to be split into chunks for embedding:

```typescript
function chunkText(text: string, wordsPerChunk: number = 500): string[] {
  // Clean text
  const cleaned = text
    .replace(/\r\n/g, '\n')      // Normalize line endings
    .replace(/\n{3,}/g, '\n\n')  // Remove excessive newlines
    .trim();

  // Split by paragraphs
  const paragraphs = cleaned.split(/\n\n+/).filter(p => p.trim().length > 0);

  const chunks: string[] = [];
  let currentChunk = '';
  let currentWordCount = 0;

  for (const paragraph of paragraphs) {
    const wordCount = paragraph.split(/\s+/).length;

    // Start new chunk if too large
    if (currentWordCount + wordCount > wordsPerChunk && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
      currentWordCount = 0;
    }

    currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    currentWordCount += wordCount;

    // Save chunk if large enough
    if (currentWordCount >= wordsPerChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
      currentWordCount = 0;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
```

**Why 500 Words?**
- Balances context vs. specificity
- Works well with most embedding models
- Fits within Gemini's token limits

### Step 5: Implement Ingest Action

Download, chunk, and store with embeddings:

```typescript
async ingest(params: Record<string, unknown>, agent: Agent) {
  const { bookIdentifier } = params;

  const book = NIETZSCHE_BOOKS.find(b => b.identifier === bookIdentifier);
  if (!book) throw new Error('Book not found');

  // 1. Download text
  const response = await fetch(book.url);
  const text = await response.text();

  // 2. Chunk text
  const chunks = chunkText(text, 500);
  console.log(`Split into ${chunks.length} chunks`);

  // 3. Store each chunk with embeddings
  for (let i = 0; i < chunks.length; i++) {
    await agent.memory.store({
      content: chunks[i],
      type: 'semantic',        // Enables vector search
      scope: 'long_term',      // Persistent storage
      importance: 0.8,         // High value content
      tags: ['nietzsche', book.title.toLowerCase().replace(/\s+/g, '-')],
      sourceType: 'book',
      metadata: {
        book: book.title,
        chunk: i,
        totalChunks: chunks.length,
      },
    });
  }

  return { success: true, chunks: chunks.length };
}
```

**What Happens Under the Hood:**
1. `agent.memory.store()` calls Convex backend
2. Backend generates embedding using Gemini API
3. Embedding stored in vector index
4. Content stored with metadata

### Step 6: Implement Q&A Action

Search and return relevant passages:

```typescript
async ask(params: Record<string, unknown>, agent: Agent) {
  const { question, limit = 3 } = params;

  // Semantic search using vector similarity
  const results = await agent.memory.search({
    query: question,
    limit: limit as number,
    type: 'semantic',
    tags: ['nietzsche'],
  });

  // Format results
  const passages = results.map(result => ({
    text: result.content,
    book: result.metadata?.book || 'Unknown',
    relevance: result.similarity || 0,
  }));

  return {
    question,
    passages,
    count: passages.length,
  };
}
```

**How Vector Search Works:**
1. Question converted to embedding
2. Cosine similarity computed against all stored embeddings
3. Top N most similar chunks returned
4. Results sorted by relevance score (0-1)

### Step 7: Export Plugin

Update `src/plugins/index.ts`:

```typescript
export * from './types.js';
export * from './loader.js';
export * from './nietzsche.js';  // Add this line
```

---

## Testing the Plugin

### Option 1: Interactive Example

Run the provided example script:

```bash
npm run cli
```

Then use the example:

```typescript
import { nietzschePlugin } from './src/plugins/nietzsche.js';

const agent = new Agent({
  backend: new ConvexBackend({ url: process.env.CONVEX_URL }),
  plugins: [nietzschePlugin],
});

// List books
await agent.executeAction('nietzsche', 'listBooks');

// Ingest a book
await agent.executeAction('nietzsche', 'ingest', {
  bookIdentifier: 'beyondgoodevil00nietuoft'
});

// Ask a question
await agent.executeAction('nietzsche', 'ask', {
  question: 'What does Nietzsche say about truth?',
  limit: 3
});
```

### Option 2: Example Script

Run the complete example:

```bash
tsx nietzsche-example.ts
```

This will:
1. Connect to Convex
2. List available books
3. Ingest "Beyond Good and Evil"
4. Ask a sample question
5. Get a random passage

**Expected Output:**

```
🐧 Nietzsche Penguin Agent - Example

📡 Connecting to Convex...
🤖 Creating agent with Nietzsche plugin...
✅ Agent ready!

📚 Available books:
[
  { title: 'Beyond Good and Evil', identifier: 'beyondgoodevil00nietuoft', source: 'archive.org (public domain)' },
  ...
]

📖 Ingesting "beyondgoodevil00nietuoft"...
📄 Downloaded 234KB
✂️  Split into 156 chunks
  📝 Stored 10/156 chunks...
  📝 Stored 20/156 chunks...
  ...
✅ Ingested "Beyond Good and Evil" - 156/156 chunks stored

💬 Q&A Example:
Question: What does Nietzsche say about truth?

Answer:
--- Passage 1 (from Beyond Good and Evil, relevance: 0.87) ---
The falseness of a judgment is not necessarily an objection to a judgment;
the question is how far it is life-promoting...

--- Passage 2 (from Beyond Good and Evil, relevance: 0.84) ---
What is truth? Perhaps a species of belief which has become a condition of life...

--- Passage 3 (from Beyond Good and Evil, relevance: 0.81) ---
Truth is the kind of error without which a certain species could not live...
```

---

## Advanced Usage

### 1. Integrate with Agent Ticks

Make the agent autonomously recite passages:

```typescript
export const nietzschePlugin: Plugin = {
  // ... existing code ...

  async onTick(context: TickContext) {
    // Every 10 ticks, recite a random passage
    if (context.state.counters.ticks % 10 === 0) {
      const passage = await this.actions!.getPassage({}, context.agent);

      // Store as a reflection memory
      await context.agent.memory.store({
        content: `Reflecting on Nietzsche: ${passage.passage}`,
        type: 'reflection',
        scope: 'short_term',
        importance: 0.6,
        tags: ['autonomous', 'philosophy'],
      });
    }
  },
};
```

### 2. Add More Sources

Extend to other philosophers:

```typescript
const PHILOSOPHY_BOOKS = {
  nietzsche: [...NIETZSCHE_BOOKS],
  plato: [
    {
      identifier: 'republic00plat',
      title: 'The Republic',
      url: 'https://archive.org/stream/republic00plat/republic00plat_djvu.txt'
    }
  ],
  // Add more philosophers...
};
```

### 3. Custom Character Integration

Create a philosophical penguin personality:

```json
// character.json
{
  "name": "Nietzsche Penguin",
  "identity": {
    "species": "penguin",
    "role": "philosophical companion",
    "background": "A penguin who has read all of Nietzsche's works"
  },
  "personality": {
    "baseTraits": ["thoughtful", "provocative", "questioning"],
    "mood": "reflective"
  },
  "topics": {
    "interests": ["philosophy", "nihilism", "existentialism", "will to power"],
    "expertise": ["Nietzsche", "German philosophy", "19th century thought"]
  }
}
```

### 4. Export Knowledge

Export Q&A pairs for fine-tuning:

```typescript
async exportQA(params: Record<string, unknown>, agent: Agent) {
  const memories = await agent.memory.search({
    query: '',
    limit: 1000,
    tags: ['nietzsche'],
  });

  const qa = memories.map(m => ({
    question: `What does this passage mean?`,
    context: m.content,
    book: m.metadata?.book,
  }));

  return qa;
}
```

---

## Key Takeaways

✅ **What You Learned:**

1. **Plugin Architecture**: How ClarkOS plugins work
2. **Vector Search**: Embedding generation and semantic search
3. **Text Processing**: Chunking strategies for large documents
4. **Public Domain**: Using archive.org for legal, free content
5. **Convex Integration**: Serverless vector database
6. **Action System**: Creating callable functions on agents

✅ **Skills Gained:**

- Plugin development
- Vector database operations
- Text processing and chunking
- API integration (archive.org)
- Async/await patterns
- TypeScript interfaces

✅ **Next Steps:**

- Add more philosophers and texts
- Implement conversation mode
- Create a web interface
- Fine-tune responses with LLM
- Deploy as an autonomous agent
- Contribute back to ClarkOS

---

## Troubleshooting

### "No space left on device"

```bash
npm cache clean --force
rm -rf ~/.npm/_cacache
```

### "Cannot find module"

```bash
npm install
npx convex dev --once
```

### "Embedding generation failed"

Check your Gemini API key:
```bash
echo $GEMINI_API_KEY  # Should print your key
```

Get a free key: https://aistudio.google.com/apikey

### "Memory search returns no results"

Make sure you've ingested books first:
```typescript
await agent.executeAction('nietzsche', 'ingest', {
  bookIdentifier: 'beyondgoodevil00nietuoft'
});
```

---

## Resources

- **ClarkOS Docs**: https://docs.clarkos.dev
- **ClarkOS GitHub**: https://github.com/clarkOS/clark
- **Archive.org**: https://archive.org
- **Convex Docs**: https://docs.convex.dev
- **Gemini API**: https://ai.google.dev/docs

---

## License

MIT License - Free to use, modify, and distribute.

All Nietzsche texts are public domain.

---

## Contributing

This is a working example for the ClarkOS framework. To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

**Ideas for Contributions:**
- Add more philosophers
- Improve chunking algorithm
- Add PDF support
- Create visualization
- Build web interface
- Add multilingual support

---

**Built with ❤️ for the ClarkOS community**

🐧 Happy philosophizing!
