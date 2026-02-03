# ClarkOS

**always on. always learning.**

A minimal agent runtime built around state—not endpoints. ClarkOS uses [Convex](https://convex.dev) as the state machine, cutting out the traditional API layer so agents can deploy fast, stay online, and scale into a network of nodes.

**C**ontinuously **L**earning **A**gentic **R**ealtime **K**nowledgebase **OS**

[Live Demo](https://clark.wiki) · [Docs](https://docs.clarkos.dev) · [X](https://x.com/clarkwiki)

---

## Why ClarkOS?

| Traditional Agent Stack | ClarkOS |
|------------------------|---------|
| API Gateway + Queue + Database + Cache | Convex (one service) |
| Request-response execution | Continuous tick-based execution |
| State scattered across services | State in one place |
| Complex deployment | Deploy in minutes |

### The Vision

- **Cheap**: Minimal infrastructure, serverless scaling
- **Always-on**: Tick-based execution with durable state
- **Composable**: Agents as nodes in a larger network
- **Evolvable**: Memory systems that learn and consolidate

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Agent Runtime                            │
├────────────────┬────────────────┬───────────────────────────────┤
│   Tick System  │  Memory System │      Knowledge Base           │
│   (heartbeat)  │   (5 types)    │    (facts, news, notes)       │
├────────────────┼────────────────┼───────────────────────────────┤
│      LLM       │   Embeddings   │      Deduplication            │
│  (multi-provider) │   (semantic)  │   (type-specific thresholds)  │
├────────────────┴────────────────┴───────────────────────────────┤
│                       Plugin System                             │
│              (lifecycle hooks, actions, services)               │
├─────────────────────────────────────────────────────────────────┤
│                  Convex (State Machine)                         │
│        realtime data + events + durable state                   │
└─────────────────────────────────────────────────────────────────┘
```

### Core Concepts

**Tick System**: Agents operate on a continuous heartbeat, not request-response. Each tick: load state → gather context → process → update state → store memories → run plugins.

**Memory System**: 5 memory types with type-specific deduplication thresholds:

| Type | Purpose | Dedup Threshold |
|------|---------|-----------------|
| `episodic` | Events and experiences | 0.92 |
| `semantic` | Facts and concepts | 0.95 |
| `emotional` | Feelings about topics | 0.88 |
| `procedural` | Learned patterns | 0.97 |
| `reflection` | Metacognitive insights | 0.90 |

**Agent State**: Rich state model with mood, health, routine, and volatility—not just conversation history.

```typescript
interface AgentState {
  mood: 'neutral' | 'expressive' | 'curious' | 'excited' | 'reflective' | 'concerned';
  health: number;      // 0-100, drifts toward equilibrium
  routine: 'morning' | 'day' | 'evening' | 'overnight';
  volatility: number;  // 0-1, behavioral variance
  cryo: boolean;       // hibernation mode
}
```

**Plugin System**: Extend agents with lifecycle hooks (`init`, `cleanup`, `onTick`) and callable actions.

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/clarkOS/clark
cd clark/example/convex
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Convex

```bash
npx convex dev
```

### 4. Configure environment

Create `.env.local`:

```bash
# Required
CONVEX_URL=https://your-project.convex.cloud

# LLM (OpenRouter recommended)
OPENROUTER_KEY=your_openrouter_api_key
MODEL_ID=anthropic/claude-3.5-haiku

# Embeddings (Gemini recommended - free tier)
GEMINI_API_KEY=your_gemini_api_key
```

### 5. Run the agent

```bash
npm run dev
```

---

## Usage

### Basic Agent

```typescript
import { Agent, ConvexBackend } from './src';

const agent = new Agent({
  backend: new ConvexBackend({
    url: process.env.CONVEX_URL!,
  }),
});

// Execute a single tick
await agent.tick();

// Get current state
const state = await agent.getState();
console.log(`Mood: ${state.mood}, Health: ${state.health}`);
```

### Memory Operations

```typescript
// Store a memory (with automatic deduplication)
await agent.memory.store({
  content: 'Discovered a new pattern in user behavior',
  type: 'episodic',
  importance: 0.7,
  tags: ['insight', 'users'],
});

// Semantic search
const results = await agent.memory.search({
  query: 'user behavior patterns',
  limit: 5,
});
```

### Plugins

```typescript
const myPlugin: Plugin = {
  name: 'logger',
  version: '1.0.0',

  onTick(context) {
    console.log(`Tick #${context.state.counters.ticks}`);
    console.log(`Mood: ${context.state.mood}`);
  },
};

agent.use(myPlugin);
```

---

## Repository Structure

```
ClarkOS/
└── example/
    └── convex/              # Reference implementation
        ├── convex/          # Convex backend (schema, mutations, queries)
        ├── src/
        │   ├── core/        # Agent runtime, tick system, config
        │   ├── memory/      # Memory store, deduplication
        │   ├── knowledge/   # Knowledge base
        │   ├── plugins/     # Plugin system
        │   ├── llm/         # LLM & embedding clients
        │   ├── services/    # Background services (news, market, social)
        │   ├── templates/   # Prompt templates
        │   └── ui/          # Terminal UI (Ink + React)
        └── tests/           # 179 tests across 7 modules
```

---

## API Endpoints

The Convex backend exposes HTTP endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/state` | GET | Current agent state |
| `/memories` | GET | List memories (filter by type, scope) |
| `/memories` | POST | Store memory (with deduplication) |
| `/memories/search` | GET | Semantic search |
| `/memories/stats` | GET | Memory statistics |
| `/knowledge` | GET | List knowledge items |
| `/knowledge` | POST | Add knowledge |
| `/logs` | GET | Activity logs |

---

## Convex as State Machine

ClarkOS treats Convex as the **single source of truth** for agent state:

1. **Persistent**: All state changes are durable
2. **Transactional**: ACID mutations ensure consistency
3. **Reactive**: Real-time subscriptions for state changes
4. **Scalable**: Serverless infrastructure scales automatically
5. **Queryable**: Vector search for semantic memory retrieval

```
Agent Instance → fetch("/state") → Compute new state → Convex mutation → Database
                                                                          ↑
                                                          Single source of truth
```

---

## Configuration

### LLM Providers

```bash
# OpenRouter (recommended - best routing, many models)
LLM_PROVIDER=openrouter
OPENROUTER_KEY=your_key

# OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key

# Anthropic
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_key

# Custom endpoint
LLM_PROVIDER=custom
LLM_BASE_URL=https://your-endpoint.com/v1/chat/completions
```

### Embedding Providers

```bash
# Gemini (recommended - free tier, 768 dimensions)
EMBEDDING_PROVIDER=gemini
GEMINI_API_KEY=your_key

# OpenAI (1536 dimensions)
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=your_key
```

---

## Testing

The framework includes comprehensive tests:

```bash
cd example/convex
npm test
```

**179 tests** across 7 modules:
- `core/tick` - Tick system (25 tests)
- `core/config` - Configuration (22 tests)
- `memory/deduplication` - Deduplication logic (34 tests)
- `backend/memory` - Backend operations (22 tests)
- `plugins/loader` - Plugin system (26 tests)
- `llm/embeddings` - Embeddings (32 tests)
- `services/news` - Services (21 tests)

---

## Roadmap

**Implemented**:
- Agent runtime with tick-based execution
- 5 memory types with type-specific deduplication
- Plugin system with lifecycle hooks
- Multi-provider LLM integration
- Embedding-based semantic search
- Terminal UI with ASCII visualization
- Comprehensive test suite

**Coming Soon**:
- Memory linking (7 relationship types)
- Memory consolidation into core memories
- Self-reflection and brilliance detection
- Full consciousness synthesis layer
- Multi-agent coordination

---

## The Vision

- **Convex as backbone**: Realtime state + events in one place → less glue code, fewer services, faster deployment

- **Agents as nodes**: Independent, composable, networkable

- **This repo**: Foundation + reference implementation of a ClarkOS node

---

## Live Demo

See CLARK V2 in action: [clark.wiki](https://clark.wiki)

---

## Documentation

- **Docs Site**: [docs.clarkos.dev](https://docs.clarkos.dev)
- **Docs Repo**: [github.com/clarkOS/docs](https://github.com/clarkOS/docs)

Guides:
- [Quickstart](/quickstart)
- [Core Concepts](/concepts/agents)
- [Memory System](/concepts/memory)
- [Tick System](/concepts/tick-system)
- [Plugin Development](/guides/custom-plugins)
- [API Reference](/api-reference/introduction)

---

## Links

- **GitHub**: [github.com/clarkOS/clark](https://github.com/clarkOS/clark)
- **Docs**: [docs.clarkos.dev](https://docs.clarkos.dev)
- **Live Demo**: [clark.wiki](https://clark.wiki)
- **X**: [@clarkwiki](https://x.com/clarkwiki)

---

## License

MIT
