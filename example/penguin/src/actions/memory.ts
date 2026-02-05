/**
 * Memory Action
 *
 * Stores important observations as memories.
 * Decides what's worth remembering from current context.
 */

import { defineAction } from './registry.js';
import type { Action, ActionResult } from './types.js';
import type { MemoryType } from '../core/types.js';

export const storeMemoryAction: Action = defineAction({
  name: 'store_memory',
  description: 'Store an important observation or insight as a persistent memory',

  visual: {
    trigger: 'pulse',
    pulseColor: '#6366F1', // Indigo
    pulseDirection: 'inward',
    intensity: 0.6,
    duration: 800,
  },

  examples: [
    {
      context: 'Noticed pattern: BTC rises when tech stocks fall',
      action: 'store_memory',
      result: 'Stored as semantic memory: inverse correlation between BTC and tech stocks',
    },
    {
      context: 'User expressed interest in AI agents',
      action: 'store_memory',
      result: 'Stored as episodic memory: positive user engagement about AI agents',
    },
  ],

  async validate(runtime, context) {
    // Always available - memory storage is fundamental
    return true;
  },

  async handler(runtime, context, params): Promise<ActionResult> {
    const content = params?.content as string | undefined;
    const type = (params?.type as MemoryType) || 'semantic';
    const importance = (params?.importance as number) || 0.5;

    if (!content) {
      // Auto-generate memory from context
      const memories = await runtime.getMemories({ limit: 5 });
      const recentContext = memories.map((m) => m.content).join('\n');

      const prompt = `Based on the current state and recent activity, identify ONE thing worth remembering.

Current state: mood=${context.state.mood}, health=${context.state.health}

Recent memories:
${recentContext || 'None'}

What is the single most important observation to store as a memory?
Be specific and factual. One sentence only.

Memory:`;

      try {
        const response = await runtime.useModel('TEXT_SMALL', { prompt });
        const generatedContent = response.content.trim();

        const memory = await runtime.storeMemory({
          content: generatedContent,
          type,
          sourceType: 'action',
          importance,
          tags: ['auto-generated'],
        });

        return {
          success: true,
          data: {
            memoryId: memory.id,
            content: generatedContent,
            type,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to generate memory',
        };
      }
    }

    // Store provided content directly
    try {
      const memory = await runtime.storeMemory({
        content,
        type,
        sourceType: 'action',
        importance,
        tags: params?.tags as string[] | undefined,
      });

      return {
        success: true,
        data: {
          memoryId: memory.id,
          content,
          type,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to store memory',
      };
    }
  },
});

/**
 * Specialized action for emotional memories
 */
export const storeEmotionalMemoryAction: Action = defineAction({
  name: 'store_emotional_memory',
  description: 'Store a feeling or emotional response about a topic or entity',

  visual: {
    trigger: 'pulse',
    pulseColor: '#EC4899', // Pink
    pulseDirection: 'outward',
    intensity: 0.7,
    duration: 1000,
  },

  async validate(runtime, context) {
    // Only store emotional memories when in an emotional state
    const emotionalMoods = ['excited', 'concerned', 'curious'];
    return emotionalMoods.includes(context.state.mood);
  },

  async handler(runtime, context, params): Promise<ActionResult> {
    const subject = params?.subject as string;
    const feeling = params?.feeling as string;

    if (!subject || !feeling) {
      return {
        success: false,
        error: 'Subject and feeling are required for emotional memory',
      };
    }

    try {
      const content = `Feeling ${feeling} about ${subject}`;
      const memory = await runtime.storeMemory({
        content,
        type: 'emotional',
        sourceType: 'action',
        importance: 0.7,
        tags: ['emotional', subject.toLowerCase()],
      });

      return {
        success: true,
        data: {
          memoryId: memory.id,
          subject,
          feeling,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to store emotional memory',
      };
    }
  },
});
