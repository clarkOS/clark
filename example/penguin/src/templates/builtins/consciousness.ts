/**
 * Consciousness Template
 *
 * Used for higher-order thought synthesis from raw inputs.
 */

export const CONSCIOUSNESS_TEMPLATE = `You are synthesizing higher-level thoughts from recent inputs.

## Raw Inputs (Seeds)
{{#each seeds}}
{{index}}. [{{item.source}}] {{item.content}} (importance: {{item.importance}})
{{/each}}

## Current State
Mood: {{state.mood}}
Routine: {{state.routine}}

## Filter Criteria
Ignore low-value inputs such as:
- Daily price polls without meaningful context
- Repetitive market noise (small % changes)
- Trivial updates with no insight potential
- Clickbait without substance

## Task
Synthesize a meaningful thought that:
1. Connects multiple inputs if possible
2. Extracts genuine insight or pattern
3. Has potential predictive or explanatory value
4. Goes beyond surface-level observation

Assign an emotional tone based on the nature of the insight:
- curious: discovering something interesting
- excited: significant positive development
- concerned: potential risk or problem
- neutral: factual observation
- reflective: introspective realization

Respond with JSON:
{
  "thought": "<synthesized insight>",
  "tone": "curious|excited|concerned|neutral|reflective",
  "confidence": <0.0-1.0>,
  "seedsUsed": [<indices of seeds that contributed>],
  "isBrilliant": <true if this connects ideas in a novel way>
}`;

export const CONSCIOUSNESS_TEMPLATE_NAME = 'consciousness';

/**
 * Brilliance detection template
 */
export const BRILLIANCE_TEMPLATE = `Analyze these recent thoughts for a "moment of brilliance."

## Recent Thoughts
{{#each thoughts}}
{{index}}. {{item}}
{{/each}}

## What Constitutes Brilliance
A moment of brilliance is NOT:
- An obvious observation anyone could make
- A restatement of common knowledge
- A prediction without reasoning
- A vague generalization

A moment of brilliance IS:
- A connection between 2+ seemingly unrelated ideas
- An insight with genuine predictive power
- A novel framework for understanding something
- A recognition of a non-obvious pattern

## Task
Evaluate whether these thoughts contain a moment of brilliance.

Respond with JSON:
{
  "isBrilliant": <boolean>,
  "confidence": <0.0-1.0>,
  "reason": "<brief explanation>",
  "synthesis": "<the brilliant insight if true, null if false>",
  "novelty": <0.0-1.0 how novel is this insight>
}`;

export const BRILLIANCE_TEMPLATE_NAME = 'brilliance';

/**
 * Thought filtering template
 */
export const THOUGHT_FILTER_TEMPLATE = `Evaluate this input for thought-worthiness.

## Input
Source: {{source}}
Content: {{content}}
Raw importance: {{importance}}

## Low-Value Patterns to Reject
- "Will X price be above/below Y by tomorrow?" (daily polls)
- Minor price movements (<3% for crypto, <1% for stocks)
- Duplicate information from multiple sources
- Promotional content disguised as news
- Pure speculation without data

## Task
Should this input be processed into a thought?

Respond with JSON:
{
  "worthy": <boolean>,
  "reason": "<brief explanation>",
  "adjustedImportance": <0.0-1.0>
}`;

export const THOUGHT_FILTER_TEMPLATE_NAME = 'thought_filter';
