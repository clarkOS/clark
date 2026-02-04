/**
 * Character System
 *
 * Defines and loads character personalities from JSON files.
 */

export type {
  Character,
  CharacterContext,
  CharacterIdentity,
  CharacterPersonality,
  CharacterTopics,
  CharacterSpeech,
  CharacterMemory,
  CharacterVisuals,
  CharacterIntegration,
  Trait,
  SituationalTrait,
  Routine,
  HealthModifier,
  VolatilityStyle,
} from './types.js';

export {
  validateCharacter,
  loadCharacter,
  getCurrentRoutine,
  getHealthModifier,
  getVolatilityStyle,
  getActiveTraits,
  getTrait,
  buildCharacterContext,
  getTraitPhrase,
  checkProhibitions,
  isInterested,
  shouldAvoid,
} from './loader.js';
