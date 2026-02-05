/**
 * Convex Agent Framework
 *
 * A serverless autonomous agent framework powered by Convex.
 *
 * @example
 * ```ts
 * import { Agent, ConvexBackend } from '@convex-agent/core';
 *
 * const agent = new Agent({
 *   backend: new ConvexBackend({ url: process.env.CONVEX_URL }),
 * });
 *
 * await agent.tick();
 * ```
 *
 * @module
 */

// Core exports
export {
  Agent,
  createAgent,
  type AgentOptions,
} from './core/agent.js';

export type {
  AgentConfig,
  BackendConfig,
  TickConfig,
  MemoryConfig,
} from './core/config.js';

export {
  createConfig,
  loadConfigFromEnv,
  validateConfig,
} from './core/config.js';

export {
  executeTick,
  createTickRunner,
  calculateRoutine,
  calculateHealthDrift,
} from './core/tick.js';

export type {
  AgentState,
  Memory,
  Knowledge,
  Log,
  MemoryType,
  MemoryScope,
  Mood,
  Routine,
  TickContext,
  TickResult,
} from './core/types.js';

// Memory exports
export {
  createMemoryStore,
  type MemoryStore,
} from './memory/store.js';

export type {
  StoreMemoryOptions,
  GetMemoriesOptions,
  SearchMemoriesOptions,
  MemoryStats,
} from './memory/types.js';

// Knowledge exports
export {
  createKnowledgeStore,
  type KnowledgeStore,
} from './knowledge/store.js';

export type {
  AddKnowledgeOptions,
  GetKnowledgeOptions,
  SearchKnowledgeOptions,
  KnowledgeStats,
} from './knowledge/types.js';

// Plugin exports
export {
  definePlugin,
  loadPlugin,
  validatePlugin,
  sortPluginsByDependencies,
} from './plugins/loader.js';

export type {
  Plugin,
  ActionHandler,
  PluginMeta,
  PluginLoadResult,
} from './plugins/types.js';

// Backend exports
export {
  ConvexBackend,
  createConvexBackend,
} from './backend/convex.js';

export {
  MemoryBackend,
  createMemoryBackend,
} from './backend/memory.js';

export type {
  Backend,
  BackendOptions,
} from './backend/types.js';

// Character exports
export type {
  Character,
  CharacterContext,
  CharacterIdentity,
  CharacterPersonality,
  Trait,
  SituationalTrait,
  Routine as CharacterRoutine,
  HealthModifier,
  VolatilityStyle,
} from './character/index.js';

export {
  loadCharacter,
  validateCharacter,
  buildCharacterContext,
  getCurrentRoutine,
  getActiveTraits,
  getTrait,
  getTraitPhrase,
  checkProhibitions,
} from './character/index.js';

// Action system exports
export type {
  Action,
  ActionResult,
  ActionVisual,
  ActionExample,
  ActionRuntime,
} from './actions/index.js';

export {
  ActionRegistry,
  remarkAction,
  storeMemoryAction,
  storeEmotionalMemoryAction,
  reflectAction,
  detectBrillianceAction,
  builtinActions,
} from './actions/index.js';

// Template engine exports
export {
  TemplateEngine,
  TICK_TEMPLATE,
  REFLECTION_TEMPLATE,
  DEEP_REFLECTION_TEMPLATE,
  CONSCIOUSNESS_TEMPLATE,
  BRILLIANCE_TEMPLATE,
} from './templates/index.js';

// Service layer exports
export type {
  Service,
  ServiceType,
  ServiceStatus,
  ServiceConfig,
  ServiceRuntime,
  ServiceHealth,
  NewsItem,
  MarketData,
  MarketAsset,
  MarketSentiment,
} from './services/index.js';

export {
  ServiceRegistry,
  NewsService,
  MarketService,
  createNewsService,
  createMarketService,
  createBuiltinServices,
} from './services/index.js';

// UI exports (for building custom CLIs)
export { App } from './ui/App.js';
export { useAgent } from './ui/hooks/useAgent.js';
export {
  Header,
  StatusPanel,
  LogsPanel,
  MemoryPanel,
  KnowledgePanel,
} from './ui/components/index.js';
