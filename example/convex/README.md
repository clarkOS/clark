# ClarkOS Agent Framework

**C**ontinuously **L**earning **A**gentic **R**ealtime **K**nowledgebase

A serverless autonomous agent framework powered by [Convex](https://convex.dev). Build agents that operate continuously, generate creative output, and maintain persistent presence.

## Features

- **Generative Architecture**: Continuous tick-based execution, not request-response
- **5 Memory Types**: Episodic, semantic, emotional, procedural, reflection
- **Type-Specific Deduplication**: Different similarity thresholds per memory type
- **Configurable LLM**: OpenRouter by default, no vendor lock-in
- **Serverless**: Runs on Convex with automatic scaling
- **Plugin System**: Extend with lifecycle hooks and actions
- **Full TypeScript**: Type-safe throughout

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/cloutprotocol/clarkos my-agent
cd my-agent
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Convex

```bash
npx convex dev
```

This creates a new Convex project and starts the development server.

### 4. Configure environment

Create `.env.local`:

```bash
# Required
CONVEX_URL=https://your-project.convex.cloud

# LLM Configuration (OpenRouter recommended)
OPENROUTER_KEY=your_openrouter_api_key
MODEL_ID=anthropic/claude-3.5-haiku

# Embeddings (Gemini recommended - free tier)
GEMINI_API_KEY=your_gemini_api_key

# Optional auth tokens
TICK_TOKEN=your_tick_token
WRITE_TOKEN=your_write_token
```

### 5. Run the agent

```bash
npm run dev
```

## Usage

### Basic Agent

```typescript
import { Agent, ConvexBackend } from './src';

const agent = new Agent({
  backend: new ConvexBackend({
    url: process.env.CONVEX_URL!,
    tickToken: process.env.TICK_TOKEN,
  }),
});

// Execute a single tick
await agent.tick();

// Start continuous execution
agent.start();

// Stop execution
agent.stop();

// Get current state
const state = await agent.getState();
```

### Memory Operations

```typescript
const memoryStore = agent.memory;

// Store a memory
await memoryStore.store({
  content: 'User expressed interest in AI agents',
  type: 'episodic',
  importance: 0.7,
  tags: ['user-feedback', 'positive'],
});

// Query memories
const memories = await memoryStore.get({
  type: 'semantic',
  limit: 10,
});

// Search semantically
const results = await memoryStore.search({
  query: 'AI agents',
  limit: 5,
});
```

### LLM Integration

```typescript
import { createLLMClient, configFromEnv } from './src/llm';

// Create client from environment
const llm = createLLMClient(configFromEnv());

// Simple completion
const response = await llm.ask(
  'What is the weather like?',
  'You are a helpful assistant.'
);

// Chat completion
const result = await llm.complete([
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'What is the weather like?' },
]);

console.log(result.content);
```

### Embeddings

```typescript
import { createEmbeddingClient, embeddingConfigFromEnv, cosineSimilarity } from './src/llm';

const embedder = createEmbeddingClient(embeddingConfigFromEnv());

// Generate embedding
const result = await embedder.embed('Hello world');
console.log(result.embedding.length); // 768 for Gemini

// Compare embeddings
const similarity = cosineSimilarity(embedding1, embedding2);
```

### Plugins

```typescript
import type { Plugin, TickContext } from './src/plugins';

const analyticsPlugin: Plugin = {
  name: 'analytics',
  version: '1.0.0',

  init(agent) {
    console.log('Analytics initialized');
  },

  onTick(context: TickContext) {
    console.log(`Tick: mood=${context.state.mood}, health=${context.state.health}`);
  },

  actions: {
    async trackEvent(params: { event: string }) {
      // Track event
      return { success: true };
    },
  },
};

agent.use(analyticsPlugin);
await agent.executeAction('analytics', 'trackEvent', { event: 'test' });
```

## Configuration

### LLM Providers

Configure via environment variables:

```bash
# OpenRouter (recommended - best routing, many models)
LLM_PROVIDER=openrouter
OPENROUTER_KEY=your_key
MODEL_ID=anthropic/claude-3.5-haiku

# OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key
MODEL_ID=gpt-4o-mini

# Anthropic
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_key
MODEL_ID=claude-3-5-haiku-latest

# Custom endpoint
LLM_PROVIDER=custom
LLM_BASE_URL=https://your-endpoint.com/v1/chat/completions
LLM_API_KEY=your_key
```

### Embedding Providers

```bash
# Gemini (recommended - free tier)
EMBEDDING_PROVIDER=gemini
GEMINI_API_KEY=your_key

# OpenAI
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=your_key
EMBEDDING_MODEL=text-embedding-3-small
```

### Agent Configuration

```typescript
import { createConfig } from './src/core';

const config = createConfig({
  tick: {
    interval: 300000,  // 5 minutes
    auto: false,       // Manual trigger only
    maxRetries: 3,
  },
  memory: {
    consolidationThreshold: 100,
    decayRate: 0.1,
    maxShortTerm: 50,
  },
});

const agent = new Agent({ backend, config });
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Agent Runtime                         │
├──────────────┬──────────────┬──────────────────────────┤
│    Tick      │   Memory     │       Knowledge          │
│   System     │   System     │         Base             │
│              │  (5 types)   │                          │
├──────────────┼──────────────┼──────────────────────────┤
│     LLM      │  Embeddings  │      Deduplication       │
│   (OpenRouter)│   (Gemini)   │   (Type-specific)        │
├──────────────┴──────────────┴──────────────────────────┤
│                    Plugin System                        │
├─────────────────────────────────────────────────────────┤
│              Backend (Convex Serverless)                │
└─────────────────────────────────────────────────────────┘
```

### Memory Types

| Type | Description | Dedup Threshold |
|------|-------------|-----------------|
| `episodic` | Specific events and experiences | 0.92 |
| `semantic` | Facts and concepts | 0.95 |
| `emotional` | Feelings about topics | 0.88 |
| `procedural` | Learned patterns | 0.97 |
| `reflection` | Metacognitive insights | 0.90 |

### Agent State

```typescript
interface AgentState {
  mood: 'neutral' | 'expressive' | 'curious' | 'excited' | 'reflective' | 'concerned';
  health: number;      // 0-100
  routine: 'morning' | 'day' | 'evening' | 'overnight';
  volatility: number;  // 0-1
  counters: { ticks: number; feeds: number };
  lastTick: string | null;
  cryo: boolean;
}
```

## API Endpoints

The Convex backend exposes HTTP endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/state` | GET | Get agent state |
| `/memories` | GET | List memories |
| `/memories` | POST | Store memory |
| `/memories/stats` | GET | Memory statistics |
| `/memories/core` | GET | Core memories |
| `/knowledge` | GET | List knowledge |
| `/knowledge` | POST | Add knowledge |
| `/logs` | GET | Activity logs |
| `/health` | GET | Health check |

## Deployment

### Convex (Recommended)

```bash
# Deploy to Convex
npx convex deploy

# Set environment variables in Convex dashboard
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `CONVEX_URL` | Convex deployment URL | Yes |
| `OPENROUTER_KEY` | OpenRouter API key | Yes (for LLM) |
| `GEMINI_API_KEY` | Gemini API key | Yes (for embeddings) |
| `TICK_TOKEN` | Auth token for tick endpoint | No |
| `WRITE_TOKEN` | Auth token for write endpoints | No |
| `MODEL_ID` | LLM model identifier | No |
| `LLM_PROVIDER` | LLM provider (openrouter/openai/anthropic) | No |
| `EMBEDDING_PROVIDER` | Embedding provider (gemini/openai) | No |

## Documentation

Full documentation at [docs.clarkos.dev](https://docs.clarkos.dev)

- [Getting Started](/quickstart)
- [Core Concepts](/concepts/agents)
- [Memory System](/concepts/memory)
- [Plugin Development](/guides/custom-plugins)

## License

MIT
