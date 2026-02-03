/**
 * Memory system type definitions.
 * @module memory/types
 */

import type { Memory, MemoryType, MemoryScope } from '../core/types.js';

/** Options for storing a memory */
export interface StoreMemoryOptions {
  content: string;
  type?: MemoryType;
  scope?: MemoryScope;
  importance?: number;
  tags?: string[];
  sourceType?: string;
  sourceId?: string;
  deduplicate?: boolean;
}

/** Options for retrieving memories */
export interface GetMemoriesOptions {
  limit?: number;
  type?: MemoryType;
  scope?: MemoryScope;
  minImportance?: number;
}

/** Options for searching memories */
export interface SearchMemoriesOptions {
  query: string;
  limit?: number;
  type?: MemoryType;
  threshold?: number;
}

/** Memory consolidation result */
export interface ConsolidationResult {
  processed: number;
  consolidated: number;
  decayed: number;
}

/** Memory statistics */
export interface MemoryStats {
  total: number;
  byType: Record<MemoryType, number>;
  byScope: Record<MemoryScope, number>;
  averageImportance: number;
}
