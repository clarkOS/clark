# ClarkOS Documentation Parity Report

> Comparison of documentation claims vs actual code implementation
> Generated: 2024-02-03

---

## Summary

| Category | Matches | Mismatches | Missing Docs |
|----------|---------|------------|--------------|
| Repository URLs | 0 | 3 | 0 |
| Project Structure | 0 | 2 | 0 |
| HTTP Endpoints | 10 | 8 | 2 |
| Environment Variables | 8 | 4 | 5 |
| Features | 12 | 6 | 3 |
| Commands | 5 | 3 | 0 |

---

## Section 1: Docs Say X, Code Does Y

### 1.1 Repository URL Mismatch

| ID | Severity | Status |
|----|----------|--------|
| URL-001 | HIGH | NEEDS FIX |

**Claim (docs):**
```
git clone https://github.com/clarkos/clarkos my-agent
```

**Evidence:**
- File: `clark-docs/quickstart.mdx`, `clark-docs/installation.mdx`, `clark-docs/index.mdx`
- Multiple locations reference `github.com/clarkos/clarkos`

**Actual (code):**
- Repository is at `github.com/clarkOS/clark`
- README.md correctly references `github.com/clarkOS/clark`

**Impact:** Users cloning from docs will get 404 error.

**Fix:** Update all documentation to use `https://github.com/clarkOS/clark`

---

### 1.2 Project Structure Mismatch

| ID | Severity | Status |
|----|----------|--------|
| STRUCT-001 | HIGH | NEEDS FIX |

**Claim (docs/installation.mdx):**
```
my-agent/
├── app/                    # Next.js frontend
│   ├── page.tsx
│   └── layout.tsx
├── convex/
│   ├── schema.ts
│   ├── tick.ts
│   └── http.ts
```

**Evidence:**
- File: `clark-docs/installation.mdx`

**Actual (code):**
```
ClarkOS/
├── README.md
├── example/
│   └── convex/             # NOT Next.js - Terminal UI (Ink)
│       ├── convex/         # Convex backend
│       ├── src/            # TypeScript source
│       │   ├── cli.tsx     # CLI entry point
│       │   └── ui/         # React Ink components
```

**Impact:** Users expecting Next.js app will be confused by terminal UI.

**Fix:** Update docs to reflect actual terminal-based architecture OR clarify that docs describe a different deployment pattern.

---

### 1.3 Health Endpoint Response

| ID | Severity | Status |
|----|----------|--------|
| API-001 | MEDIUM | NEEDS FIX |

**Claim (docs/installation.mdx):**
```bash
curl http://localhost:3001/health
# Expected: {"status":"ok"}
```

**Evidence:**
- File: `clark-docs/installation.mdx`

**Actual (code - convex/http.ts):**
```typescript
return new Response(JSON.stringify({
  ok: true,
  service: 'clark-agent',
  now: Date.now(),
  lastTick: state?.lastTick || null,
}), ...);
```

**Impact:** Integration tests expecting `{"status":"ok"}` will fail.

**Fix:** Update docs to show actual response: `{"ok":true,"service":"clark-agent","now":...,"lastTick":...}`

---

### 1.4 Environment Variable Names

| ID | Severity | Status |
|----|----------|--------|
| ENV-001 | MEDIUM | NEEDS FIX |

**Claim (docs/installation.mdx, quickstart.mdx):**
```
NEXT_PUBLIC_CONVEX_URL=your-convex-deployment-url
```

**Evidence:**
- File: `clark-docs/installation.mdx`, `clark-docs/quickstart.mdx`

**Actual (code - src/core/config.ts, src/cli.tsx):**
```typescript
url: process.env.CONVEX_URL
```

**Impact:** Users setting `NEXT_PUBLIC_CONVEX_URL` won't have it picked up.

**Fix:** Change docs to use `CONVEX_URL` (no NEXT_PUBLIC prefix since this is not Next.js)

---

### 1.5 Consciousness Endpoints

| ID | Severity | Status |
|----|----------|--------|
| API-002 | HIGH | NEEDS DECISION |

**Claim (docs/api-reference/introduction.mdx, consciousness.mdx):**
```
GET /consciousness/thoughts
GET /consciousness/brilliant
POST /consciousness/process
POST /consciousness/reflect
```

**Evidence:**
- File: `clark-docs/api-reference/consciousness.mdx` (entire file)

**Actual (code - convex/http.ts):**
- NO consciousness endpoints exposed
- No `/consciousness` routes in HTTP router
- Templates exist but no processing engine

**Impact:** Users calling consciousness endpoints get 404.

**Fix:** Either:
- A) Remove consciousness API docs (mark as roadmap)
- B) Implement endpoints in http.ts

---

### 1.6 Memory Search Endpoint

| ID | Severity | Status |
|----|----------|--------|
| API-003 | MEDIUM | NEEDS DECISION |

**Claim (docs/api-reference/memories.mdx):**
```
GET /memories/search?q=...
```

**Evidence:**
- File: `clark-docs/api-reference/memories.mdx`

**Actual (code - convex/http.ts):**
- No `/memories/search` endpoint
- Only `/memories` (list), `/memories/core`, `/memories/stats`

**Impact:** Users expecting semantic search via HTTP get 404.

**Fix:** Either:
- A) Remove search endpoint from docs
- B) Add search endpoint to http.ts

---

### 1.7 Memory Store Endpoint Path

| ID | Severity | Status |
|----|----------|--------|
| API-004 | LOW | NEEDS FIX |

**Claim (docs/api-reference/memories.mdx):**
```
POST /memories/store
POST /memories/store-dedup
```

**Evidence:**
- File: `clark-docs/api-reference/memories.mdx`

**Actual (code - convex/http.ts):**
```typescript
if (request.method === 'POST') {
  // POST /memories - stores memory
}
```

**Impact:** Users calling `/memories/store` get 404.

**Fix:** Update docs to show `POST /memories` (not `/memories/store`)

---

### 1.8 Cron Jobs Configuration

| ID | Severity | Status |
|----|----------|--------|
| FEAT-001 | MEDIUM | NEEDS FIX |

**Claim (docs/quickstart.mdx, examples/basic-agent.mdx):**
```typescript
// convex/crons.ts
import { cronJobs } from "convex/server";

const crons = cronJobs();
crons.interval("agent tick", { minutes: 5 }, "tick:run");

export default crons;
```

**Evidence:**
- File: `clark-docs/quickstart.mdx`, `clark-docs/examples/basic-agent.mdx`

**Actual (code):**
- No `convex/crons.ts` file exists
- No cron configuration in repository

**Impact:** Users expecting automatic ticks won't have them configured.

**Fix:** Either:
- A) Add crons.ts to example
- B) Update docs to clarify crons must be added manually

---

### 1.9 Port Number

| ID | Severity | Status |
|----|----------|--------|
| ENV-002 | LOW | NEEDS FIX |

**Claim (docs):**
```
http://localhost:3001/health
```

**Evidence:**
- Multiple files reference port 3001

**Actual (code):**
- Port 3001 is the Convex dev server default
- The CLI app itself has no HTTP server

**Impact:** Minor confusion about what's running where.

**Fix:** Clarify that 3001 is Convex dev server, not the agent app.

---

### 1.10 Memory Linking Status

| ID | Severity | Status |
|----|----------|--------|
| FEAT-002 | MEDIUM | NEEDS FIX |

**Claim (docs/concepts/memory.mdx):**
```
Memories can be linked with 7 relationship types:
- caused_by, related_to, contradicts, elaborates, supersedes, temporal_before, temporal_after
```

**Evidence:**
- File: `clark-docs/concepts/memory.mdx`
- States as implemented feature

**Actual (code):**
- `memory_links` table exists in schema.ts
- NO functions to create, query, or manage links
- NO HTTP endpoints for linking

**Impact:** Users expect linking to work but it's schema-only.

**Fix:** Mark as "Roadmap" in docs, not implemented.

---

### 1.11 Memory Consolidation Status

| ID | Severity | Status |
|----|----------|--------|
| FEAT-003 | MEDIUM | NEEDS FIX |

**Claim (docs/api-reference/memories.mdx):**
```
POST /memories/consolidate
Response: { memoriesProcessed, clustersFound, coreMemoriesCreated, ... }
```

**Evidence:**
- File: `clark-docs/api-reference/memories.mdx`

**Actual (code):**
- `core_memories` table exists
- `listCoreMemories()` query exists (read-only)
- NO consolidation mutation
- NO HTTP endpoint

**Impact:** Users calling consolidate endpoint get 404.

**Fix:** Mark as "Roadmap" in docs.

---

### 1.12 Daily Journals Status

| ID | Severity | Status |
|----|----------|--------|
| FEAT-004 | MEDIUM | NEEDS FIX |

**Claim (docs/roadmap.mdx, guides/your-first-agent.mdx):**
```
Daily journals: Complete (backend/convex/dailyJournal.ts)
```

**Evidence:**
- References journal generation features

**Actual (code - ClarkOS example):**
- `daily_journals` table exists in schema
- NO journal generation functions
- NO HTTP endpoints
- (Note: Full CLARK backend has this, but ClarkOS example does not)

**Impact:** Users expect journal feature but it's not in the example.

**Fix:** Clarify this is in full CLARK, not ClarkOS example.

---

### 1.13 Reflection Endpoint

| ID | Severity | Status |
|----|----------|--------|
| API-005 | MEDIUM | NEEDS DECISION |

**Claim (docs/api-reference/memories.mdx):**
```
POST /memories/reflect
```

**Evidence:**
- File: `clark-docs/api-reference/memories.mdx`

**Actual (code):**
- `reflectAction` exists in `src/actions/reflect.ts`
- NO HTTP endpoint to trigger it
- Must be called programmatically via `agent.executeAction()`

**Impact:** Users calling HTTP endpoint get 404.

**Fix:** Either:
- A) Add HTTP endpoint
- B) Remove from API docs, document as action-only

---

### 1.14 WebSocket Subscriptions

| ID | Severity | Status |
|----|----------|--------|
| FEAT-005 | LOW | NEEDS FIX |

**Claim (docs/api-reference/state.mdx):**
```typescript
import { useQuery } from "convex/react";
const state = useQuery(api.state.get);
```

**Evidence:**
- Multiple files show React hooks with Convex

**Actual (code):**
- ClarkOS example uses terminal UI (Ink), not web React
- No browser-based frontend
- Would require separate frontend setup

**Impact:** Code examples won't work without additional setup.

**Fix:** Clarify that WebSocket examples require separate frontend project.

---

## Section 2: Code Does X, Docs Don't Mention

### 2.1 Terminal UI

| ID | Severity | Status |
|----|----------|--------|
| UNDOC-001 | HIGH | NEEDS FIX |

**Code (src/cli.tsx, src/ui/):**
- Full terminal UI built with React Ink
- ASCII art animations
- Keyboard controls (q, r, m, v, p)
- Radio panel
- Multiple view modes (terminal, hologram)

**Docs:** No mention of terminal UI capabilities.

**Fix:** Add documentation for terminal UI features and controls.

---

### 2.2 Demo Mode

| ID | Severity | Status |
|----|----------|--------|
| UNDOC-002 | MEDIUM | NEEDS FIX |

**Code (src/cli.tsx):**
```typescript
if (options.demo) {
  backend = new MemoryBackend();
  // Pre-populated with sample data
}
```

**Docs:** Demo mode not documented.

**Fix:** Add `npm run demo` to quickstart as an option.

---

### 2.3 In-Memory Backend

| ID | Severity | Status |
|----|----------|--------|
| UNDOC-003 | MEDIUM | NEEDS FIX |

**Code (src/backend/memory.ts):**
- Full in-memory backend for testing
- `MemoryBackend` class with CRUD operations
- `reset()` method for test cleanup

**Docs:** Only ConvexBackend documented.

**Fix:** Document MemoryBackend for testing scenarios.

---

### 2.4 Service Layer

| ID | Severity | Status |
|----|----------|--------|
| UNDOC-004 | LOW | NEEDS FIX |

**Code (src/services/):**
- `NewsService` - RSS/API news aggregation
- `MarketService` - Crypto price data
- `ChanService` - 4chan SFW threads
- Service registry and lifecycle management

**Docs:** Services mentioned but implementation details sparse.

**Fix:** Expand plugins/official.mdx with actual implementation details.

---

### 2.5 Character System

| ID | Severity | Status |
|----|----------|--------|
| UNDOC-005 | MEDIUM | NEEDS FIX |

**Code (src/character/):**
- Character definition schema
- Trait system with situational triggers
- Routine-based personality modifiers
- Health-based behavior changes
- Character file loader (JSON/YAML)

**Docs:** Character system not documented.

**Fix:** Add character system documentation.

---

## Section 3: Verification Status

### Verified Matches

| Feature | Doc Location | Code Location | Status |
|---------|--------------|---------------|--------|
| 5 memory types | concepts/memory.mdx | src/memory/types.ts | VERIFIED |
| Dedup thresholds | concepts/memory.mdx | src/memory/deduplication.ts | VERIFIED |
| Health drift | concepts/tick-system.mdx | src/core/tick.ts | VERIFIED |
| Routine calculation | concepts/tick-system.mdx | src/core/tick.ts | VERIFIED |
| Plugin interface | guides/custom-plugins.mdx | src/plugins/types.ts | VERIFIED |
| Agent state fields | concepts/agents.mdx | src/core/types.ts | VERIFIED |
| LLM providers | README | src/llm/client.ts | VERIFIED |
| Embedding providers | concepts/memory.mdx | src/llm/embeddings.ts | VERIFIED |
| 179 tests | guides/testing.mdx | tests/ | VERIFIED |

---

## Recommended Actions

### Priority 1 (Critical)

1. **Fix repository URL** in all docs (`clarkos/clarkos` → `clarkOS/clark`)
2. **Update project structure** in installation.mdx
3. **Mark consciousness endpoints as roadmap** or implement

### Priority 2 (Important)

4. **Fix environment variable names** (`NEXT_PUBLIC_CONVEX_URL` → `CONVEX_URL`)
5. **Update health endpoint response** format in docs
6. **Mark memory linking/consolidation as roadmap**
7. **Add terminal UI documentation**

### Priority 3 (Enhancement)

8. **Document demo mode** (`npm run demo`)
9. **Document MemoryBackend** for testing
10. **Document character system**
11. **Clarify WebSocket examples** require separate frontend

---

## Decision Log

| ID | Decision Needed | Options | Recommendation |
|----|-----------------|---------|----------------|
| API-002 | Consciousness endpoints | A) Remove docs, B) Implement | A - Mark as roadmap |
| API-003 | Memory search endpoint | A) Remove docs, B) Implement | B - Add endpoint |
| FEAT-001 | Crons configuration | A) Add file, B) Update docs | A - Add crons.ts |
| API-005 | Reflection endpoint | A) Add endpoint, B) Doc as action | A - Add endpoint |
