/**
 * LLM Client - Configurable model routing
 *
 * Supports OpenRouter (default), OpenAI, Anthropic, and custom endpoints.
 * No vendor lock-in - switch providers by changing configuration.
 *
 * @module llm/client
 */

export type LLMProvider = 'openrouter' | 'openai' | 'anthropic' | 'custom';

export interface LLMConfig {
  /** Provider to use (default: openrouter) */
  provider: LLMProvider;
  /** Model identifier */
  model: string;
  /** API key */
  apiKey: string;
  /** Custom endpoint URL (for 'custom' provider) */
  baseUrl?: string;
  /** Max tokens to generate */
  maxTokens?: number;
  /** Temperature (0-1) */
  temperature?: number;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionResult {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Provider endpoint configuration
 */
const PROVIDER_ENDPOINTS: Record<LLMProvider, string> = {
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
  custom: '', // User-provided
};

/**
 * Recommended models by provider (lowest cost with good quality)
 */
export const RECOMMENDED_MODELS = {
  openrouter: {
    /** Best value for general use */
    default: 'anthropic/claude-3.5-haiku',
    /** High quality reasoning */
    quality: 'anthropic/claude-3.5-sonnet',
    /** Fast and cheap */
    fast: 'meta-llama/llama-3.1-8b-instruct',
    /** Coding tasks */
    code: 'deepseek/deepseek-coder',
  },
  openai: {
    default: 'gpt-4o-mini',
    quality: 'gpt-4o',
    fast: 'gpt-4o-mini',
  },
  anthropic: {
    default: 'claude-3-5-haiku-latest',
    quality: 'claude-3-5-sonnet-latest',
    fast: 'claude-3-5-haiku-latest',
  },
} as const;

/**
 * Create default LLM configuration using OpenRouter
 */
export function createDefaultConfig(apiKey: string): LLMConfig {
  return {
    provider: 'openrouter',
    model: RECOMMENDED_MODELS.openrouter.default,
    apiKey,
    maxTokens: 1024,
    temperature: 0.7,
  };
}

/**
 * Create LLM configuration from environment variables
 */
export function configFromEnv(): LLMConfig {
  const provider = (process.env.LLM_PROVIDER || 'openrouter') as LLMProvider;
  const apiKey =
    process.env.OPENROUTER_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    '';

  let model = process.env.MODEL_ID || process.env.LLM_MODEL;
  if (!model) {
    // Use recommended model for provider
    const recommended = RECOMMENDED_MODELS[provider as keyof typeof RECOMMENDED_MODELS];
    model = recommended?.default || RECOMMENDED_MODELS.openrouter.default;
  }

  return {
    provider,
    model,
    apiKey,
    baseUrl: process.env.LLM_BASE_URL,
    maxTokens: Number(process.env.LLM_MAX_TOKENS) || 1024,
    temperature: Number(process.env.LLM_TEMPERATURE) || 0.7,
  };
}

/**
 * LLM Client class
 */
export class LLMClient {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  /**
   * Get chat completion
   */
  async complete(messages: Message[]): Promise<CompletionResult> {
    const { provider, model, apiKey, maxTokens, temperature } = this.config;

    if (provider === 'anthropic') {
      return this.completeAnthropic(messages);
    }

    // OpenRouter and OpenAI use same format
    const endpoint =
      provider === 'custom'
        ? this.config.baseUrl!
        : PROVIDER_ENDPOINTS[provider];

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };

    // OpenRouter-specific headers
    if (provider === 'openrouter') {
      headers['HTTP-Referer'] = 'https://clarkos.dev';
      headers['X-Title'] = 'ClarkOS Agent';
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM API error (${response.status}): ${error}`);
    }

    const data = await response.json();

    return {
      content: data.choices?.[0]?.message?.content || '',
      model: data.model || model,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }

  /**
   * Anthropic-specific completion (different API format)
   */
  private async completeAnthropic(messages: Message[]): Promise<CompletionResult> {
    const { model, apiKey, maxTokens } = this.config;

    // Extract system message
    const systemMessage = messages.find((m) => m.role === 'system');
    const userMessages = messages.filter((m) => m.role !== 'system');

    const response = await fetch(PROVIDER_ENDPOINTS.anthropic, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens || 1024,
        system: systemMessage?.content,
        messages: userMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${error}`);
    }

    const data = await response.json();

    return {
      content: data.content?.[0]?.text || '',
      model: data.model || model,
      usage: data.usage
        ? {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: data.usage.input_tokens + data.usage.output_tokens,
          }
        : undefined,
    };
  }

  /**
   * Simple text completion helper
   */
  async ask(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: Message[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const result = await this.complete(messages);
    return result.content;
  }

  /**
   * Get current model info
   */
  getModel(): string {
    return this.config.model;
  }

  /**
   * Get provider
   */
  getProvider(): LLMProvider {
    return this.config.provider;
  }
}

/**
 * Create an LLM client instance
 */
export function createLLMClient(config: LLMConfig): LLMClient {
  return new LLMClient(config);
}

/**
 * Create LLM client from environment
 */
export function createLLMClientFromEnv(): LLMClient {
  return new LLMClient(configFromEnv());
}
