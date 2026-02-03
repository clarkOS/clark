# Getting Started with ClarkOS

> The canonical setup guide - from zero to running agent
> Time: ~10 minutes

---

## Prerequisites

### Required

| Requirement | Minimum | Check Command |
|-------------|---------|---------------|
| Node.js | 18.0.0 | `node --version` |
| npm | 9.0.0 | `npm --version` |
| Git | 2.0.0 | `git --version` |

### API Keys (Get These First)

| Service | Purpose | Get It |
|---------|---------|--------|
| OpenRouter | LLM inference | https://openrouter.ai/keys |
| Gemini | Embeddings (free) | https://aistudio.google.com/apikey |

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/clarkOS/clark
cd clark/example/convex
```

**Verify:**
```bash
ls -la
# Should see: package.json, src/, convex/, tests/
```

---

## Step 2: Install Dependencies

```bash
npm install
```

**Verify:**
```bash
ls node_modules | head -5
# Should see packages listed
```

**If npm install fails:**
```bash
# Clear cache and retry
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

## Step 3: Configure Environment

Create `.env.local` in the `example/convex` directory:

```bash
cat > .env.local << 'EOF'
# Required - Convex deployment URL
CONVEX_URL=https://combative-okapi-755.convex.cloud

# Required - LLM provider
OPENROUTER_KEY=your_openrouter_key_here

# Required - Embeddings (free tier)
GEMINI_API_KEY=your_gemini_key_here

# Optional - Auth tokens (for production)
# TICK_TOKEN=your_secure_token
# WRITE_TOKEN=your_secure_token
EOF
```

**Replace the placeholder values with your actual keys.**

**Verify:**
```bash
cat .env.local | grep -v "^#" | grep "="
# Should show 3 lines with your keys
```

---

## Step 4: Run the Agent

### Option A: Demo Mode (No API Keys Required)

```bash
npm run demo
```

This runs with an in-memory backend and sample data. No Convex or API keys needed.

### Option B: Development Mode (Requires Keys)

```bash
npm run dev
```

This connects to the Convex backend and uses real LLM/embedding APIs.

---

## Step 5: Verify Success

### Terminal UI Should Show

```
┌─────────────────────────────────────────────┐
│  CLARK - Autonomous Agent                    │
│  Mood: neutral | Health: 75 | Routine: day  │
├─────────────────────────────────────────────┤
│                                              │
│      ╭──────────╮                           │
│      │  ◉    ◉  │                           │
│      │    ──    │                           │
│      ╰──────────╯                           │
│                                              │
└─────────────────────────────────────────────┘
```

### Keyboard Controls

| Key | Action |
|-----|--------|
| `q` | Quit |
| `r` | Refresh data |
| `m` | Toggle radio panel |
| `v` | Toggle view mode |
| `p` | Play/pause audio |
| `Ctrl+C` | Force quit |

---

## Step 6: Test the API (Optional)

If running with Convex backend, test the HTTP endpoints:

```bash
# Health check
curl http://localhost:3001/health

# Expected response:
# {"ok":true,"service":"clark-agent","now":1706400000000,"lastTick":null}
```

```bash
# Get agent state
curl http://localhost:3001/state

# Expected response:
# {"mood":"neutral","health":75,"routine":"day","volatility":0.5,...}
```

```bash
# List memories
curl "http://localhost:3001/memories?limit=5"
```

---

## Next Steps

### Run Tests

```bash
npm test
```

All 179 tests should pass.

### Trigger a Manual Tick

```typescript
// In your code
import { Agent, ConvexBackend } from './src';

const agent = new Agent({
  backend: new ConvexBackend({ url: process.env.CONVEX_URL }),
});

await agent.tick();
```

### Add a Plugin

```typescript
import type { Plugin } from './src/plugins';

const loggerPlugin: Plugin = {
  name: 'logger',
  version: '1.0.0',
  onTick(context) {
    console.log(`Tick! Mood: ${context.state.mood}`);
  },
};

agent.use(loggerPlugin);
```

### Set Up Your Own Convex Project

```bash
# Install Convex CLI
npm install -g convex

# Initialize new project
npx convex init

# Start dev server
npx convex dev
```

Then update `CONVEX_URL` in `.env.local` with your new deployment URL.

---

## Common Issues

### "Cannot find module" Error

```bash
npm install
```

### "CONVEX_URL is not defined"

Create `.env.local` file (Step 3) or use demo mode:
```bash
npm run demo
```

### "Invalid API key"

- Verify your keys are correct in `.env.local`
- OpenRouter keys start with `sk-or-`
- Gemini keys start with `AIza`

### Terminal UI Not Rendering

- Ensure terminal supports ANSI colors
- Try a different terminal (iTerm2, Windows Terminal, etc.)
- Minimum terminal width: 80 columns

### Port 3001 In Use

```bash
# Find what's using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>
```

---

## Project Structure

```
example/convex/
├── .env.local          # Your environment variables (create this)
├── package.json        # NPM configuration
├── convex/             # Convex backend
│   ├── schema.ts       # Database schema
│   ├── http.ts         # HTTP endpoints
│   ├── state.ts        # State queries/mutations
│   ├── memories.ts     # Memory operations
│   ├── knowledge.ts    # Knowledge operations
│   └── logs.ts         # Logging operations
├── src/                # TypeScript source
│   ├── cli.tsx         # CLI entry point
│   ├── core/           # Agent runtime
│   ├── backend/        # Storage backends
│   ├── memory/         # Memory system
│   ├── llm/            # LLM integration
│   ├── plugins/        # Plugin system
│   └── ui/             # Terminal UI
└── tests/              # Jest tests
```

---

## Links

- **Live Demo:** https://clark.wiki
- **Documentation:** https://docs.clarkos.dev
- **GitHub:** https://github.com/clarkOS/clark
- **Issues:** https://github.com/clarkOS/clark/issues
