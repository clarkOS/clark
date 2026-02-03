/**
 * Remark Action
 *
 * Generates a witty observation or comment about current state.
 * This is Clark's "voice" - short, punchy remarks.
 */

import { defineAction } from './registry.js';
import type { Action } from './types.js';

export const remarkAction: Action = defineAction({
  name: 'generate_remark',
  description: 'Generate a witty observation or comment about current state or recent events',

  visual: {
    trigger: 'speak',
    duration: 'auto',
    speechRate: 1.0,
  },

  examples: [
    {
      context: 'mood: curious, health: 85, recent news about AI breakthroughs',
      action: 'generate_remark',
      result: 'The machines are getting smarter. Good thing I got here first.',
    },
    {
      context: 'mood: reflective, health: 60, market down 5%',
      action: 'generate_remark',
      result: 'Red days teach patience. Green days test greed.',
    },
  ],

  async validate(runtime, context) {
    // Can remark if health > 20 and not in cryo
    return context.state.health > 20 && !context.state.cryo;
  },

  async handler(runtime, context, params) {
    const memories = await runtime.getMemories({ limit: 3 });
    const recentContext = memories.map((m) => m.content).join('. ');

    const prompt = `You are an autonomous AI agent with a dry wit.
Current state: mood=${context.state.mood}, health=${context.state.health}, routine=${context.state.routine}

Recent context: ${recentContext || 'Starting fresh.'}

Generate a single witty remark (1-2 sentences max). Be clever but not try-hard.
No hashtags, no emojis, no "As an AI" disclaimers.

Remark:`;

    try {
      const response = await runtime.useModel('TEXT_SMALL', { prompt });
      const remark = response.content.trim().replace(/^["']|["']$/g, '');

      return {
        success: true,
        data: { remark },
        visual: {
          trigger: 'speak',
          duration: 'auto',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate remark',
      };
    }
  },
});
