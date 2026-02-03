# ClarkOS Troubleshooting Guide

> Solutions to the 20 most common issues

---

## Quick Diagnosis

Run the doctor script first:
```bash
npm run doctor
```

This checks Node version, environment variables, and common issues.

---

## Error Index

| # | Error | Quick Fix |
|---|-------|-----------|
| 1 | [Module not found](#1-module-not-found) | `npm install` |
| 2 | [CONVEX_URL undefined](#2-convex_url-undefined) | Create `.env.local` |
| 3 | [Invalid API key](#3-invalid-api-key) | Check key format |
| 4 | [Port 3001 in use](#4-port-3001-in-use) | Kill process |
| 5 | [Node version mismatch](#5-node-version-mismatch) | Use Node 18+ |
| 6 | [TypeScript errors](#6-typescript-errors) | `npm run typecheck` |
| 7 | [Tests failing](#7-tests-failing) | ESM flag needed |
| 8 | [Terminal UI broken](#8-terminal-ui-broken) | Check terminal |
| 9 | [Convex connection failed](#9-convex-connection-failed) | Check URL |
| 10 | [Embedding generation failed](#10-embedding-generation-failed) | Check Gemini key |
| 11 | [LLM timeout](#11-llm-timeout) | Increase timeout |
| 12 | [Memory deduplication issues](#12-memory-deduplication-issues) | Check thresholds |
| 13 | [Plugin not loading](#13-plugin-not-loading) | Check interface |
| 14 | [State not persisting](#14-state-not-persisting) | Check backend |
| 15 | [Health always 75](#15-health-always-75) | Expected behavior |
| 16 | [Tick not executing](#16-tick-not-executing) | Check cryo mode |
| 17 | [CORS errors](#17-cors-errors) | Use Convex URL |
| 18 | [Rate limiting](#18-rate-limiting) | Add delays |
| 19 | [JSON parse errors](#19-json-parse-errors) | Check response |
| 20 | [Build failures](#20-build-failures) | Clean rebuild |

---

## Detailed Solutions

### 1. Module Not Found

**Error:**
```
Error: Cannot find module './src/core/agent'
```

**Detection:**
```bash
ls node_modules | wc -l
# If 0 or very low, modules not installed
```

**Why:** Dependencies not installed.

**Fix:**
```bash
npm install
```

**If persists:**
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

### 2. CONVEX_URL Undefined

**Error:**
```
Error: CONVEX_URL environment variable is not set
```

**Detection:**
```bash
echo $CONVEX_URL
# Empty means not set
```

**Why:** Missing `.env.local` file or variable not exported.

**Fix:**
```bash
# Create .env.local
cat > .env.local << 'EOF'
CONVEX_URL=https://your-project.convex.cloud
OPENROUTER_KEY=your_key
GEMINI_API_KEY=your_key
EOF
```

**Or use demo mode:**
```bash
npm run demo
```

---

### 3. Invalid API Key

**Error:**
```
Error: Invalid API key provided
```

**Detection:**
```bash
# OpenRouter keys start with sk-or-
echo $OPENROUTER_KEY | head -c 6

# Gemini keys start with AIza
echo $GEMINI_API_KEY | head -c 4
```

**Why:** Wrong key format or expired key.

**Fix:**
1. Verify key format:
   - OpenRouter: `sk-or-v1-xxxxx`
   - Gemini: `AIzaSy-xxxxx`
2. Regenerate key if expired
3. Check no extra whitespace in `.env.local`

---

### 4. Port 3001 In Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Detection:**
```bash
lsof -i :3001
# Or on Windows:
netstat -ano | findstr :3001
```

**Why:** Another process using port 3001.

**Fix:**
```bash
# Find and kill the process
lsof -i :3001 | awk 'NR>1 {print $2}' | xargs kill -9

# Or on Windows:
taskkill /PID <PID> /F
```

---

### 5. Node Version Mismatch

**Error:**
```
SyntaxError: Unexpected token 'export'
```

**Detection:**
```bash
node --version
# Must be v18.0.0 or higher
```

**Why:** Node.js version too old for ESM.

**Fix:**
```bash
# Using nvm
nvm install 18
nvm use 18

# Or download from nodejs.org
```

---

### 6. TypeScript Errors

**Error:**
```
error TS2307: Cannot find module './types'
```

**Detection:**
```bash
npm run typecheck
```

**Why:** TypeScript configuration issue or missing types.

**Fix:**
```bash
# Reinstall types
npm install --save-dev @types/node @types/react

# Check tsconfig.json exists
cat tsconfig.json
```

---

### 7. Tests Failing

**Error:**
```
SyntaxError: Cannot use import statement outside a module
```

**Detection:**
```bash
npm test
```

**Why:** Jest needs ESM flag for TypeScript modules.

**Fix:**
```bash
# Use the correct test command (already in package.json)
node --experimental-vm-modules node_modules/jest/bin/jest.js
```

The `npm test` script should already include this flag.

---

### 8. Terminal UI Broken

**Error:**
- Garbled output
- No colors
- Layout broken

**Detection:**
```bash
# Check terminal capabilities
echo $TERM
tput colors
```

**Why:** Terminal doesn't support ANSI escape codes.

**Fix:**
1. Use a modern terminal:
   - macOS: iTerm2, Terminal.app
   - Windows: Windows Terminal, PowerShell
   - Linux: GNOME Terminal, Konsole
2. Ensure minimum width: 80 columns
3. Check font supports Unicode box-drawing characters

---

### 9. Convex Connection Failed

**Error:**
```
Error: Failed to connect to Convex deployment
```

**Detection:**
```bash
curl -I $CONVEX_URL
# Should return HTTP 200
```

**Why:** Wrong URL or Convex not running.

**Fix:**
1. Verify URL format: `https://project-name.convex.cloud`
2. Start Convex dev server: `npx convex dev`
3. Check Convex dashboard for deployment status

---

### 10. Embedding Generation Failed

**Error:**
```
Error: Failed to generate embedding
```

**Detection:**
```bash
# Test Gemini API
curl "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY"
```

**Why:** Invalid Gemini API key or quota exceeded.

**Fix:**
1. Verify key at https://aistudio.google.com/apikey
2. Check quota (free tier: 1500 requests/day)
3. Try OpenAI embeddings as fallback:
   ```bash
   EMBEDDING_PROVIDER=openai
   OPENAI_API_KEY=your_key
   ```

---

### 11. LLM Timeout

**Error:**
```
Error: Request timeout after 30000ms
```

**Detection:** Happens during `agent.tick()` or LLM calls.

**Why:** LLM response too slow.

**Fix:**
```bash
# Increase timeout in .env.local
LLM_TIMEOUT=60000

# Or use a faster model
MODEL_ID=meta-llama/llama-3.1-8b-instruct
```

---

### 12. Memory Deduplication Issues

**Error:**
- All memories marked as duplicates
- No deduplication happening

**Detection:**
```bash
# Check memory stats
curl http://localhost:3001/memories/stats
```

**Why:** Threshold too high/low for your use case.

**Fix:**
Adjust thresholds in code:
```typescript
import { checkDuplication, DEDUP_THRESHOLDS } from './src/memory/deduplication';

const customThresholds = {
  ...DEDUP_THRESHOLDS,
  semantic: 0.90,  // More aggressive dedup
};
```

Default thresholds:
- episodic: 0.92
- semantic: 0.95
- emotional: 0.88
- procedural: 0.97
- reflection: 0.90

---

### 13. Plugin Not Loading

**Error:**
```
Error: Invalid plugin: missing required field 'name'
```

**Detection:**
```typescript
import { validatePlugin } from './src/plugins';
console.log(validatePlugin(myPlugin));
```

**Why:** Plugin doesn't match interface.

**Fix:**
Ensure plugin has required fields:
```typescript
const myPlugin: Plugin = {
  name: 'my-plugin',      // Required
  version: '1.0.0',       // Required
  onTick(context) { },    // Optional
};
```

---

### 14. State Not Persisting

**Error:** State resets between runs.

**Detection:**
```bash
# Run twice and check state
npm run dev
# (quit)
npm run dev
# State should persist
```

**Why:** Using MemoryBackend (in-memory) instead of ConvexBackend.

**Fix:**
- Ensure `--demo` flag is NOT set
- Verify `CONVEX_URL` is configured
- Check Convex dashboard for data

---

### 15. Health Always 75

**Not an error.** This is expected behavior.

**Why:** Health drifts toward equilibrium (75) via mean reversion.

**Code (src/core/tick.ts):**
```typescript
const meanTarget = 75;
const reversionRate = 0.02;
const reversion = (meanTarget - currentHealth) * reversionRate;
```

Health will stabilize around 75 unless external events modify it.

---

### 16. Tick Not Executing

**Error:** `agent.tick()` returns immediately with no effect.

**Detection:**
```typescript
const result = await agent.tick();
console.log(result);
// Check for { success: false, error: 'Agent is in cryo mode' }
```

**Why:** Agent is in cryo (hibernation) mode.

**Fix:**
```typescript
// Check state
const state = await agent.getState();
if (state.cryo) {
  // Wake the agent via backend
  await backend.updateState({ cryo: false });
}
```

---

### 17. CORS Errors

**Error:**
```
Access to fetch has been blocked by CORS policy
```

**Detection:** Happens in browser console.

**Why:** Making direct HTTP calls to Convex from browser.

**Fix:**
1. Use Convex client library (handles auth):
   ```typescript
   import { ConvexClient } from "convex/browser";
   const client = new ConvexClient(CONVEX_URL);
   ```
2. Or use the Convex deployment URL with `.site` suffix for HTTP

---

### 18. Rate Limiting

**Error:**
```
Error: Rate limit exceeded
```

**Detection:** Error after many rapid requests.

**Why:** Too many API calls.

**Fix:**
```typescript
// Add delay between operations
async function withDelay<T>(fn: () => Promise<T>, ms = 1000): Promise<T> {
  const result = await fn();
  await new Promise(r => setTimeout(r, ms));
  return result;
}
```

Rate limits:
- OpenRouter: Varies by plan
- Gemini free tier: 1500 requests/day
- Convex: Generous limits

---

### 19. JSON Parse Errors

**Error:**
```
SyntaxError: Unexpected token < in JSON
```

**Detection:** Usually from LLM or API responses.

**Why:** Received HTML error page instead of JSON.

**Fix:**
1. Check the raw response:
   ```typescript
   const response = await fetch(url);
   const text = await response.text();
   console.log(text);  // See what's actually returned
   ```
2. Verify API endpoint is correct
3. Check authentication headers

---

### 20. Build Failures

**Error:**
```
error TS6133: 'x' is declared but its value is never read
```

**Detection:**
```bash
npm run build
```

**Why:** TypeScript strict mode catching unused variables.

**Fix:**
```bash
# Clean and rebuild
npm run clean
npm run build

# Or just typecheck without emitting
npm run typecheck
```

---

## Still Stuck?

### Gather Debug Info

```bash
# System info
node --version
npm --version
echo $TERM

# Environment
cat .env.local | grep -v KEY | grep -v TOKEN

# Recent errors
npm run dev 2>&1 | tail -50
```

### Get Help

1. **Search existing issues:** https://github.com/clarkOS/clark/issues
2. **Open new issue** with:
   - Node version
   - OS version
   - Error message
   - Steps to reproduce
3. **Join Discord** (if available)

---

## Prevention

### Use the Doctor Script

Before running, always check:
```bash
npm run doctor
```

### Keep Dependencies Updated

```bash
npm outdated
npm update
```

### Validate Configuration

```bash
# Check all env vars are set
node -e "require('dotenv').config({path:'.env.local'}); console.log(process.env.CONVEX_URL ? 'OK' : 'MISSING')"
```
