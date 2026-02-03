# ClarkOS Audit Inventory

> Complete inventory of the ClarkOS repository
> Generated: 2024-02-03
> Audit scope: `github.com/clarkOS/clark`

---

## Repository Structure

```
ClarkOS/
├── README.md                    # Main repository documentation
├── .gitignore                   # Git ignore rules
├── docs/                        # Documentation (this audit)
├── scripts/                     # Utility scripts
└── example/
    └── convex/                  # Reference implementation
        ├── convex/              # Convex backend functions
        ├── src/                 # TypeScript source code
        ├── tests/               # Jest test suite (179 tests)
        ├── package.json         # NPM configuration
        ├── tsconfig.json        # TypeScript config
        ├── jest.config.js       # Jest config
        ├── README.md            # Example documentation
        ├── TESTING.md           # Testing guide
        └── LICENSE              # MIT license
```

---

## Entry Points

| Entry Point | Type | Command | Purpose |
|-------------|------|---------|---------|
| CLI (dev) | Terminal UI | `npm run dev` | Start agent with Convex backend |
| CLI (demo) | Terminal UI | `npm run demo` | In-memory demo mode |
| CLI (custom) | Terminal UI | `npm run cli -- [args]` | Custom CLI invocation |
| Build | Compilation | `npm run build` | Compile TypeScript |
| Start | Production | `npm run start` | Run compiled CLI |
| Tests | Jest | `npm test` | Run test suite |

### CLI Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `--url <url>` | Convex deployment URL | env `CONVEX_URL` |
| `--demo` | Use in-memory backend | false |
| `--refresh <ms>` | UI refresh interval | 3000 |
| `--help` | Show help | - |

---

## NPM Scripts

**Location:** `example/convex/package.json`

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `tsx src/cli.tsx --url https://combative-okapi-755.convex.site` | Development mode |
| `demo` | `tsx src/cli.tsx --demo` | Demo with in-memory backend |
| `cli` | `tsx src/cli.tsx` | CLI with custom arguments |
| `build` | `tsc` | Compile TypeScript |
| `start` | `node dist/cli.js` | Run compiled output |
| `typecheck` | `tsc --noEmit` | Type checking only |
| `clean` | `rm -rf dist` | Remove build artifacts |
| `test` | `node --experimental-vm-modules node_modules/jest/bin/jest.js` | Run tests |
| `test:watch` | Same + `--watch` | Watch mode |
| `test:coverage` | Same + `--coverage` | Coverage report |

---

## Environment Variables

### Required

| Variable | Module | Purpose | Example |
|----------|--------|---------|---------|
| `CONVEX_URL` | Backend | Convex deployment URL | `https://project.convex.cloud` |
| `OPENROUTER_KEY` | LLM | OpenRouter API key | `sk-or-v1-xxx` |
| `GEMINI_API_KEY` | Embeddings | Gemini API key (free tier) | `AIzaSy-xxx` |

### Optional - Backend

| Variable | Module | Default | Purpose |
|----------|--------|---------|---------|
| `TICK_TOKEN` | Backend | none | Auth token for tick operations |
| `WRITE_TOKEN` | Backend | none | Auth token for write operations |
| `BACKEND_TYPE` | Config | `convex` | Backend type (convex/memory) |

### Optional - Agent

| Variable | Module | Default | Purpose |
|----------|--------|---------|---------|
| `AGENT_NAME` | Config | `Agent` | Agent identifier |
| `TICK_INTERVAL` | Config | `60000` | Milliseconds between ticks |
| `AUTO_TICK` | Config | `false` | Enable automatic ticking |
| `MEMORY_THRESHOLD` | Config | `100` | Consolidation threshold |
| `VERBOSE` | Config | `false` | Enable verbose logging |

### Optional - LLM

| Variable | Module | Default | Purpose |
|----------|--------|---------|---------|
| `LLM_PROVIDER` | LLM | `openrouter` | Provider (openrouter/openai/anthropic/custom) |
| `MODEL_ID` | LLM | `anthropic/claude-3.5-haiku` | Model identifier |
| `LLM_MODEL` | LLM | (alias for MODEL_ID) | Model identifier |
| `LLM_BASE_URL` | LLM | none | Custom endpoint URL |
| `LLM_MAX_TOKENS` | LLM | `1024` | Max tokens to generate |
| `LLM_TEMPERATURE` | LLM | `0.7` | Model temperature |
| `OPENAI_API_KEY` | LLM | none | OpenAI API key |
| `ANTHROPIC_API_KEY` | LLM | none | Anthropic API key |

### Optional - Embeddings

| Variable | Module | Default | Purpose |
|----------|--------|---------|---------|
| `EMBEDDING_PROVIDER` | Embeddings | `gemini` | Provider (gemini/openai/custom) |
| `EMBEDDING_MODEL` | Embeddings | provider default | Model identifier |
| `EMBEDDING_DIMENSIONS` | Embeddings | `768` (Gemini) | Vector dimensions |
| `EMBEDDING_BASE_URL` | Embeddings | none | Custom endpoint URL |
| `EMBEDDING_API_KEY` | Embeddings | none | Custom API key |

### Where Variables Are Read

| Variable | File | Line |
|----------|------|------|
| `CONVEX_URL` | `src/cli.tsx` | CLI argument default |
| `CONVEX_URL` | `src/core/config.ts` | `loadConfigFromEnv()` |
| `OPENROUTER_KEY` | `src/llm/client.ts` | `configFromEnv()` |
| `GEMINI_API_KEY` | `src/llm/embeddings.ts` | `embeddingConfigFromEnv()` |
| `TICK_TOKEN` | `src/backend/convex.ts` | Constructor |
| `WRITE_TOKEN` | `src/backend/convex.ts` | Constructor |
| `LLM_PROVIDER` | `src/llm/client.ts` | `configFromEnv()` |
| `EMBEDDING_PROVIDER` | `src/llm/embeddings.ts` | `embeddingConfigFromEnv()` |

---

## HTTP Endpoints

**Location:** `example/convex/convex/http.ts`

### Exposed Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/health` | GET | None | Health check |
| `/state` | GET | None | Current agent state |
| `/memories` | GET | None | List memories (filters: limit, type, scope) |
| `/memories` | POST | None | Store new memory |
| `/memories/core` | GET | None | List core memories |
| `/memories/stats` | GET | None | Memory statistics |
| `/knowledge` | GET | None | List knowledge items |
| `/knowledge` | POST | None | Add knowledge item |
| `/logs` | GET | None | Activity logs |
| `/:path*` | OPTIONS | None | CORS preflight |

### NOT Exposed (Schema Only)

| Endpoint | Table Exists | Functions | HTTP |
|----------|--------------|-----------|------|
| `/consciousness/*` | No | No | No |
| `/memories/search` | Yes | No | No |
| `/memories/links` | Yes (memory_links) | No | No |
| `/journals/*` | Yes (daily_journals) | No | No |

---

## Database Schema

**Location:** `example/convex/convex/schema.ts`

### Tables

| Table | Purpose | Indexes |
|-------|---------|---------|
| `state` | Agent state (singleton) | - |
| `memories` | Memory storage | by_ts, by_type, by_scope, by_consolidated, by_importance, by_embedding (vector) |
| `core_memories` | Consolidated memories | by_ts, by_theme, by_importance |
| `memory_links` | Memory relationships | by_source, by_target, by_type |
| `emotional_associations` | Entity sentiment | by_subject, by_sentiment |
| `knowledge` | Knowledge base | by_ts, by_source, by_type |
| `logs` | Activity logs | by_ts |
| `memory_state` | Memory system metrics | - |
| `daily_journals` | Daily summaries | by_date |

### State Table Fields

```typescript
{
  mood: "neutral" | "expressive" | "curious" | "excited" | "reflective" | "concerned",
  health: number,           // 0-100
  routine: "morning" | "day" | "evening" | "overnight",
  volatility: number,       // 0-1
  counters: { ticks: number, feeds: number },
  lastTick: string | null,  // ISO timestamp
  cryo: boolean             // Hibernation mode
}
```

### Memory Types

| Type | Dedup Threshold | Purpose |
|------|-----------------|---------|
| `episodic` | 0.92 | Events and experiences |
| `semantic` | 0.95 | Facts and concepts |
| `emotional` | 0.88 | Feelings about topics |
| `procedural` | 0.97 | Learned patterns |
| `reflection` | 0.90 | Self-insights |

---

## Source Code Modules

**Location:** `example/convex/src/`

| Module | Files | Purpose |
|--------|-------|---------|
| `core/` | 4 | Agent runtime, tick system, config, types |
| `backend/` | 4 | Storage abstraction (Convex, in-memory) |
| `memory/` | 4 | Memory store, deduplication, types |
| `knowledge/` | 3 | Knowledge store, types |
| `llm/` | 3 | LLM client, embeddings |
| `plugins/` | 3 | Plugin system, loader |
| `services/` | 5 | Background services (news, market, chan) |
| `actions/` | 6 | Built-in actions (reflect, remark, memory) |
| `templates/` | 5 | Prompt templates engine |
| `character/` | 3 | Character definition system |
| `ui/` | 10 | Terminal UI (React + Ink) |

### Core Classes

| Class | File | Purpose |
|-------|------|---------|
| `Agent` | `core/agent.ts` | Main runtime |
| `ConvexBackend` | `backend/convex.ts` | Convex HTTP client |
| `MemoryBackend` | `backend/memory.ts` | In-memory backend |
| `LLMClient` | `llm/client.ts` | LLM provider client |
| `EmbeddingClient` | `llm/embeddings.ts` | Embedding provider client |
| `TemplateEngine` | `templates/engine.ts` | Prompt rendering |

---

## Test Suite

**Location:** `example/convex/tests/`

| Module | File | Tests | Coverage |
|--------|------|-------|----------|
| core/tick | `tick.test.ts` | 25 | Routine, health drift, execution |
| core/config | `config.test.ts` | 22 | Config validation, env loading |
| memory/deduplication | `deduplication.test.ts` | 34 | 3-tier dedup, thresholds |
| backend/memory | `memory.test.ts` | 22 | In-memory backend CRUD |
| plugins/loader | `loader.test.ts` | 26 | Validation, dependency sorting |
| llm/embeddings | `embeddings.test.ts` | 32 | Cosine similarity, providers |
| services/news | `news.test.ts` | 21 | Service lifecycle, caching |
| **Total** | - | **179** | 70% threshold |

---

## Convex Functions

### Queries

| Function | File | Purpose |
|----------|------|---------|
| `getState` | `state.ts` | Get agent state |
| `listMemories` | `memories.ts` | Query memories |
| `getMemory` | `memories.ts` | Get by ID |
| `listCoreMemories` | `memories.ts` | Get core memories |
| `getStats` | `memories.ts` | Memory statistics |
| `listKnowledge` | `knowledge.ts` | Query knowledge |
| `getKnowledge` | `knowledge.ts` | Get by ID |
| `searchKnowledge` | `knowledge.ts` | Text search |
| `listLogs` | `logs.ts` | Query logs |

### Mutations

| Function | File | Purpose |
|----------|------|---------|
| `updateState` | `state.ts` | Update state |
| `initState` | `state.ts` | Initialize state |
| `storeMemory` | `memories.ts` | Store memory |
| `accessMemory` | `memories.ts` | Boost importance |
| `addKnowledge` | `knowledge.ts` | Add knowledge |
| `addLog` | `logs.ts` | Add log entry |

---

## Built-in Actions

| Action | File | Purpose |
|--------|------|---------|
| `remarkAction` | `actions/remark.ts` | Generate commentary |
| `storeMemoryAction` | `actions/memory.ts` | Store memory |
| `storeEmotionalMemoryAction` | `actions/memory.ts` | Store emotional memory |
| `reflectAction` | `actions/reflect.ts` | Self-reflection |
| `detectBrillianceAction` | `actions/reflect.ts` | Detect insights |

---

## Built-in Templates

| Template | File | Purpose |
|----------|------|---------|
| `tick` | `templates/builtins/tick.ts` | Tick execution prompt |
| `reflection` | `templates/builtins/reflection.ts` | Self-reflection prompt |
| `deep_reflection` | `templates/builtins/reflection.ts` | Deep reflection prompt |
| `consciousness` | `templates/builtins/consciousness.ts` | Thought synthesis |
| `brilliance` | `templates/builtins/consciousness.ts` | Brilliance detection |
| `thought_filter` | `templates/builtins/consciousness.ts` | Input filtering |

---

## Dependencies

**Location:** `example/convex/package.json`

### Runtime

| Package | Version | Purpose |
|---------|---------|---------|
| `ink` | ^4.4.1 | Terminal UI framework |
| `react` | ^18.2.0 | UI components |
| `convex` | ^1.17.0 | Backend client |
| `zod` | ^3.22.4 | Schema validation |

### Development

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ^5.3.0 | TypeScript compiler |
| `tsx` | ^4.7.0 | TypeScript execution |
| `jest` | ^29.7.0 | Test runner |
| `ts-jest` | ^29.1.1 | Jest TypeScript support |
| `@types/node` | ^20.10.0 | Node.js types |
| `@types/react` | ^18.2.0 | React types |
| `@types/jest` | ^29.5.11 | Jest types |

---

## Scheduled Tasks

**No cron jobs configured in the repository.**

The tick system supports:
- Manual trigger via `agent.tick()`
- Automatic interval via `agent.start()` (uses `setInterval`)
- Configurable via `TICK_INTERVAL` environment variable

---

## Live Demo

- **URL:** https://clark.wiki
- **Description:** CLARK V2 demonstration
- **Backend:** Full CLARK backend (not ClarkOS example)

---

## Related Repositories

| Repository | Purpose |
|------------|---------|
| `github.com/clarkOS/clark` | This repository (ClarkOS example) |
| `github.com/clarkOS/docs` | Documentation site |
| `C:\Users\User\Documents\Github\CLARK` | Full CLARK backend (not public) |

---

## Audit Metadata

- **Audited by:** ClarkOS DX Audit
- **Date:** 2024-02-03
- **Files inventoried:** 68
- **Tests validated:** 179
- **Endpoints documented:** 10 exposed, 4+ schema-only
- **Environment variables:** 20+
