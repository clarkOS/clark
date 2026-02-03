/**
 * Agent runtime - the main entry point for the framework.
 * @module core/agent
 */

import type { AgentState, TickResult } from './types.js';
import type { AgentConfig } from './config.js';
import { createConfig, loadConfigFromEnv } from './config.js';
import { createTickRunner, executeTick } from './tick.js';
import type { Backend } from '../backend/types.js';
import type { Plugin } from '../plugins/types.js';
import { createMemoryStore, type MemoryStore } from '../memory/store.js';
import { createKnowledgeStore, type KnowledgeStore } from '../knowledge/store.js';

export interface AgentOptions {
  config?: Partial<AgentConfig>;
  backend: Backend;
  plugins?: Plugin[];
}

/**
 * The Agent class - core runtime for autonomous agents.
 *
 * @example
 * ```ts
 * const agent = new Agent({
 *   backend: new ConvexBackend({ url: process.env.CONVEX_URL }),
 * });
 *
 * await agent.tick();
 * ```
 */
export class Agent {
  readonly config: AgentConfig;
  readonly backend: Backend;
  readonly memory: MemoryStore;
  readonly knowledge: KnowledgeStore;

  private plugins: Plugin[] = [];
  private tickRunner: ReturnType<typeof createTickRunner> | null = null;

  constructor(options: AgentOptions) {
    this.config = options.config
      ? createConfig(options.config)
      : loadConfigFromEnv();

    this.backend = options.backend;
    this.memory = createMemoryStore(this.backend);
    this.knowledge = createKnowledgeStore(this.backend);

    if (options.plugins) {
      options.plugins.forEach((p) => this.use(p));
    }
  }

  /**
   * Register a plugin.
   */
  use(plugin: Plugin): this {
    // Check for duplicates
    if (this.plugins.some((p) => p.name === plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already registered`);
    }

    this.plugins.push(plugin);

    // Call plugin init if available
    if (plugin.init) {
      plugin.init(this);
    }

    return this;
  }

  /**
   * Get all registered plugins.
   */
  getPlugins(): readonly Plugin[] {
    return this.plugins;
  }

  /**
   * Get a plugin by name.
   */
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.find((p) => p.name === name);
  }

  /**
   * Execute a single tick.
   */
  async tick(): Promise<TickResult> {
    return executeTick(this.backend, this.plugins, this.config);
  }

  /**
   * Start automatic tick execution.
   */
  start(): void {
    if (this.tickRunner) {
      this.tickRunner.stop();
    }

    this.tickRunner = createTickRunner(this.backend, this.plugins, this.config);
    this.tickRunner.start();
  }

  /**
   * Stop automatic tick execution.
   */
  stop(): void {
    if (this.tickRunner) {
      this.tickRunner.stop();
      this.tickRunner = null;
    }
  }

  /**
   * Check if agent is running.
   */
  isRunning(): boolean {
    return this.tickRunner?.isRunning() ?? false;
  }

  /**
   * Get current agent state.
   */
  async getState(): Promise<AgentState> {
    return this.backend.getState();
  }

  /**
   * Execute a plugin action.
   */
  async executeAction(
    pluginName: string,
    actionName: string,
    params: Record<string, unknown> = {}
  ): Promise<unknown> {
    const plugin = this.getPlugin(pluginName);
    if (!plugin) {
      throw new Error(`Plugin "${pluginName}" not found`);
    }

    const action = plugin.actions?.[actionName];
    if (!action) {
      throw new Error(`Action "${actionName}" not found in plugin "${pluginName}"`);
    }

    return action(params, this);
  }
}

/**
 * Create an agent instance.
 */
export function createAgent(options: AgentOptions): Agent {
  return new Agent(options);
}
