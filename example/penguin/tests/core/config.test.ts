/**
 * Tests for configuration management.
 * @module tests/core/config
 */

import { createConfig, validateConfig, loadConfigFromEnv } from '../../src/core/config.js';

describe('createConfig', () => {
  it('creates config with defaults when no args passed', () => {
    const config = createConfig();

    expect(config.name).toBe('Agent');
    expect(config.backend.type).toBe('convex');
    expect(config.tick.interval).toBe(60000);
    expect(config.tick.auto).toBe(false);
    expect(config.tick.maxRetries).toBe(3);
    expect(config.memory.consolidationThreshold).toBe(100);
    expect(config.memory.decayRate).toBe(0.1);
    expect(config.memory.maxShortTerm).toBe(50);
    expect(config.verbose).toBe(false);
  });

  it('allows overriding name', () => {
    const config = createConfig({ name: 'CLARK' });
    expect(config.name).toBe('CLARK');
  });

  it('allows overriding backend config', () => {
    const config = createConfig({
      backend: {
        type: 'memory',
        url: 'https://example.convex.site',
      },
    });

    expect(config.backend.type).toBe('memory');
    expect(config.backend.url).toBe('https://example.convex.site');
  });

  it('allows overriding tick config', () => {
    const config = createConfig({
      tick: {
        interval: 5000,
        auto: true,
        maxRetries: 5,
      },
    });

    expect(config.tick.interval).toBe(5000);
    expect(config.tick.auto).toBe(true);
    expect(config.tick.maxRetries).toBe(5);
  });

  it('allows overriding memory config', () => {
    const config = createConfig({
      memory: {
        consolidationThreshold: 200,
        decayRate: 0.2,
        maxShortTerm: 100,
      },
    });

    expect(config.memory.consolidationThreshold).toBe(200);
    expect(config.memory.decayRate).toBe(0.2);
    expect(config.memory.maxShortTerm).toBe(100);
  });

  it('allows enabling verbose mode', () => {
    const config = createConfig({ verbose: true });
    expect(config.verbose).toBe(true);
  });
});

describe('validateConfig', () => {
  it('validates a complete config object', () => {
    const input = {
      name: 'TestAgent',
      backend: { type: 'convex' },
      tick: { interval: 30000, auto: false, maxRetries: 3 },
      memory: { consolidationThreshold: 100, decayRate: 0.1, maxShortTerm: 50 },
      verbose: true,
    };

    const config = validateConfig(input);
    expect(config.name).toBe('TestAgent');
    expect(config.verbose).toBe(true);
  });

  it('applies defaults for missing fields', () => {
    const config = validateConfig({});

    expect(config.name).toBe('Agent');
    expect(config.tick.interval).toBe(60000);
  });

  it('rejects invalid backend type', () => {
    expect(() =>
      validateConfig({
        backend: { type: 'invalid' },
      })
    ).toThrow();
  });

  it('rejects tick interval below minimum', () => {
    expect(() =>
      validateConfig({
        tick: { interval: 500 }, // Below 1000ms minimum
      })
    ).toThrow();
  });

  it('rejects decay rate below 0', () => {
    expect(() =>
      validateConfig({
        memory: { decayRate: -0.1 },
      })
    ).toThrow();
  });

  it('rejects decay rate above 1', () => {
    expect(() =>
      validateConfig({
        memory: { decayRate: 1.5 },
      })
    ).toThrow();
  });

  it('rejects invalid URL format', () => {
    expect(() =>
      validateConfig({
        backend: { url: 'not-a-url' },
      })
    ).toThrow();
  });
});

describe('loadConfigFromEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('loads name from AGENT_NAME', () => {
    process.env.AGENT_NAME = 'EnvAgent';
    const config = loadConfigFromEnv();
    expect(config.name).toBe('EnvAgent');
  });

  it('loads backend type from BACKEND_TYPE', () => {
    process.env.BACKEND_TYPE = 'memory';
    const config = loadConfigFromEnv();
    expect(config.backend.type).toBe('memory');
  });

  it('loads Convex URL from CONVEX_URL', () => {
    process.env.CONVEX_URL = 'https://test.convex.site';
    const config = loadConfigFromEnv();
    expect(config.backend.url).toBe('https://test.convex.site');
  });

  it('loads tick token from TICK_TOKEN', () => {
    process.env.TICK_TOKEN = 'secret-tick-token';
    const config = loadConfigFromEnv();
    expect(config.backend.tickToken).toBe('secret-tick-token');
  });

  it('loads write token from WRITE_TOKEN', () => {
    process.env.WRITE_TOKEN = 'secret-write-token';
    const config = loadConfigFromEnv();
    expect(config.backend.writeToken).toBe('secret-write-token');
  });

  it('loads tick interval from TICK_INTERVAL', () => {
    process.env.TICK_INTERVAL = '30000';
    const config = loadConfigFromEnv();
    expect(config.tick.interval).toBe(30000);
  });

  it('loads auto tick from AUTO_TICK', () => {
    process.env.AUTO_TICK = 'true';
    const config = loadConfigFromEnv();
    expect(config.tick.auto).toBe(true);
  });

  it('loads verbose from VERBOSE', () => {
    process.env.VERBOSE = 'true';
    const config = loadConfigFromEnv();
    expect(config.verbose).toBe(true);
  });

  it('uses defaults when env vars not set', () => {
    delete process.env.AGENT_NAME;
    delete process.env.BACKEND_TYPE;
    delete process.env.TICK_INTERVAL;

    const config = loadConfigFromEnv();

    expect(config.name).toBe('Agent');
    expect(config.backend.type).toBe('convex');
    expect(config.tick.interval).toBe(60000);
  });
});
