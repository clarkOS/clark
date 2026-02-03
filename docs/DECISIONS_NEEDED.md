# Decisions Needed

> Ambiguous items identified during the ClarkOS documentation audit
> These require human decision before proceeding

---

## Decision 1: Consciousness Endpoints

### What is Ambiguous

Documentation describes full consciousness API:
- `GET /consciousness/thoughts`
- `GET /consciousness/brilliant`
- `POST /consciousness/process`
- `POST /consciousness/reflect`

Code has:
- Templates for consciousness prompts
- `detectBrillianceAction` as a plugin action
- No HTTP endpoints

### Options

**Option A: Remove from Documentation**
- Pros: Docs match code immediately
- Cons: Reduces perceived feature set

**Option B: Implement Endpoints in Code**
- Pros: Full feature parity
- Cons: Requires development work

**Option C: Mark as "Roadmap" in Documentation**
- Pros: Sets expectations correctly, keeps vision visible
- Cons: Users may still try to call endpoints

### Recommendation

**Option C** - Mark as roadmap with clear "Coming Soon" badge

### Confirmation Needed

- [ ] Confirm whether consciousness endpoints should be implemented
- [ ] If yes, what is the timeline?
- [ ] If roadmap, what features to prioritize?

---

## Decision 2: Documentation Architecture

### What is Ambiguous

Documentation describes a Next.js app structure:
```
app/
├── page.tsx
└── layout.tsx
```

Actual code is a terminal UI (Ink/React):
```
src/
├── cli.tsx
└── ui/
    └── components/
```

### Options

**Option A: Update Docs to Match Code**
- Document terminal UI as the primary interface
- Pros: Accurate to implementation
- Cons: May disappoint users expecting web UI

**Option B: Add Next.js Example**
- Create a separate `examples/nextjs/` directory
- Pros: Both paths documented
- Cons: Maintenance burden

**Option C: Clarify Both Paths**
- Document terminal UI as included
- Document Next.js as "bring your own frontend"
- Pros: Flexible, honest
- Cons: More complex documentation

### Recommendation

**Option C** - Clarify that terminal UI is included, web frontend is DIY

### Confirmation Needed

- [ ] Is a Next.js example planned?
- [ ] Should terminal UI be the primary documented interface?

---

## Decision 3: Memory Linking Implementation

### What is Ambiguous

- Schema defines `memory_links` table with 7 relationship types
- Documentation describes linking as a feature
- No functions exist to create, query, or manage links
- Full CLARK backend has this implemented

### Options

**Option A: Port from CLARK Backend**
- Copy linking functions from CLARK to ClarkOS example
- Pros: Full feature parity
- Cons: Code divergence, maintenance

**Option B: Mark as Roadmap**
- Update docs to show as "coming soon"
- Pros: Sets expectations
- Cons: Schema exists but unused

**Option C: Remove Schema**
- Delete `memory_links` table from schema
- Pros: Clean, no orphan tables
- Cons: Loses architectural intent

### Recommendation

**Option B** - Mark as roadmap, keep schema for future implementation

### Confirmation Needed

- [ ] Will linking be ported from CLARK?
- [ ] Timeline for implementation?
- [ ] Should schema be kept or removed?

---

## Decision 4: Memory Consolidation Implementation

### What is Ambiguous

- Schema defines `core_memories` table
- `listCoreMemories()` query exists (read-only)
- No consolidation logic exists
- Full CLARK backend has this implemented

### Options

**Option A: Port from CLARK Backend**
- Copy consolidation functions
- Pros: Full feature parity
- Cons: Complexity

**Option B: Mark as Roadmap**
- Update docs, keep schema
- Pros: Sets expectations
- Cons: Schema unused

**Option C: Simplify Schema**
- Remove consolidation-related tables
- Pros: Cleaner example
- Cons: Loses future capability

### Recommendation

**Option B** - Mark as roadmap

### Confirmation Needed

- [ ] Is consolidation core to the ClarkOS value proposition?
- [ ] Timeline for implementation?

---

## Decision 5: ClarkOS vs CLARK Relationship

### What is Ambiguous

The relationship between repositories is unclear:
- **ClarkOS** (`github.com/clarkOS/clark`): Minimal example
- **CLARK** (private): Full production system
- **clark-docs** (`github.com/clarkOS/docs`): Documents both?

Documentation describes features from CLARK that don't exist in ClarkOS.

### Options

**Option A: ClarkOS = SDK, CLARK = Reference**
- ClarkOS is the minimal SDK
- CLARK is a full implementation example
- Docs describe SDK only

**Option B: ClarkOS = Everything**
- Port all CLARK features to ClarkOS
- Single source of truth
- Docs describe ClarkOS

**Option C: Separate Documentation**
- ClarkOS SDK docs
- CLARK product docs
- Clear boundaries

### Recommendation

**Option A** - ClarkOS as SDK, but need to clarify this in docs

### Confirmation Needed

- [ ] What is the official relationship?
- [ ] Should CLARK ever be public?
- [ ] What features are "SDK" vs "product"?

---

## Decision 6: Demo Convex URL

### What is Ambiguous

The `package.json` dev script uses a hardcoded Convex URL:
```json
"dev": "tsx src/cli.tsx --url https://combative-okapi-755.convex.site"
```

This is a specific deployment that may:
- Not belong to the user
- Have rate limits
- Be deprecated

### Options

**Option A: Remove Hardcoded URL**
- Require users to set `CONVEX_URL`
- Pros: Users own their data
- Cons: Extra setup step

**Option B: Keep Demo URL**
- Shared demo deployment
- Pros: Zero config for trying
- Cons: Data not private, may fail

**Option C: Add Setup Script**
- Script that creates user's own Convex project
- Pros: Best of both worlds
- Cons: More complexity

### Recommendation

**Option A** - Remove hardcoded URL, require `CONVEX_URL` env var

### Confirmation Needed

- [ ] Is combative-okapi-755 a public demo?
- [ ] Who owns this deployment?
- [ ] Should it be removed or documented?

---

## Decision 7: Cron Jobs

### What is Ambiguous

Documentation shows cron setup:
```typescript
// convex/crons.ts
crons.interval("agent tick", { minutes: 5 }, "tick:run");
```

No `convex/crons.ts` exists in the repository.

### Options

**Option A: Add Crons to Example**
- Create `convex/crons.ts` with tick schedule
- Pros: Feature complete
- Cons: May not suit all use cases

**Option B: Document as Optional**
- Show how to add crons
- But don't include by default
- Pros: Flexible
- Cons: Extra step for users

**Option C: Remove from Docs**
- Focus on manual/programmatic ticks
- Pros: Simpler
- Cons: Missing automation

### Recommendation

**Option B** - Document cron setup as optional, provide example

### Confirmation Needed

- [ ] Should example include automatic ticking?
- [ ] What's the recommended tick interval?

---

## Decision 8: API Authentication

### What is Ambiguous

Documentation describes auth tokens:
- `TICK_TOKEN` for tick endpoint
- `WRITE_TOKEN` for write endpoints

Code has:
- Token parameters in ConvexBackend
- HTTP endpoints have commented auth checks
- Auth not enforced by default

### Options

**Option A: Enforce Auth by Default**
- Uncomment auth checks in http.ts
- Require tokens in documentation
- Pros: Secure by default
- Cons: Harder setup

**Option B: Auth Optional**
- Keep commented, document as optional
- Pros: Easy getting started
- Cons: Insecure by default

**Option C: Tiered Auth**
- No auth for reads
- Auth required for writes/ticks
- Pros: Balanced
- Cons: More complex

### Recommendation

**Option C** - Tiered auth with clear documentation

### Confirmation Needed

- [ ] What should be the default security posture?
- [ ] Are read endpoints truly public?

---

## Summary

| # | Decision | Recommended | Blocking? |
|---|----------|-------------|-----------|
| 1 | Consciousness Endpoints | Roadmap | No |
| 2 | Documentation Architecture | Clarify both | No |
| 3 | Memory Linking | Roadmap | No |
| 4 | Memory Consolidation | Roadmap | No |
| 5 | ClarkOS vs CLARK | Define relationship | **Yes** |
| 6 | Demo Convex URL | Remove hardcode | No |
| 7 | Cron Jobs | Document as optional | No |
| 8 | API Authentication | Tiered auth | No |

**Blocking Decision:** #5 (ClarkOS vs CLARK relationship) should be decided before documentation can be fully corrected, as it affects what features are documented where.

---

## How to Proceed

1. Review each decision above
2. Mark your choice or provide alternative
3. For blocking decisions, provide answer before docs update
4. Non-blocking decisions can use recommendations as defaults

**Contact:** File an issue at https://github.com/clarkOS/clark/issues with decisions or questions.
