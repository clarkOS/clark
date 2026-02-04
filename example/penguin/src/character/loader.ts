/**
 * Character Loader
 *
 * Loads and validates character files, providing runtime utilities
 * for accessing personality traits and behavioral rules.
 */

import type {
  Character,
  CharacterContext,
  Routine,
  HealthModifier,
  VolatilityStyle,
  Trait,
  SituationalTrait,
} from './types.js';

/**
 * Default values for optional character fields
 */
const DEFAULTS = {
  healthModifiers: {
    vibrant: { min: 90, modifier: 'sharp and energetic', traits: ['excited'] },
    steady: { min: 70, modifier: 'clear and focused', traits: ['analytical'] },
    fatigued: { min: 50, modifier: 'slightly tired', traits: ['contemplative'] },
    tired: { min: 30, modifier: 'weary but determined', traits: ['melancholic'] },
    struggling: { min: 0, modifier: 'running on reserves', traits: ['contemplative'] },
  },
  volatilityStyles: {
    high: { min: 0.7, style: 'highly expressive, dramatic' },
    moderate: { min: 0.4, style: 'balanced emotional range' },
    calm: { min: 0, style: 'measured, subtle' },
  },
  memory: {
    shortTermCapacity: 50,
    workingMemorySize: 10,
    consolidationThreshold: 0.7,
    emotionalDecayRate: 0.05,
    importanceThreshold: 0.3,
  },
  speech: {
    maxLength: 280,
    style: 'concise',
    formatting: {
      useEmoji: false,
      useHashtags: false,
      useQuotes: true,
      usePunctuation: 'minimal',
    },
    prohibitions: [],
  },
};

/**
 * Validate a character definition
 */
export function validateCharacter(character: unknown): character is Character {
  if (!character || typeof character !== 'object') return false;

  const c = character as Record<string, unknown>;

  // Required fields
  if (typeof c.name !== 'string') return false;
  if (typeof c.version !== 'string') return false;
  if (!c.identity || typeof c.identity !== 'object') return false;
  if (!c.personality || typeof c.personality !== 'object') return false;
  if (!c.routines || typeof c.routines !== 'object') return false;

  // Identity validation
  const identity = c.identity as Record<string, unknown>;
  if (typeof identity.fullName !== 'string') return false;
  if (typeof identity.voice !== 'string') return false;

  // Personality validation
  const personality = c.personality as Record<string, unknown>;
  if (!personality.core || typeof personality.core !== 'object') return false;

  return true;
}

/**
 * Load a character from a JSON object
 */
export function loadCharacter(data: unknown): Character {
  if (!validateCharacter(data)) {
    throw new Error('Invalid character definition');
  }

  // Apply defaults
  return {
    ...data,
    healthModifiers: data.healthModifiers ?? DEFAULTS.healthModifiers,
    volatilityStyles: data.volatilityStyles ?? DEFAULTS.volatilityStyles,
    memory: { ...DEFAULTS.memory, ...data.memory },
    speech: { ...DEFAULTS.speech, ...data.speech },
  };
}

/**
 * Get the current routine based on hour
 */
export function getCurrentRoutine(character: Character, hour: number): Routine {
  for (const [name, routine] of Object.entries(character.routines)) {
    if (routine.hours.includes(hour)) {
      return routine;
    }
  }

  // Fallback to first routine or default
  const routines = Object.values(character.routines);
  return routines[0] ?? {
    hours: [],
    energy: 'neutral',
    traits: [],
  };
}

/**
 * Get health modifier based on health value
 */
export function getHealthModifier(character: Character, health: number): HealthModifier {
  const modifiers = character.healthModifiers ?? DEFAULTS.healthModifiers;

  // Sort by min descending and find first match
  const sorted = Object.values(modifiers).sort((a, b) => b.min - a.min);

  for (const modifier of sorted) {
    if (health >= modifier.min) {
      return modifier;
    }
  }

  return sorted[sorted.length - 1] ?? { min: 0, modifier: 'neutral', traits: [] };
}

/**
 * Get volatility style based on volatility value
 */
export function getVolatilityStyle(character: Character, volatility: number): VolatilityStyle {
  const styles = character.volatilityStyles ?? DEFAULTS.volatilityStyles;

  // Sort by min descending and find first match
  const sorted = Object.values(styles).sort((a, b) => b.min - a.min);

  for (const style of sorted) {
    if (volatility >= style.min) {
      return style;
    }
  }

  return sorted[sorted.length - 1] ?? { min: 0, style: 'neutral' };
}

/**
 * Get active traits for current context
 */
export function getActiveTraits(
  character: Character,
  routine: Routine,
  healthMod: HealthModifier,
  triggers: string[] = []
): string[] {
  const traits = new Set<string>();

  // Add core traits (always active, weighted by situation)
  for (const traitName of Object.keys(character.personality.core)) {
    traits.add(traitName);
  }

  // Add routine traits
  for (const trait of routine.traits) {
    traits.add(trait);
  }

  // Add health traits
  for (const trait of healthMod.traits) {
    traits.add(trait);
  }

  // Add situational traits based on triggers
  if (character.personality.situational) {
    for (const [traitName, trait] of Object.entries(character.personality.situational)) {
      if (trait.triggers.some((t) => triggers.includes(t))) {
        traits.add(traitName);
      }
    }
  }

  return Array.from(traits);
}

/**
 * Get a trait by name (core or situational)
 */
export function getTrait(character: Character, name: string): Trait | SituationalTrait | undefined {
  return (
    character.personality.core[name] ??
    character.personality.situational?.[name]
  );
}

/**
 * Build a character context from current state
 */
export function buildCharacterContext(
  character: Character,
  state: { health: number; volatility: number; hour: number; triggers?: string[] }
): CharacterContext {
  const currentRoutine = getCurrentRoutine(character, state.hour);
  const healthModifier = getHealthModifier(character, state.health);
  const volatilityStyle = getVolatilityStyle(character, state.volatility);
  const activeTraits = getActiveTraits(character, currentRoutine, healthModifier, state.triggers);

  return {
    character,
    activeTraits,
    currentRoutine,
    healthModifier,
    volatilityStyle,
    energy: currentRoutine.energy,
  };
}

/**
 * Get random phrase from a trait
 */
export function getTraitPhrase(character: Character, traitName: string): string | null {
  const trait = getTrait(character, traitName);
  if (!trait || trait.phrases.length === 0) return null;

  return trait.phrases[Math.floor(Math.random() * trait.phrases.length)];
}

/**
 * Check if content violates speech prohibitions
 */
export function checkProhibitions(character: Character, content: string): string[] {
  const prohibitions = character.speech?.prohibitions ?? [];
  const violations: string[] = [];

  for (const prohibition of prohibitions) {
    if (content.toLowerCase().includes(prohibition.toLowerCase())) {
      violations.push(prohibition);
    }
  }

  return violations;
}

/**
 * Check if a topic is in the character's interests
 */
export function isInterested(character: Character, topic: string): boolean {
  const interests = character.topics?.interests ?? [];
  const lowerTopic = topic.toLowerCase();

  return interests.some((i) => lowerTopic.includes(i.toLowerCase()));
}

/**
 * Check if a topic should be avoided
 */
export function shouldAvoid(character: Character, topic: string): boolean {
  const avoids = character.topics?.avoids ?? [];
  const lowerTopic = topic.toLowerCase();

  return avoids.some((a) => lowerTopic.includes(a.toLowerCase()));
}
