/**
 * Agent configuration management.
 * @module core/config
 */

import { z } from 'zod';

/** Backend configuration schema */
const BackendConfigSchema = z.object({
  type: z.enum(['convex', 'memory']).default('convex'),
  url: z.string().url().optional(),
  tickToken: z.string().optional(),
  writeToken: z.string().optional(),
});

/** Tick configuration schema */
const TickConfigSchema = z.object({
  interval: z.number().min(1000).default(60000), // Minimum 1 second
  auto: z.boolean().default(false),
  maxRetries: z.number().default(3),
});

/** Memory configuration schema */
const MemoryConfigSchema = z.object({
  consolidationThreshold: z.number().default(100),
  decayRate: z.number().min(0).max(1).default(0.1),
  maxShortTerm: z.number().default(50),
});

/** Full agent configuration schema */
const AgentConfigSchema = z.object({
  name: z.string().default('Agent'),
  backend: BackendConfigSchema.default({}),
  tick: TickConfigSchema.default({}),
  memory: MemoryConfigSchema.default({}),
  verbose: z.boolean().default(false),
});

export type BackendConfig = z.infer<typeof BackendConfigSchema>;
export type TickConfig = z.infer<typeof TickConfigSchema>;
export type MemoryConfig = z.infer<typeof MemoryConfigSchema>;
export type AgentConfig = z.infer<typeof AgentConfigSchema>;

/**
 * Load configuration from environment variables.
 */
export function loadConfigFromEnv(): AgentConfig {
  return AgentConfigSchema.parse({
    name: process.env.AGENT_NAME,
    backend: {
      type: process.env.BACKEND_TYPE || 'convex',
      url: process.env.CONVEX_URL,
      tickToken: process.env.TICK_TOKEN,
      writeToken: process.env.WRITE_TOKEN,
    },
    tick: {
      interval: process.env.TICK_INTERVAL ? parseInt(process.env.TICK_INTERVAL) : undefined,
      auto: process.env.AUTO_TICK === 'true',
    },
    memory: {
      consolidationThreshold: process.env.MEMORY_THRESHOLD
        ? parseInt(process.env.MEMORY_THRESHOLD)
        : undefined,
    },
    verbose: process.env.VERBOSE === 'true',
  });
}

/**
 * Create a configuration with defaults.
 */
export function createConfig(partial: Partial<AgentConfig> = {}): AgentConfig {
  return AgentConfigSchema.parse(partial);
}

/**
 * Validate a configuration object.
 */
export function validateConfig(config: unknown): AgentConfig {
  return AgentConfigSchema.parse(config);
}
