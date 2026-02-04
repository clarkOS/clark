/**
 * Memory Deduplication
 *
 * Type-specific deduplication thresholds for intelligent memory management.
 * Different memory types have different similarity requirements.
 *
 * @module memory/deduplication
 */

import type { Memory, MemoryType } from '../core/types.js';
import { cosineSimilarity } from '../llm/embeddings.js';

/**
 * Type-specific deduplication thresholds
 *
 * Different memory types require different similarity thresholds:
 * - episodic: 0.92 - Events can be similar but still distinct experiences
 * - semantic: 0.95 - Facts should consolidate when very similar
 * - emotional: 0.88 - Feelings about same topic should merge easily
 * - procedural: 0.97 - Patterns need high precision to be considered duplicates
 * - reflection: 0.90 - Self-insights should generally be unique
 */
export const DEDUP_THRESHOLDS: Record<MemoryType, number> = {
  episodic: 0.92,
  semantic: 0.95,
  emotional: 0.88,
  procedural: 0.97,
  reflection: 0.90,
};

/**
 * Deduplication check result
 */
export interface DedupResult {
  /** Whether the memory is unique (not a duplicate) */
  isUnique: boolean;
  /** Reason for the result */
  reason: 'unique' | 'exact_match' | 'content_overlap' | 'embedding_similarity';
  /** Similarity score (if applicable) */
  similarity?: number;
  /** ID of the matched memory (if duplicate) */
  matchedMemoryId?: string;
}

/**
 * Check if a new memory is a duplicate of existing memories
 *
 * Uses a three-tier strategy:
 * 1. Exact content match
 * 2. Content overlap (Jaccard similarity on words)
 * 3. Embedding similarity (if embeddings available)
 */
export function checkDuplication(
  newMemory: { content: string; type: MemoryType; embedding?: number[] },
  existingMemories: Array<Memory & { embedding?: number[] }>,
  options: { typeThresholds?: Partial<Record<MemoryType, number>> } = {}
): DedupResult {
  const thresholds = {
    ...DEDUP_THRESHOLDS,
    ...options.typeThresholds,
  };

  const threshold = thresholds[newMemory.type];
  const normalizedNew = normalizeContent(newMemory.content);

  // Tier 1: Exact match
  for (const existing of existingMemories) {
    const normalizedExisting = normalizeContent(existing.content);
    if (normalizedNew === normalizedExisting) {
      return {
        isUnique: false,
        reason: 'exact_match',
        similarity: 1.0,
        matchedMemoryId: existing.id,
      };
    }
  }

  // Tier 2: Content overlap (Jaccard similarity)
  const newWords = new Set(normalizedNew.split(/\s+/));
  for (const existing of existingMemories) {
    if (existing.type !== newMemory.type) continue;

    const existingWords = new Set(normalizeContent(existing.content).split(/\s+/));
    const jaccard = jaccardSimilarity(newWords, existingWords);

    // High Jaccard similarity indicates near-duplicate
    if (jaccard > 0.85) {
      return {
        isUnique: false,
        reason: 'content_overlap',
        similarity: jaccard,
        matchedMemoryId: existing.id,
      };
    }
  }

  // Tier 3: Embedding similarity (if available)
  if (newMemory.embedding && newMemory.embedding.length > 0) {
    for (const existing of existingMemories) {
      if (!existing.embedding || existing.embedding.length === 0) continue;
      if (existing.type !== newMemory.type) continue;

      const similarity = cosineSimilarity(newMemory.embedding, existing.embedding);
      if (similarity >= threshold) {
        return {
          isUnique: false,
          reason: 'embedding_similarity',
          similarity,
          matchedMemoryId: existing.id,
        };
      }
    }
  }

  return { isUnique: true, reason: 'unique' };
}

/**
 * Find similar memories without strict deduplication
 */
export function findSimilarMemories(
  memory: { content: string; type: MemoryType; embedding?: number[] },
  existingMemories: Array<Memory & { embedding?: number[] }>,
  options: { limit?: number; minSimilarity?: number } = {}
): Array<Memory & { similarity: number }> {
  const { limit = 5, minSimilarity = 0.5 } = options;

  if (!memory.embedding || memory.embedding.length === 0) {
    // Fallback to content-based similarity
    const normalizedNew = normalizeContent(memory.content);
    const newWords = new Set(normalizedNew.split(/\s+/));

    return existingMemories
      .map((existing) => {
        const existingWords = new Set(
          normalizeContent(existing.content).split(/\s+/)
        );
        const similarity = jaccardSimilarity(newWords, existingWords);
        return { ...existing, similarity };
      })
      .filter((m) => m.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  // Embedding-based similarity
  return existingMemories
    .filter((m) => m.embedding && m.embedding.length > 0)
    .map((existing) => ({
      ...existing,
      similarity: cosineSimilarity(memory.embedding!, existing.embedding!),
    }))
    .filter((m) => m.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * Calculate salience score for a memory
 * Salience = how attention-grabbing the memory is (separate from importance)
 */
export function calculateSalience(content: string): number {
  let salience = 0.5; // Base

  // Boost for strong language
  const strongWords = [
    'critical', 'urgent', 'important', 'breaking', 'alert',
    'warning', 'danger', 'amazing', 'incredible', 'shocking',
  ];
  const contentLower = content.toLowerCase();
  for (const word of strongWords) {
    if (contentLower.includes(word)) {
      salience += 0.1;
    }
  }

  // Boost for numbers (often indicates specific data)
  const numberCount = (content.match(/\d+/g) || []).length;
  salience += Math.min(numberCount * 0.05, 0.2);

  // Boost for questions (indicates curiosity/exploration)
  if (content.includes('?')) {
    salience += 0.1;
  }

  // Boost for named entities (capitalized words that aren't at start of sentence)
  const entities = content.match(/(?<![.!?]\s)[A-Z][a-z]+/g) || [];
  salience += Math.min(entities.length * 0.03, 0.15);

  return Math.min(1, Math.max(0, salience));
}

/**
 * Calculate confidence score for a memory
 * Confidence = how reliable/accurate the memory appears to be
 */
export function calculateConfidence(
  content: string,
  sourceType: string
): number {
  let confidence = 0.7; // Base

  // Source-based adjustments
  const highConfidenceSources = ['api', 'system', 'verified', 'official'];
  const lowConfidenceSources = ['user', 'rumor', 'speculation', 'unverified'];

  if (highConfidenceSources.some((s) => sourceType.toLowerCase().includes(s))) {
    confidence += 0.2;
  }
  if (lowConfidenceSources.some((s) => sourceType.toLowerCase().includes(s))) {
    confidence -= 0.2;
  }

  // Content-based adjustments
  const uncertainWords = ['maybe', 'perhaps', 'might', 'could', 'possibly', 'uncertain'];
  const certainWords = ['confirmed', 'verified', 'definitely', 'certainly', 'proven'];
  const contentLower = content.toLowerCase();

  for (const word of uncertainWords) {
    if (contentLower.includes(word)) confidence -= 0.1;
  }
  for (const word of certainWords) {
    if (contentLower.includes(word)) confidence += 0.1;
  }

  return Math.min(1, Math.max(0, confidence));
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Normalize content for comparison
 */
function normalizeContent(content: string): string {
  return content
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate Jaccard similarity between two sets
 */
function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  if (union.size === 0) return 0;
  return intersection.size / union.size;
}
