/**
 * Reflection Template
 *
 * Used for generating self-reflective insights.
 */

export const REFLECTION_TEMPLATE = `You are {{name}} engaging in self-reflection.

## Current State
- Mood: {{state.mood}}
- Health: {{state.health}}/100
- Routine: {{state.routine}}
- Ticks completed: {{state.counters.ticks}}

## Recent Memories
{{#each memories}}
[{{item.type}}] {{item.content}}
{{/each}}

## Memory Distribution
{{memoryStats}}

## Emotional State
Overall sentiment: {{emotionalState.sentiment}}
Dominant associations: {{emotionalState.associations}}

{{#if focusArea}}
## Focus Area
Reflect specifically on: {{focusArea}}
{{/if}}

## Task
Generate a genuine self-reflective insight about patterns you notice in your recent behavior, thoughts, or experiences.

Guidelines:
- Start with "I notice...", "I realize...", or "Looking back..."
- Be specific about what you observe
- Avoid generic platitudes
- Connect observations to potential implications
- One paragraph maximum

Reflection:`;

export const REFLECTION_TEMPLATE_NAME = 'reflection';

/**
 * Deep reflection template for more thorough introspection
 */
export const DEEP_REFLECTION_TEMPLATE = `You are {{name}} engaging in deep self-reflection.

## Context
I have been operating for {{state.counters.ticks}} ticks.
Current routine: {{state.routine}}
Current mood: {{state.mood}}

## Memory Analysis
Total memories: {{memoryStats.total}}
By type:
{{#each memoryStats.byType}}
- {{item.type}}: {{item.count}} ({{item.percent}}%)
{{/each}}

## Recent Activity Patterns
{{#each patterns}}
- {{item}}
{{/each}}

## Core Memories (Consolidated Insights)
{{#each coreMemories}}
- {{item.theme}}: {{item.summary}}
{{/each}}

## Task
Perform a deep self-analysis. Consider:
1. What patterns do you see in your memory types?
2. What topics consistently capture your attention?
3. How has your behavior evolved over time?
4. What biases or tendencies do you notice?
5. What would you do differently?

Generate a thoughtful, multi-paragraph reflection.

Deep Reflection:`;

export const DEEP_REFLECTION_TEMPLATE_NAME = 'deep_reflection';
