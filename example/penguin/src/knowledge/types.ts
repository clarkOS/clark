/**
 * Knowledge system type definitions.
 * @module knowledge/types
 */

import type { Knowledge } from '../core/types.js';

/** Options for adding knowledge */
export interface AddKnowledgeOptions {
  text: string;
  type?: string;
  source?: string;
  url?: string;
  author?: string;
}

/** Options for retrieving knowledge */
export interface GetKnowledgeOptions {
  limit?: number;
  type?: string;
  source?: string;
}

/** Options for searching knowledge */
export interface SearchKnowledgeOptions {
  query: string;
  limit?: number;
  type?: string;
}

/** Knowledge statistics */
export interface KnowledgeStats {
  total: number;
  byType: Record<string, number>;
  bySource: Record<string, number>;
}
