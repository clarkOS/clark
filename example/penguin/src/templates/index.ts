/**
 * Templates module exports
 * @module templates
 */

export * from './engine.js';

// Builtin templates
export {
  TICK_TEMPLATE,
  TICK_TEMPLATE_NAME,
} from './builtins/tick.js';

export {
  REFLECTION_TEMPLATE,
  REFLECTION_TEMPLATE_NAME,
  DEEP_REFLECTION_TEMPLATE,
  DEEP_REFLECTION_TEMPLATE_NAME,
} from './builtins/reflection.js';

export {
  CONSCIOUSNESS_TEMPLATE,
  CONSCIOUSNESS_TEMPLATE_NAME,
  BRILLIANCE_TEMPLATE,
  BRILLIANCE_TEMPLATE_NAME,
  THOUGHT_FILTER_TEMPLATE,
  THOUGHT_FILTER_TEMPLATE_NAME,
} from './builtins/consciousness.js';

// Helper to register all builtin templates
import { templateEngine } from './engine.js';
import { TICK_TEMPLATE, TICK_TEMPLATE_NAME } from './builtins/tick.js';
import {
  REFLECTION_TEMPLATE,
  REFLECTION_TEMPLATE_NAME,
  DEEP_REFLECTION_TEMPLATE,
  DEEP_REFLECTION_TEMPLATE_NAME,
} from './builtins/reflection.js';
import {
  CONSCIOUSNESS_TEMPLATE,
  CONSCIOUSNESS_TEMPLATE_NAME,
  BRILLIANCE_TEMPLATE,
  BRILLIANCE_TEMPLATE_NAME,
  THOUGHT_FILTER_TEMPLATE,
  THOUGHT_FILTER_TEMPLATE_NAME,
} from './builtins/consciousness.js';

/**
 * Register all builtin templates with the default engine
 */
export function registerBuiltinTemplates(): void {
  templateEngine.register(TICK_TEMPLATE_NAME, TICK_TEMPLATE);
  templateEngine.register(REFLECTION_TEMPLATE_NAME, REFLECTION_TEMPLATE);
  templateEngine.register(DEEP_REFLECTION_TEMPLATE_NAME, DEEP_REFLECTION_TEMPLATE);
  templateEngine.register(CONSCIOUSNESS_TEMPLATE_NAME, CONSCIOUSNESS_TEMPLATE);
  templateEngine.register(BRILLIANCE_TEMPLATE_NAME, BRILLIANCE_TEMPLATE);
  templateEngine.register(THOUGHT_FILTER_TEMPLATE_NAME, THOUGHT_FILTER_TEMPLATE);
}

/**
 * All builtin template names
 */
export const BUILTIN_TEMPLATES = [
  TICK_TEMPLATE_NAME,
  REFLECTION_TEMPLATE_NAME,
  DEEP_REFLECTION_TEMPLATE_NAME,
  CONSCIOUSNESS_TEMPLATE_NAME,
  BRILLIANCE_TEMPLATE_NAME,
  THOUGHT_FILTER_TEMPLATE_NAME,
] as const;
