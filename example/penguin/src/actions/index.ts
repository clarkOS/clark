/**
 * Actions module exports
 * @module actions
 */

export * from './types.js';
export * from './registry.js';
export * from './remark.js';
export * from './memory.js';
export * from './reflect.js';

// Re-export all built-in actions as a collection
import { remarkAction } from './remark.js';
import { storeMemoryAction, storeEmotionalMemoryAction } from './memory.js';
import { reflectAction, detectBrillianceAction } from './reflect.js';

export const builtinActions = [
  remarkAction,
  storeMemoryAction,
  storeEmotionalMemoryAction,
  reflectAction,
  detectBrillianceAction,
];
