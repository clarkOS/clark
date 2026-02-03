/**
 * Character System Types
 *
 * TypeScript definitions for the character file schema.
 * Characters define personality, behavior, and visual presentation.
 */

/**
 * Trait definition with weight and style
 */
export interface Trait {
  weight: number;
  phrases: string[];
  style: string;
}

/**
 * Situational trait with triggers
 */
export interface SituationalTrait extends Trait {
  triggers: string[];
}

/**
 * Routine definition for time-based behavior
 */
export interface Routine {
  hours: number[];
  energy: string;
  traits: string[];
  context?: string;
  activities?: string[];
}

/**
 * Health-based personality modifier
 */
export interface HealthModifier {
  min: number;
  modifier: string;
  traits: string[];
}

/**
 * Volatility-based expression style
 */
export interface VolatilityStyle {
  min: number;
  style: string;
}

/**
 * Character identity
 */
export interface CharacterIdentity {
  fullName: string;
  tagline?: string;
  voice: string;
  perspective?: string;
}

/**
 * Personality configuration
 */
export interface CharacterPersonality {
  core: Record<string, Trait>;
  situational?: Record<string, SituationalTrait>;
}

/**
 * Topics the character engages with
 */
export interface CharacterTopics {
  interests?: string[];
  expertise?: string[];
  avoids?: string[];
}

/**
 * Speech and communication rules
 */
export interface CharacterSpeech {
  maxLength?: number;
  style?: string;
  formatting?: {
    useEmoji?: boolean;
    useHashtags?: boolean;
    useQuotes?: boolean;
    usePunctuation?: string;
  };
  prohibitions?: string[];
}

/**
 * Memory system configuration
 */
export interface CharacterMemory {
  shortTermCapacity?: number;
  workingMemorySize?: number;
  consolidationThreshold?: number;
  emotionalDecayRate?: number;
  importanceThreshold?: number;
}

/**
 * Visual presentation configuration
 */
export interface CharacterVisuals {
  primaryColor?: string;
  accentColors?: string[];
  moodColors?: Record<string, string>;
  defaultMorph?: string;
  morphTransitionMs?: number;
}

/**
 * Integration configuration
 */
export interface CharacterIntegration {
  enabled: boolean;
  [key: string]: unknown;
}

/**
 * Complete character definition
 */
export interface Character {
  $schema?: string;
  name: string;
  version: string;
  description?: string;

  identity: CharacterIdentity;
  personality: CharacterPersonality;
  routines: Record<string, Routine>;

  healthModifiers?: Record<string, HealthModifier>;
  volatilityStyles?: Record<string, VolatilityStyle>;
  topics?: CharacterTopics;
  speech?: CharacterSpeech;
  memory?: CharacterMemory;
  visuals?: CharacterVisuals;
  integrations?: Record<string, CharacterIntegration>;
}

/**
 * Runtime character context derived from character + current state
 */
export interface CharacterContext {
  character: Character;
  activeTraits: string[];
  currentRoutine: Routine;
  healthModifier: HealthModifier;
  volatilityStyle: VolatilityStyle;
  energy: string;
}
