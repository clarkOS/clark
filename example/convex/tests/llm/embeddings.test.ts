/**
 * Tests for embedding client.
 * @module tests/llm/embeddings
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  cosineSimilarity,
  findSimilar,
  createDefaultEmbeddingConfig,
  embeddingConfigFromEnv,
  EmbeddingClient,
} from '../../src/llm/embeddings.js';

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    const vec = [0.5, 0.5, 0.5, 0.5];
    expect(cosineSimilarity(vec, vec)).toBeCloseTo(1, 5);
  });

  it('returns 0 for orthogonal vectors', () => {
    const vecA = [1, 0, 0, 0];
    const vecB = [0, 1, 0, 0];
    expect(cosineSimilarity(vecA, vecB)).toBeCloseTo(0, 5);
  });

  it('returns -1 for opposite vectors', () => {
    const vecA = [1, 0, 0, 0];
    const vecB = [-1, 0, 0, 0];
    expect(cosineSimilarity(vecA, vecB)).toBeCloseTo(-1, 5);
  });

  it('returns value between -1 and 1 for general vectors', () => {
    const vecA = [0.3, 0.5, 0.7, 0.1];
    const vecB = [0.4, 0.6, 0.2, 0.8];
    const similarity = cosineSimilarity(vecA, vecB);

    expect(similarity).toBeGreaterThanOrEqual(-1);
    expect(similarity).toBeLessThanOrEqual(1);
  });

  it('throws for vectors of different lengths', () => {
    const vecA = [1, 2, 3];
    const vecB = [1, 2];

    expect(() => cosineSimilarity(vecA, vecB)).toThrow('same dimensions');
  });

  it('returns 0 for zero vectors', () => {
    const zero = [0, 0, 0, 0];
    const vec = [1, 2, 3, 4];

    expect(cosineSimilarity(zero, vec)).toBe(0);
    expect(cosineSimilarity(zero, zero)).toBe(0);
  });

  it('is symmetric', () => {
    const vecA = [0.3, 0.5, 0.7, 0.1];
    const vecB = [0.4, 0.6, 0.2, 0.8];

    expect(cosineSimilarity(vecA, vecB)).toBeCloseTo(cosineSimilarity(vecB, vecA), 10);
  });

  it('handles normalized vectors', () => {
    // Unit vectors
    const vecA = [1 / Math.sqrt(2), 1 / Math.sqrt(2), 0, 0];
    const vecB = [1, 0, 0, 0];

    // cos(45°) ≈ 0.707
    expect(cosineSimilarity(vecA, vecB)).toBeCloseTo(1 / Math.sqrt(2), 5);
  });
});

describe('findSimilar', () => {
  const items = [
    { id: 'a', embedding: [1, 0, 0, 0], name: 'A' },
    { id: 'b', embedding: [0.9, 0.44, 0, 0], name: 'B' }, // ~0.9 similarity to [1,0,0,0]
    { id: 'c', embedding: [0, 1, 0, 0], name: 'C' }, // 0 similarity
    { id: 'd', embedding: [-1, 0, 0, 0], name: 'D' }, // -1 similarity
  ];

  it('returns items sorted by similarity', () => {
    const query = [1, 0, 0, 0];
    const results = findSimilar(query, items);

    expect(results[0].id).toBe('a');
    expect(results[1].id).toBe('b');
    expect(results[0].similarity).toBeGreaterThan(results[1].similarity);
  });

  it('respects limit parameter', () => {
    const query = [1, 0, 0, 0];
    const results = findSimilar(query, items, { limit: 2 });

    expect(results.length).toBe(2);
  });

  it('filters by threshold', () => {
    const query = [1, 0, 0, 0];
    const results = findSimilar(query, items, { threshold: 0.5 });

    // Only A (~1.0) and B (~0.9) should pass
    expect(results.length).toBe(2);
    expect(results.every((r) => r.similarity >= 0.5)).toBe(true);
  });

  it('skips items without embeddings', () => {
    const mixedItems = [
      { id: 'a', embedding: [1, 0, 0, 0] },
      { id: 'b', embedding: undefined },
      { id: 'c', embedding: [] },
      { id: 'd', embedding: [0.9, 0.44, 0, 0] },
    ];

    const query = [1, 0, 0, 0];
    const results = findSimilar(query, mixedItems as any);

    // Only a and d have valid embeddings
    expect(results.length).toBe(2);
    expect(results.map((r) => r.id)).not.toContain('b');
    expect(results.map((r) => r.id)).not.toContain('c');
  });

  it('returns empty array for empty input', () => {
    const query = [1, 0, 0, 0];
    const results = findSimilar(query, []);

    expect(results).toEqual([]);
  });

  it('includes similarity score in results', () => {
    const query = [1, 0, 0, 0];
    const results = findSimilar(query, items);

    for (const result of results) {
      expect(typeof result.similarity).toBe('number');
    }
  });
});

describe('createDefaultEmbeddingConfig', () => {
  it('creates Gemini config with provided API key', () => {
    const config = createDefaultEmbeddingConfig('test-api-key');

    expect(config.provider).toBe('gemini');
    expect(config.apiKey).toBe('test-api-key');
    expect(config.model).toBe('text-embedding-004');
    expect(config.dimensions).toBe(768);
  });
});

describe('embeddingConfigFromEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('defaults to Gemini provider', () => {
    delete process.env.EMBEDDING_PROVIDER;
    const config = embeddingConfigFromEnv();
    expect(config.provider).toBe('gemini');
  });

  it('reads provider from EMBEDDING_PROVIDER', () => {
    process.env.EMBEDDING_PROVIDER = 'openai';
    const config = embeddingConfigFromEnv();
    expect(config.provider).toBe('openai');
  });

  it('reads API key from GEMINI_API_KEY', () => {
    process.env.GEMINI_API_KEY = 'gemini-key';
    const config = embeddingConfigFromEnv();
    expect(config.apiKey).toBe('gemini-key');
  });

  it('reads API key from OPENAI_API_KEY', () => {
    process.env.OPENAI_API_KEY = 'openai-key';
    const config = embeddingConfigFromEnv();
    expect(config.apiKey).toBe('openai-key');
  });

  it('prefers GEMINI_API_KEY over OPENAI_API_KEY', () => {
    process.env.GEMINI_API_KEY = 'gemini-key';
    process.env.OPENAI_API_KEY = 'openai-key';
    const config = embeddingConfigFromEnv();
    expect(config.apiKey).toBe('gemini-key');
  });

  it('reads custom model from EMBEDDING_MODEL', () => {
    process.env.EMBEDDING_MODEL = 'custom-model';
    const config = embeddingConfigFromEnv();
    expect(config.model).toBe('custom-model');
  });

  it('reads custom dimensions from EMBEDDING_DIMENSIONS', () => {
    process.env.EMBEDDING_DIMENSIONS = '512';
    const config = embeddingConfigFromEnv();
    expect(config.dimensions).toBe(512);
  });

  it('reads base URL from EMBEDDING_BASE_URL', () => {
    process.env.EMBEDDING_BASE_URL = 'https://custom.api.com/embed';
    const config = embeddingConfigFromEnv();
    expect(config.baseUrl).toBe('https://custom.api.com/embed');
  });
});

describe('EmbeddingClient', () => {
  describe('constructor', () => {
    it('stores configuration', () => {
      const config = createDefaultEmbeddingConfig('test-key');
      const client = new EmbeddingClient(config);

      expect(client.getConfig()).toEqual(config);
    });
  });

  describe('getConfig', () => {
    it('returns a copy of configuration', () => {
      const config = createDefaultEmbeddingConfig('test-key');
      const client = new EmbeddingClient(config);

      const retrieved = client.getConfig();
      retrieved.apiKey = 'modified';

      expect(client.getConfig().apiKey).toBe('test-key');
    });
  });

  describe('embed (mocked)', () => {
    beforeEach(() => {
      // Mock global fetch
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('throws for unknown provider', async () => {
      const client = new EmbeddingClient({
        provider: 'invalid' as any,
        apiKey: 'key',
      });

      await expect(client.embed('test')).rejects.toThrow('Unknown embedding provider');
    });

    it('calls Gemini API for gemini provider', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ embedding: { values: [0.1, 0.2, 0.3] } }),
      });

      const client = new EmbeddingClient({
        provider: 'gemini',
        apiKey: 'test-key',
      });

      const result = await client.embed('test text');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('generativelanguage.googleapis.com'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(result.embedding).toEqual([0.1, 0.2, 0.3]);
    });

    it('calls OpenAI API for openai provider', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ data: [{ embedding: [0.1, 0.2, 0.3] }] }),
      });

      const client = new EmbeddingClient({
        provider: 'openai',
        apiKey: 'test-key',
      });

      const result = await client.embed('test text');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.openai.com'),
        expect.objectContaining({ method: 'POST' })
      );
      expect(result.embedding).toEqual([0.1, 0.2, 0.3]);
    });

    it('throws error on API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      });

      const client = new EmbeddingClient({
        provider: 'gemini',
        apiKey: 'bad-key',
      });

      await expect(client.embed('test')).rejects.toThrow('401');
    });

    it('requires baseUrl for custom provider', async () => {
      const client = new EmbeddingClient({
        provider: 'custom',
        apiKey: 'key',
        // No baseUrl
      });

      await expect(client.embed('test')).rejects.toThrow('baseUrl');
    });
  });

  describe('embedBatch', () => {
    beforeEach(() => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ embedding: { values: [0.1, 0.2, 0.3] } }),
      });
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('embeds multiple texts', async () => {
      const client = new EmbeddingClient({
        provider: 'gemini',
        apiKey: 'test-key',
      });

      const results = await client.embedBatch(['text1', 'text2', 'text3']);

      expect(results.length).toBe(3);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('returns empty array for empty input', async () => {
      const client = new EmbeddingClient({
        provider: 'gemini',
        apiKey: 'test-key',
      });

      const results = await client.embedBatch([]);

      expect(results).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
