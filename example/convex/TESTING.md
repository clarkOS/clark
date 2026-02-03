# Testing Guide for ink SDK

This document covers the test framework, how to run tests, and guidelines for writing new tests.

## Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Coverage

| Module | Tests | Description |
|--------|-------|-------------|
| `core/tick` | 25 | Routine calculation, health drift, tick execution, tick runner |
| `core/config` | 22 | Configuration validation, env loading, Zod schemas |
| `memory/deduplication` | 34 | 3-tier dedup (exact/Jaccard/embedding), type thresholds |
| `backend/memory` | 22 | In-memory backend, state management, CRUD operations |
| `plugins/loader` | 26 | Plugin validation, dependency sorting, cycle detection |
| `llm/embeddings` | 32 | Cosine similarity, find similar, provider configs |
| `services/news` | 21 | Service lifecycle, caching, deduplication |
| **Total** | **179** | All passing |

## Test Structure

```
ink/
├── jest.config.js          # Jest configuration
├── tests/
│   ├── setup.ts            # Test utilities and custom matchers
│   ├── core/
│   │   ├── tick.test.ts    # Tick system tests
│   │   └── config.test.ts  # Configuration tests
│   ├── memory/
│   │   └── deduplication.test.ts  # Deduplication tests
│   ├── backend/
│   │   └── memory.test.ts  # In-memory backend tests
│   ├── plugins/
│   │   └── loader.test.ts  # Plugin loader tests
│   ├── llm/
│   │   └── embeddings.test.ts  # Embedding client tests
│   └── services/
│       └── news.test.ts    # News service tests
```

## Configuration

The test framework uses:

- **Jest** - Test runner
- **ts-jest** - TypeScript support with ESM
- **ESM modules** - Native ES module support via `--experimental-vm-modules`

### jest.config.js

Key configuration options:

```javascript
{
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}
```

## Writing Tests

### Basic Test Structure

```typescript
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { myFunction } from '../../src/module/file.js';

describe('myFunction', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('does something expected', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });

  it('handles edge cases', () => {
    expect(() => myFunction(null)).toThrow();
  });
});
```

### Using the MemoryBackend for Tests

The `MemoryBackend` is ideal for testing without a real Convex deployment:

```typescript
import { MemoryBackend } from '../../src/backend/memory.js';

describe('MyFeature', () => {
  let backend: MemoryBackend;

  beforeEach(() => {
    backend = new MemoryBackend();
  });

  afterEach(() => {
    backend.reset(); // Clear all data between tests
  });

  it('stores and retrieves data', async () => {
    await backend.storeMemory({
      content: 'Test memory',
      type: 'semantic',
      // ... other fields
    });

    const memories = await backend.getMemories({ type: 'semantic' });
    expect(memories.length).toBe(1);
  });
});
```

### Mocking External APIs

For tests that call external APIs (LLM, embeddings), mock the fetch function:

```typescript
import { jest, beforeEach, afterEach } from '@jest/globals';

describe('EmbeddingClient', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ embedding: { values: [0.1, 0.2, 0.3] } }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('calls the API', async () => {
    // Your test using the mocked fetch
    expect(global.fetch).toHaveBeenCalled();
  });
});
```

### Testing Plugins

```typescript
import { executeTick } from '../../src/core/tick.js';
import { MemoryBackend } from '../../src/backend/memory.js';
import { createConfig } from '../../src/core/config.js';
import type { Plugin } from '../../src/plugins/types.js';

describe('Plugin Integration', () => {
  it('calls plugin onTick hook', async () => {
    const backend = new MemoryBackend();
    const config = createConfig({ verbose: false });

    const onTickMock = jest.fn();
    const plugin: Plugin = {
      name: 'test-plugin',
      version: '1.0.0',
      onTick: onTickMock,
    };

    await executeTick(backend, [plugin], config);

    expect(onTickMock).toHaveBeenCalledTimes(1);
    expect(onTickMock).toHaveBeenCalledWith(
      expect.objectContaining({
        state: expect.any(Object),
        memories: expect.any(Array),
      })
    );
  });
});
```

## Test Utilities

The `tests/setup.ts` file provides helper functions:

### Custom Matchers

```typescript
// Check if a number is within a range
expect(value).toBeWithinRange(0, 100);
```

### Mock Factories

```typescript
import { createMockMemory, createMockKnowledge, createMockAgentState } from '../setup';

// Create a mock memory with defaults
const memory = createMockMemory({ content: 'Custom content' });

// Create a mock agent state
const state = createMockAgentState({ mood: 'expressive', health: 80 });
```

## Running Specific Tests

```bash
# Run a specific test file
npm test -- tests/core/tick.test.ts

# Run tests matching a pattern
npm test -- --testPathPattern="memory"

# Run a specific test by name
npm test -- -t "calculates routine"
```

## Coverage Reports

After running `npm run test:coverage`, coverage reports are generated in:

- `coverage/lcov-report/index.html` - HTML report (open in browser)
- `coverage/lcov.info` - LCOV format for CI integration
- Terminal output shows summary

### Coverage Thresholds

The project enforces 70% coverage thresholds for:
- Branches
- Functions
- Lines
- Statements

## CI Integration

For GitHub Actions or other CI systems:

```yaml
- name: Run Tests
  run: |
    cd ink
    npm ci
    npm test

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./ink/coverage/lcov.info
```

## Debugging Tests

### Run with verbose output

```bash
npm test -- --verbose
```

### Run a single test in isolation

```bash
npm test -- --testPathPattern="tick.test" -t "executes successfully"
```

### Debug with Node inspector

```bash
node --inspect-brk node_modules/.bin/jest --runInBand tests/core/tick.test.ts
```

Then open `chrome://inspect` in Chrome.

## Best Practices

1. **Isolate tests** - Each test should be independent. Use `beforeEach` to reset state.

2. **Test behavior, not implementation** - Focus on what the function does, not how it does it.

3. **Use descriptive names** - Test names should describe the expected behavior.

4. **Keep tests fast** - Mock external dependencies. Use `MemoryBackend` instead of real Convex.

5. **Test edge cases** - Include tests for error conditions, empty inputs, and boundary values.

6. **Don't test third-party code** - Focus on your code, not libraries.

## Module-Specific Notes

### Tick System (`core/tick`)

- Uses `MemoryBackend` for all tests
- Tests routine boundaries (6am, 12pm, 6pm, 12am)
- Verifies health drift calculations with mean reversion
- Tests cryo mode behavior

### Deduplication (`memory/deduplication`)

- Tests all 5 memory type thresholds
- Verifies 3-tier deduplication strategy:
  1. Exact content match
  2. Jaccard similarity (word overlap > 0.85)
  3. Embedding similarity (type-specific thresholds)

### Plugin Loader (`plugins/loader`)

- Tests plugin validation rules
- Verifies topological sort for dependencies
- Tests circular dependency detection

### Embeddings (`llm/embeddings`)

- Mocks fetch for API tests
- Tests cosine similarity math
- Verifies provider configuration loading

### Services (`services/news`)

- Tests service lifecycle (start/stop)
- Verifies caching and deduplication
- Uses mock fetcher for data injection
