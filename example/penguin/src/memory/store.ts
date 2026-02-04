/**
 * Memory store - interface for memory operations.
 * @module memory/store
 */

import type { Memory } from '../core/types.js';
import type { Backend } from '../backend/types.js';
import type {
  StoreMemoryOptions,
  GetMemoriesOptions,
  SearchMemoriesOptions,
  MemoryStats,
} from './types.js';

export interface MemoryStore {
  /** Store a new memory */
  store(options: StoreMemoryOptions): Promise<Memory>;

  /** Get memories with optional filters */
  get(options?: GetMemoriesOptions): Promise<Memory[]>;

  /** Search memories semantically */
  search(options: SearchMemoriesOptions): Promise<Memory[]>;

  /** Get memory by ID */
  getById(id: string): Promise<Memory | null>;

  /** Update a memory */
  update(id: string, updates: Partial<Memory>): Promise<Memory>;

  /** Delete a memory */
  delete(id: string): Promise<void>;

  /** Get memory statistics */
  getStats(): Promise<MemoryStats>;
}

/**
 * Create a memory store backed by the given backend.
 */
export function createMemoryStore(backend: Backend): MemoryStore {
  return {
    async store(options) {
      const memory: Omit<Memory, 'id'> = {
        content: options.content,
        type: options.type ?? 'semantic',
        scope: options.scope ?? 'short_term',
        importance: options.importance ?? 0.5,
        salience: 0.5,
        valence: 0,
        confidence: 1,
        tags: options.tags ?? [],
        sourceType: options.sourceType ?? 'user',
        sourceId: options.sourceId,
        createdAt: new Date().toISOString(),
        accessCount: 0,
        unique: true,
      };

      return backend.storeMemory(memory, options.deduplicate ?? true);
    },

    async get(options = {}) {
      return backend.getMemories(options);
    },

    async search(options) {
      if (backend.searchMemories) {
        return backend.searchMemories(options);
      }
      // Fallback: basic text search
      const all = await backend.getMemories({ limit: 100 });
      const query = options.query.toLowerCase();
      return all
        .filter((m) => m.content.toLowerCase().includes(query))
        .slice(0, options.limit ?? 10);
    },

    async getById(id) {
      const memories = await backend.getMemories({ limit: 1 });
      return memories.find((m) => m.id === id) ?? null;
    },

    async update(id, updates) {
      if (backend.updateMemory) {
        return backend.updateMemory(id, updates);
      }
      throw new Error('Backend does not support memory updates');
    },

    async delete(id) {
      if (backend.deleteMemory) {
        return backend.deleteMemory(id);
      }
      throw new Error('Backend does not support memory deletion');
    },

    async getStats() {
      if (backend.getMemoryStats) {
        return backend.getMemoryStats();
      }
      // Fallback: compute from all memories
      const all = await backend.getMemories({ limit: 1000 });
      const stats: MemoryStats = {
        total: all.length,
        byType: { episodic: 0, semantic: 0, procedural: 0, emotional: 0, reflection: 0 },
        byScope: { short_term: 0, working: 0, long_term: 0 },
        averageImportance: 0,
      };

      let totalImportance = 0;
      for (const m of all) {
        stats.byType[m.type]++;
        stats.byScope[m.scope]++;
        totalImportance += m.importance;
      }

      stats.averageImportance = all.length > 0 ? totalImportance / all.length : 0;
      return stats;
    },
  };
}
