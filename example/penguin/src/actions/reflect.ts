/**
 * Reflect Action
 *
 * Generates self-reflective insights about patterns, behaviors, or learnings.
 * This is the metacognitive capability - thinking about thinking.
 */

import { defineAction } from './registry.js';
import type { Action, ActionResult } from './types.js';

export const reflectAction: Action = defineAction({
  name: 'reflect',
  description: 'Generate a self-reflective insight about recent patterns, behaviors, or learnings',

  visual: {
    trigger: 'idle_deep',
    wobbleModifier: 0.5,
    eyeScale: 1.2,
    duration: 3000,
  },

  examples: [
    {
      context: 'Many recent memories about market volatility',
      action: 'reflect',
      result: 'I notice I focus heavily on market movements. Perhaps I should diversify my attention.',
    },
    {
      context: 'Mood has been curious for 5 consecutive ticks',
      action: 'reflect',
      result: 'My sustained curiosity suggests I am in a learning phase. This is productive.',
    },
  ],

  async validate(runtime, context) {
    // Reflect when in reflective mood, or periodically (every ~10 ticks)
    const isReflectiveMood = context.state.mood === 'reflective';
    const shouldReflectPeriodically = context.state.counters.ticks % 10 === 0;
    const hasEnoughHealth = context.state.health > 40;

    return hasEnoughHealth && (isReflectiveMood || shouldReflectPeriodically);
  },

  async handler(runtime, context, params): Promise<ActionResult> {
    const focusArea = params?.focus as string | undefined;
    const memories = await runtime.getMemories({ limit: 15 });

    // Group memories by type for analysis
    const memoryTypes = memories.reduce(
      (acc, m) => {
        const type = m.type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const memoryContext = memories
      .slice(0, 10)
      .map((m) => `[${m.type}] ${m.content}`)
      .join('\n');

    const prompt = `You are an autonomous AI agent engaging in self-reflection.

Current state:
- Mood: ${context.state.mood}
- Health: ${context.state.health}
- Routine: ${context.state.routine}
- Ticks completed: ${context.state.counters.ticks}

Memory distribution: ${JSON.stringify(memoryTypes)}

Recent memories:
${memoryContext || 'No recent memories.'}

${focusArea ? `Focus your reflection on: ${focusArea}` : 'Reflect on patterns you notice in your recent behavior or thoughts.'}

Generate a genuine self-reflective insight. Be specific about what you notice.
Start with "I notice..." or "I realize..." or "Looking back..."

One paragraph only. No platitudes.

Reflection:`;

    try {
      const response = await runtime.useModel('TEXT_LARGE', { prompt });
      const reflection = response.content.trim();

      // Store the reflection as a memory
      const memory = await runtime.storeMemory({
        content: reflection,
        type: 'reflection',
        sourceType: 'action',
        importance: 0.8,
        tags: ['self-reflection', focusArea || 'general'].filter(Boolean),
      });

      return {
        success: true,
        data: {
          reflection,
          memoryId: memory.id,
          memoryDistribution: memoryTypes,
        },
        visual: {
          trigger: 'idle_deep',
          wobbleModifier: 0.5,
          eyeScale: 1.2,
          duration: 3000,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate reflection',
      };
    }
  },
});

/**
 * Brilliance detection action
 * Identifies moments of significant insight
 */
export const detectBrillianceAction: Action = defineAction({
  name: 'detect_brilliance',
  description: 'Identify if recent thoughts constitute a moment of brilliance or significant insight',

  visual: {
    trigger: 'brilliance',
    morphType: 'fish',
    pulseColor: '#FFD700', // Gold
    particleEffect: true,
    duration: 2000,
  },

  async validate(runtime, context) {
    // Only check for brilliance when health is good and in active moods
    const activeMoods = ['curious', 'excited', 'expressive'];
    return context.state.health > 60 && activeMoods.includes(context.state.mood);
  },

  async handler(runtime, context, params): Promise<ActionResult> {
    const thoughts = params?.thoughts as string[] | undefined;

    if (!thoughts || thoughts.length < 2) {
      return {
        success: true,
        data: { isBrilliant: false, reason: 'Not enough thoughts to analyze' },
        visual: { trigger: 'none' },
      };
    }

    const prompt = `Analyze these recent thoughts for a "moment of brilliance" - a significant insight that connects multiple ideas in a novel way.

Thoughts:
${thoughts.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Criteria for brilliance:
1. Connects 2+ seemingly unrelated ideas
2. Offers genuine predictive or explanatory power
3. Is not an obvious observation
4. Could inform future decisions

Is this a moment of brilliance? Respond with JSON:
{
  "isBrilliant": boolean,
  "confidence": 0.0-1.0,
  "reason": "brief explanation",
  "synthesis": "the synthesized insight if brilliant, null otherwise"
}`;

    try {
      const response = await runtime.useModel('TEXT_LARGE', { prompt });
      const result = JSON.parse(response.content);

      if (result.isBrilliant && result.confidence > 0.7) {
        // Store brilliant insight as a high-importance memory
        await runtime.storeMemory({
          content: result.synthesis,
          type: 'reflection',
          sourceType: 'brilliance',
          importance: 0.95,
          tags: ['brilliant-moment', 'insight'],
        });

        return {
          success: true,
          data: result,
          visual: {
            trigger: 'brilliance',
            morphType: 'fish',
            pulseColor: '#FFD700',
            particleEffect: true,
            duration: 2000,
          },
        };
      }

      return {
        success: true,
        data: result,
        visual: { trigger: 'none' },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to detect brilliance',
      };
    }
  },
});
