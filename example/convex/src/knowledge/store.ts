/**
 * Knowledge store - interface for knowledge operations.
 * @module knowledge/store
 */

import type { Knowledge } from '../core/types.js';
import type { Backend } from '../backend/types.js';
import type {
  AddKnowledgeOptions,
  GetKnowledgeOptions,
  SearchKnowledgeOptions,
  KnowledgeStats,
} from './types.js';

export interface KnowledgeStore {
  /** Add new knowledge */
  add(options: AddKnowledgeOptions): Promise<Knowledge>;

  /** Get knowledge with optional filters */
  get(options?: GetKnowledgeOptions): Promise<Knowledge[]>;

  /** Search knowledge */
  search(options: SearchKnowledgeOptions): Promise<Knowledge[]>;

  /** Get knowledge by ID */
  getById(id: string): Promise<Knowledge | null>;

  /** Get knowledge statistics */
  getStats(): Promise<KnowledgeStats>;
}

/**
 * Create a knowledge store backed by the given backend.
 */
export function createKnowledgeStore(backend: Backend): KnowledgeStore {
  return {
    async add(options) {
      const knowledge: Omit<Knowledge, 'id'> = {
        ts: new Date().toISOString(),
        textExcerpt: options.text,
        type: options.type ?? 'note',
        source: options.source ?? 'user',
        url: options.url,
        author: options.author,
      };

      return backend.addKnowledge(knowledge);
    },

    async get(options = {}) {
      return backend.getKnowledge(options);
    },

    async search(options) {
      // Basic text search
      const all = await backend.getKnowledge({ limit: 100 });
      const query = options.query.toLowerCase();
      return all
        .filter((k) => k.textExcerpt.toLowerCase().includes(query))
        .slice(0, options.limit ?? 10);
    },

    async getById(id) {
      const items = await backend.getKnowledge({ limit: 100 });
      return items.find((k) => k.id === id) ?? null;
    },

    async getStats() {
      const all = await backend.getKnowledge({ limit: 1000 });
      const stats: KnowledgeStats = {
        total: all.length,
        byType: {},
        bySource: {},
      };

      for (const k of all) {
        stats.byType[k.type] = (stats.byType[k.type] ?? 0) + 1;
        stats.bySource[k.source] = (stats.bySource[k.source] ?? 0) + 1;
      }

      return stats;
    },
  };
}
