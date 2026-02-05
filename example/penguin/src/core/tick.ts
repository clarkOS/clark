/**
 * Tick system - the autonomous heartbeat of the agent.
 * @module core/tick
 */

import type { AgentState, TickContext, TickResult, Routine } from './types.js';
import type { AgentConfig } from './config.js';
import type { Backend } from '../backend/types.js';
import type { Plugin } from '../plugins/types.js';

/**
 * Calculate routine based on hour (0-23).
 */
export function calculateRoutine(hour: number): Routine {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'day';
  if (hour >= 18 && hour < 24) return 'evening';
  return 'overnight';
}

/**
 * Calculate natural health drift based on routine.
 */
export function calculateHealthDrift(routine: Routine, currentHealth: number): number {
  const driftMap: Record<Routine, number> = {
    morning: 0.5,     // Slight recovery
    day: -0.2,        // Slight drain
    evening: -0.3,    // More drain
    overnight: 1.0,   // Recovery (if resting)
  };

  const baseDrift = driftMap[routine];

  // Mean reversion toward 75
  const meanTarget = 75;
  const reversionRate = 0.02;
  const reversion = (meanTarget - currentHealth) * reversionRate;

  return baseDrift + reversion;
}

/**
 * Clamp a value between min and max.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Execute a single tick cycle.
 */
export async function executeTick(
  backend: Backend,
  plugins: Plugin[],
  config: AgentConfig
): Promise<TickResult> {
  try {
    // 1. Load current state
    const state = await backend.getState();

    // 2. Check if agent is active
    if (state.cryo) {
      return {
        success: false,
        state,
        error: 'Agent is in cryo mode',
      };
    }

    // 3. Calculate routine from current time
    const hour = new Date().getHours();
    const routine = calculateRoutine(hour);

    // 4. Gather context
    const [memories, knowledge, recentLogs] = await Promise.all([
      backend.getMemories({ limit: 10 }),
      backend.getKnowledge({ limit: 10 }),
      backend.getLogs({ limit: 5 }),
    ]);

    const context: TickContext = {
      state,
      memories,
      knowledge,
      recentLogs,
    };

    // 5. Execute plugin onTick hooks
    for (const plugin of plugins) {
      if (plugin.onTick) {
        try {
          await plugin.onTick(context);
        } catch (err) {
          if (config.verbose) {
            console.error(`Plugin ${plugin.name} onTick error:`, err);
          }
        }
      }
    }

    // 6. Calculate state changes
    const healthDrift = calculateHealthDrift(routine, state.health);
    const newHealth = clamp(state.health + healthDrift, 0, 100);

    // 7. Build new state
    const newState: AgentState = {
      ...state,
      health: newHealth,
      routine,
      counters: {
        ...state.counters,
        ticks: state.counters.ticks + 1,
      },
      lastTick: new Date().toISOString(),
    };

    // 8. Commit state (if backend supports it)
    if (backend.commitTick) {
      await backend.commitTick(newState);
    }

    return {
      success: true,
      state: newState,
      summary: `Tick ${newState.counters.ticks} completed`,
    };
  } catch (err) {
    return {
      success: false,
      state: await backend.getState(),
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Create a tick runner that executes ticks at intervals.
 */
export function createTickRunner(
  backend: Backend,
  plugins: Plugin[],
  config: AgentConfig
) {
  let interval: NodeJS.Timeout | null = null;
  let running = false;

  return {
    /** Start automatic tick execution */
    start() {
      if (running) return;
      running = true;

      interval = setInterval(async () => {
        if (!running) return;
        await executeTick(backend, plugins, config);
      }, config.tick.interval);

      // Execute first tick immediately
      executeTick(backend, plugins, config);
    },

    /** Stop automatic tick execution */
    stop() {
      running = false;
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    },

    /** Execute a single tick */
    async tick(): Promise<TickResult> {
      return executeTick(backend, plugins, config);
    },

    /** Check if running */
    isRunning() {
      return running;
    },
  };
}
