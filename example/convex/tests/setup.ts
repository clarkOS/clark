/**
 * Jest test setup for ClarkOS ink SDK
 *
 * This file runs before each test suite to configure the test environment.
 */

// Extend Jest matchers if needed
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Declare the custom matcher for TypeScript
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
    }
  }
}

// Mock environment variables for tests
process.env.NODE_ENV = 'test';

// Suppress console output during tests (optional - comment out for debugging)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
// };

// Global test utilities
export const createMockMemory = (overrides = {}) => ({
  id: `mem_${Date.now()}`,
  content: 'Test memory content',
  type: 'semantic' as const,
  scope: 'working' as const,
  importance: 0.5,
  salience: 0.5,
  valence: 0,
  confidence: 0.8,
  unique: true,
  tags: [],
  sourceType: 'test',
  createdAt: Date.now(),
  accessedAt: Date.now(),
  accessCount: 0,
  ...overrides,
});

export const createMockKnowledge = (overrides = {}) => ({
  id: `know_${Date.now()}`,
  source: 'test',
  type: 'fact' as const,
  textExcerpt: 'Test knowledge content',
  createdAt: Date.now(),
  ...overrides,
});

export const createMockAgentState = (overrides = {}) => ({
  mood: 'neutral' as const,
  health: 75,
  routine: 'day' as const,
  volatility: 0.3,
  counters: { ticks: 0, feeds: 0 },
  lastTick: null,
  cryo: false,
  ...overrides,
});

export {};
