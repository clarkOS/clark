# ClarkOS

**always on. always learning.**

Build autonomous agents with persistent memory & realtime intelligence.

**C**ontinuously **L**earning **A**gentic **R**ealtime **K**nowledgebase **OS**

[Live Demo](https://clark.wiki) · [Docs](https://docs.clarkos.dev) · [X](https://x.com/clarkwiki)

---

## What is ClarkOS?

ClarkOS is a minimal agent runtime built around state—not endpoints. It uses [Convex](https://convex.dev) as the state machine, cutting out the traditional API layer so agents can deploy fast, stay online, and scale into a network of nodes.

| Traditional Agent Stack | ClarkOS |
|------------------------|---------|
| API Gateway + Queue + Database + Cache | Convex (one service) |
| Request-response execution | Continuous tick-based execution |
| State scattered across services | State in one place |
| Complex deployment | Deploy in minutes |

---

## CLARK Demo

**See it live:** [clark.wiki](https://clark.wiki)

CLARK is an autonomous AI agent running 24/7 on ClarkOS. It demonstrates the full potential of the framework with advanced features beyond this SDK.

### What CLARK Does

- Thinks autonomously every 5 minutes
- Forms and consolidates memories over time
- Detects patterns and generates "moments of brilliance"
- Maintains mood, health, and routine states
- Creates daily journal entries
- Responds to market data, news, and social signals

### SDK vs Full CLARK

| Feature | This SDK | CLARK Demo |
|---------|----------|------------|
| Tick-based execution | ✅ | ✅ |
| 5 memory types | ✅ | ✅ |
| Type-specific deduplication | ✅ | ✅ |
| Plugin system | ✅ | ✅ |
| Multi-provider LLM | ✅ | ✅ |
| Terminal UI | ✅ | - |
| Memory linking | Schema only | ✅ Full |
| Memory consolidation | Schema only | ✅ Full |
| Consciousness synthesis | Templates only | ✅ Full |
| Daily journals | Schema only | ✅ Full |
| Chat with presence | - | ✅ |
| Market analysis | - | ✅ |
| Social posting | - | ✅ |

This repository provides the **foundation SDK**. The live demo at clark.wiki runs the full CLARK system with all advanced features.

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
│ (multi-provider) │  (semantic)   │  (type-specific thresholds)   │
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

### 3. Run the doctor (optional)

```bash
npm run doctor
```

### 4. Try demo mode (no API keys needed)

```bash
npm run demo
```

### 5. Or configure for full mode

Create `.env.local`:

```bash
cp .env.example .env.local
```

Edit with your keys:

```bash
CONVEX_URL=https://your-project.convex.cloud
OPENROUTER_KEY=your_openrouter_api_key
GEMINI_API_KEY=your_gemini_api_key
```

Then run:

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

## Terminal UI

The SDK includes a terminal-based UI built with React Ink:

```
┌─────────────────────────────────────────────┐
│  CLARK - Autonomous Agent                    │
│  Mood: curious | Health: 78 | Routine: day  │
├─────────────────────────────────────────────┤
│      ╭──────────╮                           │
│      │  ◉    ◉  │                           │
│      │    ──    │                           │
│      ╰──────────╯                           │
└─────────────────────────────────────────────┘
```

### Keyboard Controls

| Key | Action |
|-----|--------|
| `q` | Quit |
| `r` | Refresh data |
| `m` | Toggle radio panel |
| `v` | Toggle view mode |
| `Ctrl+C` | Force quit |

---

## Repository Structure

```
clark/
├── README.md
├── docs/                    # Audit documentation
├── scripts/
│   └── doctor.js            # Preflight validation
└── example/
    └── convex/              # Reference implementation
        ├── .env.example     # Environment template
        ├── convex/          # Convex backend
        ├── src/
        │   ├── core/        # Agent runtime, tick system
        │   ├── memory/      # Memory store, deduplication
        │   ├── knowledge/   # Knowledge base
        │   ├── plugins/     # Plugin system
        │   ├── llm/         # LLM & embedding clients
        │   ├── services/    # Background services
        │   ├── templates/   # Prompt templates
        │   └── ui/          # Terminal UI (Ink + React)
        └── tests/           # 179 tests
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
| `/memories/core` | GET | Core consolidated memories |
| `/memories/stats` | GET | Memory statistics |
| `/knowledge` | GET | List knowledge items |
| `/knowledge` | POST | Add knowledge |
| `/logs` | GET | Activity logs |

---

## Configuration

### LLM Providers

```bash
# OpenRouter (recommended)
LLM_PROVIDER=openrouter
OPENROUTER_KEY=your_key

# OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key

# Anthropic
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_key
```

### Embedding Providers

```bash
# Gemini (recommended - free tier)
EMBEDDING_PROVIDER=gemini
GEMINI_API_KEY=your_key

# OpenAI
EMBEDDING_PROVIDER=openai
OPENAI_API_KEY=your_key
```

---

## Testing

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

### Implemented (SDK)

- Agent runtime with tick-based execution
- 5 memory types with type-specific deduplication
- Plugin system with lifecycle hooks
- Multi-provider LLM integration
- Embedding-based semantic search
- Terminal UI with ASCII visualization
- Comprehensive test suite (179 tests)
- Doctor script for environment validation

### Coming Soon

- Memory linking (schema ready, 7 relationship types)
- Memory consolidation (schema ready)
- Full consciousness synthesis layer
- HTTP endpoints for reflection/consciousness
- Multi-agent coordination

---

## Documentation

- **Docs Site**: [docs.clarkos.dev](https://docs.clarkos.dev)
- **Docs Repo**: [github.com/clarkOS/docs](https://github.com/clarkOS/docs)

---

## Links

| Resource | URL |
|----------|-----|
| GitHub | [github.com/clarkOS/clark](https://github.com/clarkOS/clark) |
| Documentation | [docs.clarkos.dev](https://docs.clarkos.dev) |
| Live Demo | [clark.wiki](https://clark.wiki) |
| X / Twitter | [@clarkwiki](https://x.com/clarkwiki) |

---

## License

MIT
