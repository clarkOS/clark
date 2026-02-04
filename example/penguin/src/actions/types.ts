/**
 * Action System Types
 *
 * Actions are discrete things the agent can DO during a tick.
 * Each action has validation (can it run?) and a handler (do it).
 */

import type { AgentState, Memory, TickContext } from '../core/types.js';

/**
 * Visual effect types for frontend integration
 */
export type VisualTrigger =
  | 'speak'      // TTS with mouth animation
  | 'pulse'      // Colored ring pulse
  | 'morph'      // Fish or alien transformation
  | 'brilliance' // Special insight effect
  | 'idle_deep'  // Slow contemplative state
  | 'none';      // No visual effect

/**
 * Morph type for transformation effects
 */
export type MorphType = 'fish' | 'alien';

/**
 * Visual configuration for an action
 */
export interface ActionVisual {
  trigger: VisualTrigger;
  morphType?: MorphType;
  pulseColor?: string;
  pulseDirection?: 'inward' | 'outward';
  intensity?: number;
  duration?: number | 'auto';
  particleEffect?: boolean;
  speechRate?: number;
  wobbleModifier?: number;
  eyeScale?: number;
}

/**
 * Result of action execution
 */
export interface ActionResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  visual?: ActionVisual;
}

/**
 * Example for few-shot prompting
 */
export interface ActionExample {
  context: string;
  action: string;
  result: string;
}

/**
 * Runtime interface (subset needed by actions)
 */
export interface ActionRuntime {
  agentId: string;
  getState(): Promise<AgentState>;
  getMemories(options?: { limit?: number; type?: string }): Promise<Memory[]>;
  storeMemory(memory: Partial<Memory>): Promise<Memory>;
  useModel(type: string, params: { prompt: string; system?: string }): Promise<{ content: string }>;
}

/**
 * Action definition
 */
export interface Action {
  /** Unique action identifier */
  name: string;

  /** Human-readable description (used by LLM for selection) */
  description: string;

  /** Examples for few-shot prompting */
  examples?: ActionExample[];

  /** Default visual effect when action executes */
  visual?: ActionVisual;

  /**
   * Check if action can run in current context
   * Return false to exclude from available actions
   */
  validate(runtime: ActionRuntime, context: TickContext): Promise<boolean>;

  /**
   * Execute the action
   * Return result with optional visual override
   */
  handler(
    runtime: ActionRuntime,
    context: TickContext,
    params?: Record<string, unknown>
  ): Promise<ActionResult>;
}

/**
 * Action metadata for registration
 */
export interface ActionMeta {
  name: string;
  description: string;
  visual?: ActionVisual;
}

/**
 * Serializable action record for Convex storage
 */
export interface ActionRecord {
  id?: string;
  name: string;
  timestamp: number;
  tickId?: string;
  params?: Record<string, unknown>;
  result: ActionResult;
  duration: number;
}
