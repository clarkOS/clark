/**
 * Plugin system type definitions.
 * @module plugins/types
 */

import type { Agent } from '../core/agent.js';
import type { TickContext, ActionResult } from '../core/types.js';

/** Plugin action handler */
export type ActionHandler = (
  params: Record<string, unknown>,
  agent: Agent
) => Promise<unknown>;

/** Plugin definition */
export interface Plugin {
  /** Unique plugin name */
  name: string;

  /** Plugin version (semver) */
  version: string;

  /** Plugin description */
  description?: string;

  /** Dependencies (other plugin names) */
  dependencies?: string[];

  /** Called when plugin is registered */
  init?(agent: Agent): void | Promise<void>;

  /** Called when plugin is unloaded */
  cleanup?(agent: Agent): void | Promise<void>;

  /** Called on each tick */
  onTick?(context: TickContext): void | Promise<void>;

  /** Plugin actions */
  actions?: Record<string, ActionHandler>;
}

/** Plugin metadata for registry */
export interface PluginMeta {
  name: string;
  version: string;
  description?: string;
  dependencies?: string[];
}

/** Plugin load result */
export interface PluginLoadResult {
  success: boolean;
  plugin?: Plugin;
  error?: string;
}
