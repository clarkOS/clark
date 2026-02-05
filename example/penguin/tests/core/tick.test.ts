/**
 * Tests for the tick system.
 * @module tests/core/tick
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { calculateRoutine, calculateHealthDrift, executeTick, createTickRunner } from '../../src/core/tick.js';
import { MemoryBackend } from '../../src/backend/memory.js';
import { createConfig } from '../../src/core/config.js';
import type { Plugin } from '../../src/plugins/types.js';

describe('calculateRoutine', () => {
  it('returns morning for hours 6-11', () => {
    expect(calculateRoutine(6)).toBe('morning');
    expect(calculateRoutine(9)).toBe('morning');
    expect(calculateRoutine(11)).toBe('morning');
  });

  it('returns day for hours 12-17', () => {
    expect(calculateRoutine(12)).toBe('day');
    expect(calculateRoutine(15)).toBe('day');
    expect(calculateRoutine(17)).toBe('day');
  });

  it('returns evening for hours 18-23', () => {
    expect(calculateRoutine(18)).toBe('evening');
    expect(calculateRoutine(21)).toBe('evening');
    expect(calculateRoutine(23)).toBe('evening');
  });

  it('returns overnight for hours 0-5', () => {
    expect(calculateRoutine(0)).toBe('overnight');
    expect(calculateRoutine(3)).toBe('overnight');
    expect(calculateRoutine(5)).toBe('overnight');
  });

  it('handles boundary cases correctly', () => {
    expect(calculateRoutine(5)).toBe('overnight');
    expect(calculateRoutine(6)).toBe('morning');
    expect(calculateRoutine(11)).toBe('morning');
    expect(calculateRoutine(12)).toBe('day');
    expect(calculateRoutine(17)).toBe('day');
    expect(calculateRoutine(18)).toBe('evening');
  });
});

describe('calculateHealthDrift', () => {
  it('returns positive drift for morning (recovery)', () => {
    const drift = calculateHealthDrift('morning', 75);
    expect(drift).toBeGreaterThan(0);
  });

  it('returns negative drift for day', () => {
    const drift = calculateHealthDrift('day', 75);
    expect(drift).toBeLessThan(0);
  });

  it('returns negative drift for evening', () => {
    const drift = calculateHealthDrift('evening', 75);
    expect(drift).toBeLessThan(0);
  });

  it('returns positive drift for overnight (rest recovery)', () => {
    const drift = calculateHealthDrift('overnight', 75);
    expect(drift).toBeGreaterThan(0);
  });

  it('applies mean reversion toward 75', () => {
    // Low health should pull toward 75
    const lowHealthDrift = calculateHealthDrift('day', 50);
    const normalHealthDrift = calculateHealthDrift('day', 75);

    // Low health should have more positive reversion component
    expect(lowHealthDrift).toBeGreaterThan(normalHealthDrift);
  });

  it('mean reverts high health downward', () => {
    // High health should pull toward 75 (down)
    const highHealthDrift = calculateHealthDrift('day', 90);
    const normalHealthDrift = calculateHealthDrift('day', 75);

    // High health should have more negative reversion component
    expect(highHealthDrift).toBeLessThan(normalHealthDrift);
  });
});

describe('executeTick', () => {
  let backend: MemoryBackend;
  let config: ReturnType<typeof createConfig>;

  beforeEach(() => {
    backend = new MemoryBackend();
    config = createConfig({ verbose: false });
  });

  it('executes successfully with no plugins', async () => {
    const result = await executeTick(backend, [], config);

    expect(result.success).toBe(true);
    expect(result.state).toBeDefined();
    expect(result.state.counters.ticks).toBe(1);
  });

  it('increments tick counter', async () => {
    await executeTick(backend, [], config);
    const result = await executeTick(backend, [], config);

    expect(result.state.counters.ticks).toBe(2);
  });

  it('updates lastTick timestamp', async () => {
    const before = Date.now();
    const result = await executeTick(backend, [], config);
    const after = Date.now();

    expect(result.state.lastTick).toBeDefined();
    const tickTime = new Date(result.state.lastTick!).getTime();
    expect(tickTime).toBeGreaterThanOrEqual(before);
    expect(tickTime).toBeLessThanOrEqual(after);
  });

  it('updates routine based on current time', async () => {
    const result = await executeTick(backend, [], config);
    const hour = new Date().getHours();
    const expectedRoutine = calculateRoutine(hour);

    expect(result.state.routine).toBe(expectedRoutine);
  });

  it('returns error when agent is in cryo mode', async () => {
    // Put agent in cryo mode via commitTick
    const state = await backend.getState();
    state.cryo = true;
    await backend.commitTick(state);

    const result = await executeTick(backend, [], config);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Agent is in cryo mode');
  });

  it('calls plugin onTick hooks', async () => {
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
        knowledge: expect.any(Array),
        recentLogs: expect.any(Array),
      })
    );
  });

  it('continues even if plugin throws', async () => {
    const failingPlugin: Plugin = {
      name: 'failing-plugin',
      version: '1.0.0',
      onTick: () => {
        throw new Error('Plugin error');
      },
    };

    // Should not throw
    const result = await executeTick(backend, [failingPlugin], config);
    expect(result.success).toBe(true);
  });

  it('applies health drift (health stays within bounds)', async () => {
    // Health drift varies based on routine and mean reversion
    // Starting at 100, drift is applied then clamped to 0-100 bounds
    const result = await executeTick(backend, [], config);

    // Health should always stay within valid bounds
    expect(result.state.health).toBeGreaterThanOrEqual(0);
    expect(result.state.health).toBeLessThanOrEqual(100);

    // Health should be calculated with drift, then clamped
    // At 100 health, mean reversion pulls down (-0.5) but routine can add drift
    // The clamp function keeps health within [0, 100]
    const drift = calculateHealthDrift(result.state.routine, 100);
    const expectedHealth = Math.max(0, Math.min(100, 100 + drift));
    expect(result.state.health).toBe(expectedHealth);
  });
});

describe('createTickRunner', () => {
  let backend: MemoryBackend;
  let config: ReturnType<typeof createConfig>;

  beforeEach(() => {
    backend = new MemoryBackend();
    // Use valid interval (minimum 1000ms)
    config = createConfig({
      tick: { interval: 5000, auto: false, maxRetries: 3 },
      verbose: false,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates a runner with start/stop methods', () => {
    const runner = createTickRunner(backend, [], config);

    expect(runner.start).toBeInstanceOf(Function);
    expect(runner.stop).toBeInstanceOf(Function);
    expect(runner.tick).toBeInstanceOf(Function);
    expect(runner.isRunning).toBeInstanceOf(Function);
  });

  it('reports not running initially', () => {
    const runner = createTickRunner(backend, [], config);
    expect(runner.isRunning()).toBe(false);
  });

  it('reports running after start', () => {
    jest.useFakeTimers();
    const runner = createTickRunner(backend, [], config);

    runner.start();
    expect(runner.isRunning()).toBe(true);

    runner.stop();
  });

  it('reports not running after stop', () => {
    jest.useFakeTimers();
    const runner = createTickRunner(backend, [], config);

    runner.start();
    runner.stop();

    expect(runner.isRunning()).toBe(false);
  });

  it('can execute single tick via tick()', async () => {
    const runner = createTickRunner(backend, [], config);

    const result = await runner.tick();

    expect(result.success).toBe(true);
    expect(result.state.counters.ticks).toBe(1);
  });

  it('does not start twice', () => {
    jest.useFakeTimers();
    const runner = createTickRunner(backend, [], config);

    runner.start();
    runner.start(); // Second call should be ignored

    expect(runner.isRunning()).toBe(true);

    runner.stop();
  });
});
