/**
 * Services module exports
 * @module services
 */

export * from './types.js';
export * from './registry.js';
export { NewsService, createNewsService } from './news.js';
export { MarketService, createMarketService } from './market.js';
export { ChanService, createChanService, type ChanThread } from './chan.js';

// Re-export built-in services as factories
import { createNewsService } from './news.js';
import { createMarketService } from './market.js';
import { createChanService } from './chan.js';

/**
 * Create all built-in services with default configuration
 */
export function createBuiltinServices() {
  return [
    createNewsService(),
    createMarketService(),
    createChanService(),
  ];
}
