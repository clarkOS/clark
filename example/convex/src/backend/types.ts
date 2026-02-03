/**
 * Backend abstraction type definitions.
 * @module backend/types
 */

import type {
  AgentState,
  Memory,
  Knowledge,
  Log,
  Painting,
} from '../core/types.js';
import type { GetMemoriesOptions, SearchMemoriesOptions, MemoryStats } from '../memory/types.js';
import type { GetKnowledgeOptions } from '../knowledge/types.js';

/** Backend interface - abstraction over storage */
export interface Backend {
  /** Get current agent state */
  getState(): Promise<AgentState>;

  /** Get activity logs */
  getLogs(options?: { limit?: number }): Promise<Log[]>;

  /** Get memories */
  getMemories(options?: GetMemoriesOptions): Promise<Memory[]>;

  /** Store a new memory */
  storeMemory(memory: Omit<Memory, 'id'>, deduplicate?: boolean): Promise<Memory>;

  /** Get knowledge items */
  getKnowledge(options?: GetKnowledgeOptions): Promise<Knowledge[]>;

  /** Add knowledge item */
  addKnowledge(knowledge: Omit<Knowledge, 'id'>): Promise<Knowledge>;

  /** Get paintings/artwork */
  getPaintings?(options?: { limit?: number }): Promise<Painting[]>;

  // Optional methods

  /** Commit tick state changes */
  commitTick?(state: AgentState): Promise<void>;

  /** Search memories semantically */
  searchMemories?(options: SearchMemoriesOptions): Promise<Memory[]>;

  /** Update a memory */
  updateMemory?(id: string, updates: Partial<Memory>): Promise<Memory>;

  /** Delete a memory */
  deleteMemory?(id: string): Promise<void>;

  /** Get memory statistics */
  getMemoryStats?(): Promise<MemoryStats>;

  /** Trigger a tick (for backends that support it) */
  triggerTick?(reason?: string): Promise<void>;

  /** Health check */
  health?(): Promise<{ ok: boolean; [key: string]: unknown }>;
}

/** Backend factory options */
export interface BackendOptions {
  url?: string;
  tickToken?: string;
  writeToken?: string;
}
