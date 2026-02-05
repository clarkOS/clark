/**
 * Action Registry
 *
 * Manages action registration, validation, and execution.
 */

import type { Action, ActionMeta, ActionResult, ActionRuntime } from './types.js';
import type { TickContext } from '../core/types.js';

/**
 * Action Registry - manages all available actions
 */
export class ActionRegistry {
  private actions = new Map<string, Action>();

  /**
   * Register an action
   */
  register(action: Action): void {
    if (this.actions.has(action.name)) {
      console.warn(`Action "${action.name}" already registered, overwriting`);
    }
    this.actions.set(action.name, action);
  }

  /**
   * Register multiple actions
   */
  registerAll(actions: Action[]): void {
    for (const action of actions) {
      this.register(action);
    }
  }

  /**
   * Get an action by name
   */
  get(name: string): Action | undefined {
    return this.actions.get(name);
  }

  /**
   * Get all registered actions
   */
  getAll(): Action[] {
    return [...this.actions.values()];
  }

  /**
   * Get action metadata (for LLM prompting)
   */
  getMeta(): ActionMeta[] {
    return this.getAll().map((action) => ({
      name: action.name,
      description: action.description,
      visual: action.visual,
    }));
  }

  /**
   * Get actions that are valid in current context
   */
  async getAvailable(
    runtime: ActionRuntime,
    context: TickContext
  ): Promise<Action[]> {
    const validationResults = await Promise.all(
      this.getAll().map(async (action) => ({
        action,
        valid: await action.validate(runtime, context).catch(() => false),
      }))
    );

    return validationResults
      .filter((r) => r.valid)
      .map((r) => r.action);
  }

  /**
   * Format available actions for LLM prompt
   */
  async formatForPrompt(
    runtime: ActionRuntime,
    context: TickContext
  ): Promise<string> {
    const available = await this.getAvailable(runtime, context);

    if (available.length === 0) {
      return 'No actions available.';
    }

    return available
      .map((action) => `- ${action.name}: ${action.description}`)
      .join('\n');
  }

  /**
   * Execute an action by name
   */
  async execute(
    name: string,
    runtime: ActionRuntime,
    context: TickContext,
    params?: Record<string, unknown>
  ): Promise<ActionResult> {
    const action = this.get(name);

    if (!action) {
      return {
        success: false,
        error: `Action "${name}" not found`,
      };
    }

    // Validate before execution
    const isValid = await action.validate(runtime, context).catch(() => false);
    if (!isValid) {
      return {
        success: false,
        error: `Action "${name}" validation failed`,
      };
    }

    // Execute with timing
    const startTime = Date.now();
    try {
      const result = await action.handler(runtime, context, params);

      // Apply default visual if not overridden
      if (!result.visual && action.visual) {
        result.visual = action.visual;
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Action execution failed',
      };
    }
  }

  /**
   * Execute multiple actions in sequence
   */
  async executeMany(
    names: string[],
    runtime: ActionRuntime,
    context: TickContext
  ): Promise<Map<string, ActionResult>> {
    const results = new Map<string, ActionResult>();

    for (const name of names) {
      const result = await this.execute(name, runtime, context);
      results.set(name, result);

      // Stop on critical failure if needed
      if (!result.success && result.error?.includes('critical')) {
        break;
      }
    }

    return results;
  }

  /**
   * Clear all registered actions
   */
  clear(): void {
    this.actions.clear();
  }
}

/**
 * Default global registry
 */
export const actionRegistry = new ActionRegistry();

/**
 * Helper to define an action with type safety
 */
export function defineAction(action: Action): Action {
  return action;
}
