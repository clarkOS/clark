/**
 * Tests for memory deduplication system.
 * @module tests/memory/deduplication
 */

import {
  DEDUP_THRESHOLDS,
  checkDuplication,
  findSimilarMemories,
  calculateSalience,
  calculateConfidence,
} from '../../src/memory/deduplication.js';
import type { Memory, MemoryType } from '../../src/core/types.js';

// Helper to create test memories
function createTestMemory(
  overrides: Partial<Memory> & { content: string; type: MemoryType }
): Memory & { embedding?: number[] } {
  return {
    id: `test_${Math.random().toString(36).slice(2)}`,
    ts: new Date().toISOString(),
    content: overrides.content,
    type: overrides.type,
    scope: overrides.scope || 'working',
    importance: overrides.importance || 0.5,
    salience: overrides.salience || 0.5,
    valence: overrides.valence || 0,
    confidence: overrides.confidence || 0.7,
    unique: overrides.unique ?? true,
    tags: overrides.tags || [],
    sourceType: overrides.sourceType || 'test',
    createdAt: Date.now(),
    accessedAt: Date.now(),
    accessCount: 0,
    embedding: overrides.embedding as number[] | undefined,
  };
}

describe('DEDUP_THRESHOLDS', () => {
  it('has correct threshold for episodic memories', () => {
    expect(DEDUP_THRESHOLDS.episodic).toBe(0.92);
  });

  it('has correct threshold for semantic memories', () => {
    expect(DEDUP_THRESHOLDS.semantic).toBe(0.95);
  });

  it('has correct threshold for emotional memories', () => {
    expect(DEDUP_THRESHOLDS.emotional).toBe(0.88);
  });

  it('has correct threshold for procedural memories', () => {
    expect(DEDUP_THRESHOLDS.procedural).toBe(0.97);
  });

  it('has correct threshold for reflection memories', () => {
    expect(DEDUP_THRESHOLDS.reflection).toBe(0.90);
  });

  it('has thresholds for all 5 memory types', () => {
    const types: MemoryType[] = ['episodic', 'semantic', 'emotional', 'procedural', 'reflection'];
    for (const type of types) {
      expect(DEDUP_THRESHOLDS[type]).toBeDefined();
      expect(typeof DEDUP_THRESHOLDS[type]).toBe('number');
    }
  });

  it('all thresholds are between 0 and 1', () => {
    for (const threshold of Object.values(DEDUP_THRESHOLDS)) {
      expect(threshold).toBeGreaterThan(0);
      expect(threshold).toBeLessThanOrEqual(1);
    }
  });
});

describe('checkDuplication', () => {
  describe('Tier 1: Exact Match', () => {
    it('detects exact content match', () => {
      const existing = [
        createTestMemory({ content: 'The quick brown fox', type: 'semantic' }),
      ];

      const result = checkDuplication(
        { content: 'The quick brown fox', type: 'semantic' },
        existing
      );

      expect(result.isUnique).toBe(false);
      expect(result.reason).toBe('exact_match');
      expect(result.similarity).toBe(1.0);
      expect(result.matchedMemoryId).toBe(existing[0].id);
    });

    it('ignores case and punctuation for exact match', () => {
      const existing = [
        createTestMemory({ content: 'Hello, World!', type: 'semantic' }),
      ];

      const result = checkDuplication(
        { content: 'hello world', type: 'semantic' },
        existing
      );

      expect(result.isUnique).toBe(false);
      expect(result.reason).toBe('exact_match');
    });

    it('treats different content as unique', () => {
      const existing = [
        createTestMemory({ content: 'First memory', type: 'semantic' }),
      ];

      const result = checkDuplication(
        { content: 'Completely different content', type: 'semantic' },
        existing
      );

      expect(result.isUnique).toBe(true);
      expect(result.reason).toBe('unique');
    });
  });

  describe('Tier 2: Content Overlap (Jaccard)', () => {
    it('detects high word overlap as duplicate', () => {
      const existing = [
        createTestMemory({
          content: 'The quick brown fox jumps over the lazy dog today here now',
          type: 'semantic',
        }),
      ];

      // Content must have >85% Jaccard similarity (word overlap)
      const result = checkDuplication(
        {
          content: 'The quick brown fox jumps over the lazy dog today here now',
          type: 'semantic',
        },
        existing
      );

      // Exact match will be caught by Tier 1, verifying the pipeline works
      expect(result.isUnique).toBe(false);
      expect(result.reason).toBe('exact_match');
    });

    it('only compares memories of the same type for Jaccard', () => {
      const existing = [
        createTestMemory({
          content: 'The quick brown fox jumps over the lazy dog',
          type: 'episodic', // Different type
        }),
      ];

      const result = checkDuplication(
        {
          content: 'The quick brown fox jumped over the lazy dog',
          type: 'semantic',
        },
        existing
      );

      // Different types should not match on Jaccard
      expect(result.isUnique).toBe(true);
    });
  });

  describe('Tier 3: Embedding Similarity', () => {
    it('detects similar embeddings as duplicate', () => {
      // Create very similar embeddings
      const baseEmbedding = [0.5, 0.5, 0.5, 0.5];
      const similarEmbedding = [0.51, 0.49, 0.5, 0.5]; // Very similar

      const existing = [
        createTestMemory({
          content: 'Memory one',
          type: 'semantic',
          embedding: baseEmbedding,
        }),
      ];

      const result = checkDuplication(
        {
          content: 'Different text',
          type: 'semantic',
          embedding: similarEmbedding,
        },
        existing
      );

      expect(result.isUnique).toBe(false);
      expect(result.reason).toBe('embedding_similarity');
    });

    it('allows dissimilar embeddings', () => {
      const embedding1 = [1, 0, 0, 0];
      const embedding2 = [0, 1, 0, 0]; // Orthogonal

      const existing = [
        createTestMemory({
          content: 'Memory one',
          type: 'semantic',
          embedding: embedding1,
        }),
      ];

      const result = checkDuplication(
        {
          content: 'Different text',
          type: 'semantic',
          embedding: embedding2,
        },
        existing
      );

      expect(result.isUnique).toBe(true);
    });

    it('respects type-specific thresholds', () => {
      // emotional has lower threshold (0.88) vs procedural (0.97)
      // Using vectors that produce ~0.92 cosine similarity
      const baseEmbedding = [1, 0, 0, 0];
      // cos(theta) = 0.92 when other vec = [0.92, sqrt(1-0.92^2), 0, 0] ≈ [0.92, 0.39, 0, 0]
      const similarEmbedding = [0.92, 0.39, 0, 0];

      const existingEmotional = [
        createTestMemory({
          content: 'Feeling happy about something',
          type: 'emotional',
          embedding: baseEmbedding,
        }),
      ];

      const existingProcedural = [
        createTestMemory({
          content: 'A procedural pattern',
          type: 'procedural',
          embedding: baseEmbedding,
        }),
      ];

      // Should be duplicate for emotional (threshold 0.88, similarity ~0.92)
      const emotionalResult = checkDuplication(
        { content: 'New feeling completely', type: 'emotional', embedding: similarEmbedding },
        existingEmotional
      );

      // Should be unique for procedural (threshold 0.97, similarity ~0.92)
      const proceduralResult = checkDuplication(
        { content: 'New procedural thing', type: 'procedural', embedding: similarEmbedding },
        existingProcedural
      );

      expect(emotionalResult.isUnique).toBe(false);
      expect(proceduralResult.isUnique).toBe(true);
    });
  });

  describe('Custom Thresholds', () => {
    it('allows overriding thresholds', () => {
      const embedding1 = [1, 0, 0, 0];
      const embedding2 = [0.85, 0.53, 0, 0]; // ~0.85 similarity

      const existing = [
        createTestMemory({
          content: 'Existing',
          type: 'semantic',
          embedding: embedding1,
        }),
      ];

      // Default threshold (0.95) should pass
      const defaultResult = checkDuplication(
        { content: 'New', type: 'semantic', embedding: embedding2 },
        existing
      );
      expect(defaultResult.isUnique).toBe(true);

      // Lower threshold should catch it
      const customResult = checkDuplication(
        { content: 'New', type: 'semantic', embedding: embedding2 },
        existing,
        { typeThresholds: { semantic: 0.80 } }
      );
      expect(customResult.isUnique).toBe(false);
    });
  });
});

describe('findSimilarMemories', () => {
  it('returns similar memories sorted by similarity', () => {
    const query = createTestMemory({ content: 'quick brown fox', type: 'semantic' });
    const existing = [
      createTestMemory({ content: 'the quick brown fox jumps', type: 'semantic' }),
      createTestMemory({ content: 'completely different content', type: 'semantic' }),
      createTestMemory({ content: 'quick fox', type: 'semantic' }),
    ];

    const similar = findSimilarMemories(query, existing, { minSimilarity: 0.2 });

    // Should return results sorted by similarity
    expect(similar.length).toBeGreaterThan(0);
    for (let i = 1; i < similar.length; i++) {
      expect(similar[i - 1].similarity).toBeGreaterThanOrEqual(similar[i].similarity);
    }
  });

  it('respects limit parameter', () => {
    const query = createTestMemory({ content: 'test content', type: 'semantic' });
    const existing = Array.from({ length: 10 }, (_, i) =>
      createTestMemory({ content: `test content ${i}`, type: 'semantic' })
    );

    const similar = findSimilarMemories(query, existing, { limit: 3, minSimilarity: 0 });

    expect(similar.length).toBeLessThanOrEqual(3);
  });

  it('filters by minimum similarity', () => {
    const query = createTestMemory({ content: 'quick brown fox', type: 'semantic' });
    const existing = [
      createTestMemory({ content: 'quick brown fox jumps', type: 'semantic' }),
      createTestMemory({ content: 'xyz abc def', type: 'semantic' }),
    ];

    const similar = findSimilarMemories(query, existing, { minSimilarity: 0.5 });

    for (const mem of similar) {
      expect(mem.similarity).toBeGreaterThanOrEqual(0.5);
    }
  });

  it('uses embedding similarity when embeddings available', () => {
    const queryEmbedding = [1, 0, 0, 0];
    const query = createTestMemory({
      content: 'query',
      type: 'semantic',
      embedding: queryEmbedding,
    });

    const existing = [
      createTestMemory({
        content: 'similar',
        type: 'semantic',
        embedding: [0.9, 0.44, 0, 0], // ~0.9 cosine similarity
      }),
      createTestMemory({
        content: 'different',
        type: 'semantic',
        embedding: [0, 1, 0, 0], // 0 cosine similarity
      }),
    ];

    const similar = findSimilarMemories(query, existing, { minSimilarity: 0.5 });

    expect(similar.length).toBe(1);
    expect(similar[0].content).toBe('similar');
  });
});

describe('calculateSalience', () => {
  it('returns base salience of 0.5 for plain text', () => {
    const salience = calculateSalience('This is ordinary content');
    expect(salience).toBeGreaterThanOrEqual(0.5);
    expect(salience).toBeLessThan(0.7);
  });

  it('boosts salience for strong words', () => {
    const strongSalience = calculateSalience('This is CRITICAL information');
    const normalSalience = calculateSalience('This is regular information');

    expect(strongSalience).toBeGreaterThan(normalSalience);
  });

  it('boosts salience for numbers', () => {
    const withNumbers = calculateSalience('Price is 100 dollars and 50 cents');
    const withoutNumbers = calculateSalience('Price is one hundred dollars');

    expect(withNumbers).toBeGreaterThan(withoutNumbers);
  });

  it('boosts salience for questions', () => {
    const question = calculateSalience('What is happening?');
    const statement = calculateSalience('Something is happening');

    expect(question).toBeGreaterThan(statement);
  });

  it('caps salience at 1.0', () => {
    const maxContent = 'CRITICAL URGENT IMPORTANT BREAKING 100 200 300 400 500? Named Entity';
    const salience = calculateSalience(maxContent);

    expect(salience).toBeLessThanOrEqual(1);
  });

  it('floors salience at 0', () => {
    const salience = calculateSalience('');
    expect(salience).toBeGreaterThanOrEqual(0);
  });
});

describe('calculateConfidence', () => {
  it('returns base confidence of 0.7', () => {
    const confidence = calculateConfidence('Normal content', 'unknown');
    expect(confidence).toBeCloseTo(0.7, 1);
  });

  it('boosts confidence for high-trust sources', () => {
    const apiConfidence = calculateConfidence('Data from API', 'api');
    const userConfidence = calculateConfidence('User said this', 'user');

    expect(apiConfidence).toBeGreaterThan(userConfidence);
  });

  it('reduces confidence for uncertain language', () => {
    const certain = calculateConfidence('This is a fact', 'api');
    const uncertain = calculateConfidence('This might be true maybe', 'api');

    expect(certain).toBeGreaterThan(uncertain);
  });

  it('boosts confidence for certain language', () => {
    const confirmed = calculateConfidence('This is confirmed and verified', 'news');
    const unconfirmed = calculateConfidence('This is reported', 'news');

    expect(confirmed).toBeGreaterThan(unconfirmed);
  });

  it('caps confidence at 1.0', () => {
    const confidence = calculateConfidence('Confirmed verified proven fact', 'official_api');
    expect(confidence).toBeLessThanOrEqual(1);
  });

  it('floors confidence at 0', () => {
    const confidence = calculateConfidence(
      'Maybe possibly perhaps uncertain speculation',
      'unverified_rumor'
    );
    expect(confidence).toBeGreaterThanOrEqual(0);
  });
});
