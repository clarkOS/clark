/**
 * Embedding Client - Vector embeddings for semantic search
 *
 * Supports Gemini (default - free tier), OpenAI, and custom endpoints.
 * Configurable via environment variables.
 *
 * @module llm/embeddings
 */

export type EmbeddingProvider = 'gemini' | 'openai' | 'custom';

export interface EmbeddingConfig {
  /** Provider to use (default: gemini) */
  provider: EmbeddingProvider;
  /** API key */
  apiKey: string;
  /** Model identifier */
  model?: string;
  /** Embedding dimensions (default: 768 for Gemini, 1536 for OpenAI) */
  dimensions?: number;
  /** Custom endpoint URL */
  baseUrl?: string;
}

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  dimensions: number;
}

/**
 * Provider configurations
 */
const PROVIDER_CONFIG = {
  gemini: {
    endpoint:
      'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent',
    defaultModel: 'text-embedding-004',
    dimensions: 768,
  },
  openai: {
    endpoint: 'https://api.openai.com/v1/embeddings',
    defaultModel: 'text-embedding-3-small',
    dimensions: 1536,
  },
  custom: {
    endpoint: '',
    defaultModel: '',
    dimensions: 768,
  },
} as const;

/**
 * Create default embedding configuration using Gemini (free tier)
 */
export function createDefaultEmbeddingConfig(apiKey: string): EmbeddingConfig {
  return {
    provider: 'gemini',
    apiKey,
    model: PROVIDER_CONFIG.gemini.defaultModel,
    dimensions: PROVIDER_CONFIG.gemini.dimensions,
  };
}

/**
 * Create embedding configuration from environment
 */
export function embeddingConfigFromEnv(): EmbeddingConfig {
  const provider = (process.env.EMBEDDING_PROVIDER || 'gemini') as EmbeddingProvider;
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.EMBEDDING_API_KEY ||
    '';

  const config = PROVIDER_CONFIG[provider];

  return {
    provider,
    apiKey,
    model: process.env.EMBEDDING_MODEL || config.defaultModel,
    dimensions: Number(process.env.EMBEDDING_DIMENSIONS) || config.dimensions,
    baseUrl: process.env.EMBEDDING_BASE_URL,
  };
}

/**
 * Embedding Client class
 */
export class EmbeddingClient {
  private config: EmbeddingConfig;

  constructor(config: EmbeddingConfig) {
    this.config = config;
  }

  /**
   * Generate embedding for text
   */
  async embed(text: string): Promise<EmbeddingResult> {
    const { provider } = this.config;

    switch (provider) {
      case 'gemini':
        return this.embedGemini(text);
      case 'openai':
        return this.embedOpenAI(text);
      case 'custom':
        return this.embedCustom(text);
      default:
        throw new Error(`Unknown embedding provider: ${provider}`);
    }
  }

  /**
   * Generate embeddings for multiple texts (batched)
   */
  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    // For now, process sequentially (providers have different batch APIs)
    return Promise.all(texts.map((text) => this.embed(text)));
  }

  /**
   * Gemini embedding
   */
  private async embedGemini(text: string): Promise<EmbeddingResult> {
    const { apiKey, model } = this.config;
    const modelName = model || PROVIDER_CONFIG.gemini.defaultModel;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: `models/${modelName}`,
          content: { parts: [{ text }] },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini embedding error (${response.status}): ${error}`);
    }

    const data = await response.json();
    const embedding = data.embedding?.values || [];

    return {
      embedding,
      model: modelName,
      dimensions: embedding.length,
    };
  }

  /**
   * OpenAI embedding
   */
  private async embedOpenAI(text: string): Promise<EmbeddingResult> {
    const { apiKey, model } = this.config;
    const modelName = model || PROVIDER_CONFIG.openai.defaultModel;

    const response = await fetch(PROVIDER_CONFIG.openai.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI embedding error (${response.status}): ${error}`);
    }

    const data = await response.json();
    const embedding = data.data?.[0]?.embedding || [];

    return {
      embedding,
      model: modelName,
      dimensions: embedding.length,
    };
  }

  /**
   * Custom endpoint embedding
   */
  private async embedCustom(text: string): Promise<EmbeddingResult> {
    const { apiKey, model, baseUrl, dimensions } = this.config;

    if (!baseUrl) {
      throw new Error('Custom embedding provider requires baseUrl');
    }

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Custom embedding error (${response.status}): ${error}`);
    }

    const data = await response.json();
    // Try common response formats
    const embedding =
      data.embedding ||
      data.data?.[0]?.embedding ||
      data.embeddings?.[0] ||
      [];

    return {
      embedding,
      model: model || 'custom',
      dimensions: embedding.length || dimensions || 768,
    };
  }

  /**
   * Get configuration
   */
  getConfig(): EmbeddingConfig {
    return { ...this.config };
  }
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have same dimensions');
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;

  return dot / magnitude;
}

/**
 * Find most similar items from a list
 */
export function findSimilar<T extends { embedding?: number[] }>(
  queryEmbedding: number[],
  items: T[],
  options: { limit?: number; threshold?: number } = {}
): Array<T & { similarity: number }> {
  const { limit = 10, threshold = 0 } = options;

  const scored = items
    .filter((item) => item.embedding && item.embedding.length > 0)
    .map((item) => ({
      ...item,
      similarity: cosineSimilarity(queryEmbedding, item.embedding!),
    }))
    .filter((item) => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity);

  return scored.slice(0, limit);
}

/**
 * Create an embedding client instance
 */
export function createEmbeddingClient(config: EmbeddingConfig): EmbeddingClient {
  return new EmbeddingClient(config);
}

/**
 * Create embedding client from environment
 */
export function createEmbeddingClientFromEnv(): EmbeddingClient {
  return new EmbeddingClient(embeddingConfigFromEnv());
}
