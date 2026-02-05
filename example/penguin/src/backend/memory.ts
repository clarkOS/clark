/**
 * In-memory backend implementation (for testing/development).
 * @module backend/memory
 */

import type {
  AgentState,
  Memory,
  Knowledge,
  Log,
} from '../core/types.js';
import type { Backend } from './types.js';
import type { GetMemoriesOptions } from '../memory/types.js';
import type { GetKnowledgeOptions } from '../knowledge/types.js';

/**
 * In-memory backend - stores everything in memory.
 * Useful for testing and development.
 */
export class MemoryBackend implements Backend {
  private state: AgentState = {
    mood: 'neutral',
    health: 100,
    routine: 'day',
    volatility: 0.05,
    counters: { ticks: 0, feeds: 0 },
    lastTick: null,
    cryo: false,
  };

  private logs: Log[] = [];
  private memories: Memory[] = [];
  private knowledge: Knowledge[] = [];
  private idCounter = 0;

  private nextId(): string {
    return `mem_${++this.idCounter}`;
  }

  async getState(): Promise<AgentState> {
    return { ...this.state };
  }

  async getLogs(options: { limit?: number } = {}): Promise<Log[]> {
    const limit = options.limit ?? 10;
    return this.logs.slice(-limit).reverse();
  }

  async getMemories(options: GetMemoriesOptions = {}): Promise<Memory[]> {
    let result = [...this.memories];

    if (options.type) {
      result = result.filter((m) => m.type === options.type);
    }
    if (options.scope) {
      result = result.filter((m) => m.scope === options.scope);
    }
    if (options.minImportance !== undefined) {
      result = result.filter((m) => m.importance >= options.minImportance!);
    }

    result.sort((a, b) => b.importance - a.importance);

    const limit = options.limit ?? 20;
    return result.slice(0, limit);
  }

  async storeMemory(memory: Omit<Memory, 'id'>): Promise<Memory> {
    const newMemory: Memory = {
      ...memory,
      id: this.nextId(),
    };
    this.memories.push(newMemory);
    return newMemory;
  }

  async getKnowledge(options: GetKnowledgeOptions = {}): Promise<Knowledge[]> {
    let result = [...this.knowledge];

    if (options.type) {
      result = result.filter((k) => k.type === options.type);
    }
    if (options.source) {
      result = result.filter((k) => k.source === options.source);
    }

    const limit = options.limit ?? 20;
    return result.slice(-limit).reverse();
  }

  async addKnowledge(knowledge: Omit<Knowledge, 'id'>): Promise<Knowledge> {
    const newKnowledge: Knowledge = {
      ...knowledge,
      id: this.nextId(),
    };
    this.knowledge.push(newKnowledge);
    return newKnowledge;
  }

  async commitTick(state: AgentState): Promise<void> {
    this.state = { ...state };

    // Add a log entry
    const log: Log = {
      id: this.nextId(),
      ts: new Date().toISOString(),
      summary: `Tick ${state.counters.ticks}`,
      detail: '',
      mood: state.mood,
      routine: state.routine,
      volatility: state.volatility,
      artifacts: [],
    };
    this.logs.push(log);
  }

  /** Reset all data (for testing) */
  reset(): void {
    this.state = {
      mood: 'neutral',
      health: 100,
      routine: 'day',
      volatility: 0.05,
      counters: { ticks: 0, feeds: 0 },
      lastTick: null,
      cryo: false,
    };
    this.logs = [];
    this.memories = [];
    this.knowledge = [];
    this.idCounter = 0;
  }
}

/**
 * Create an in-memory backend instance.
 */
export function createMemoryBackend(): MemoryBackend {
  return new MemoryBackend();
}
