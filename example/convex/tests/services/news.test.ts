/**
 * Tests for News Service.
 * @module tests/services/news
 */

import { NewsService, createNewsService } from '../../src/services/news.js';
import type { NewsItem, ServiceRuntime } from '../../src/services/types.js';

// Helper to create mock news items
function createMockNewsItem(overrides: Partial<NewsItem> = {}): NewsItem {
  return {
    id: `news_${Math.random().toString(36).slice(2)}`,
    source: 'test-source',
    headline: 'Test headline',
    summary: 'Test summary',
    url: 'https://example.com/news',
    publishedAt: Date.now(),
    category: 'tech',
    ...overrides,
  };
}

describe('NewsService', () => {
  let service: NewsService;

  beforeEach(() => {
    service = new NewsService();
  });

  afterEach(async () => {
    await service.stop();
  });

  describe('constructor', () => {
    it('has default configuration', () => {
      expect(service.name).toBe('news');
      expect(service.type).toBe('news');
      expect(service.status).toBe('stopped');
      expect(service.config.refreshInterval).toBe(5 * 60 * 1000);
      expect(service.config.maxCacheAge).toBe(30 * 60 * 1000);
    });

    it('accepts custom configuration', () => {
      const customService = new NewsService({
        refreshInterval: 60000,
        maxCacheAge: 120000,
      });

      expect(customService.config.refreshInterval).toBe(60000);
      expect(customService.config.maxCacheAge).toBe(120000);
    });
  });

  describe('initialize', () => {
    it('stores runtime reference', async () => {
      const runtime: ServiceRuntime = {
        config: {},
        memory: {} as any,
        knowledge: {} as any,
      };

      await service.initialize(runtime);
      // No explicit assertion - just verifying it doesn't throw
    });

    it('allows override of sources from runtime config', async () => {
      const customSources = [
        { name: 'custom', url: 'https://custom.com/feed', parser: 'rss' as const },
      ];

      const runtime: ServiceRuntime = {
        config: { newsSources: customSources },
        memory: {} as any,
        knowledge: {} as any,
      };

      await service.initialize(runtime);
      // Service should use custom sources
    });
  });

  describe('start/stop lifecycle', () => {
    it('starts successfully', async () => {
      await service.start();
      expect(service.status).toBe('running');
    });

    it('handles starting when already running', async () => {
      await service.start();
      await service.start(); // Should not throw
      expect(service.status).toBe('running');
    });

    it('stops successfully', async () => {
      await service.start();
      await service.stop();
      expect(service.status).toBe('stopped');
    });

    it('can restart after stop', async () => {
      await service.start();
      await service.stop();
      await service.start();
      expect(service.status).toBe('running');
    });
  });

  describe('getData', () => {
    it('returns empty array initially', async () => {
      const data = await service.getData<NewsItem[]>();
      expect(data).toEqual([]);
    });

    it('returns cached news items', async () => {
      // Use a custom fetcher to inject test data
      const mockItems = [
        createMockNewsItem({ headline: 'News 1' }),
        createMockNewsItem({ headline: 'News 2' }),
      ];

      const serviceWithFetcher = new NewsService({
        options: {
          fetcher: async () => mockItems,
        },
      });

      await serviceWithFetcher.start();
      const data = await serviceWithFetcher.getData<NewsItem[]>();

      expect(data.length).toBe(2);
      await serviceWithFetcher.stop();
    });
  });

  describe('refresh', () => {
    it('updates cache with new items', async () => {
      const mockItems = [createMockNewsItem()];

      const serviceWithFetcher = new NewsService({
        options: {
          fetcher: async () => mockItems,
        },
      });

      await serviceWithFetcher.refresh();
      const health = serviceWithFetcher.getHealth();

      expect(health.refreshCount).toBe(1);
      expect(health.lastRefresh).toBeDefined();
      expect(health.cacheSize).toBeGreaterThan(0);
    });

    it('deduplicates similar headlines', async () => {
      const mockItems = [
        createMockNewsItem({ headline: 'Breaking News: Big Event Happens' }),
        createMockNewsItem({ headline: 'Breaking News: Big Event Happens Today' }), // Similar
        createMockNewsItem({ headline: 'Completely Different Story' }),
      ];

      const serviceWithFetcher = new NewsService({
        options: {
          fetcher: async () => mockItems,
        },
      });

      await serviceWithFetcher.refresh();
      const data = await serviceWithFetcher.getData<NewsItem[]>();

      // Should deduplicate similar headlines
      expect(data.length).toBeLessThan(3);
    });

    it('sorts by date newest first', async () => {
      const now = Date.now();
      const mockItems = [
        createMockNewsItem({ headline: 'Oldest', publishedAt: now - 3000 }),
        createMockNewsItem({ headline: 'Newest', publishedAt: now }),
        createMockNewsItem({ headline: 'Middle', publishedAt: now - 1500 }),
      ];

      const serviceWithFetcher = new NewsService({
        options: {
          fetcher: async () => mockItems,
        },
      });

      await serviceWithFetcher.refresh();
      const data = await serviceWithFetcher.getData<NewsItem[]>();

      expect(data[0].headline).toBe('Newest');
      expect(data[data.length - 1].headline).toBe('Oldest');
    });

    it('filters out old items (>24 hours)', async () => {
      const now = Date.now();
      const twoDaysAgo = now - 48 * 60 * 60 * 1000;

      const mockItems = [
        createMockNewsItem({ headline: 'Recent', publishedAt: now }),
        createMockNewsItem({ headline: 'Old', publishedAt: twoDaysAgo }),
      ];

      const serviceWithFetcher = new NewsService({
        options: {
          fetcher: async () => mockItems,
        },
      });

      await serviceWithFetcher.refresh();
      const data = await serviceWithFetcher.getData<NewsItem[]>();

      expect(data.some((item) => item.headline === 'Recent')).toBe(true);
      expect(data.some((item) => item.headline === 'Old')).toBe(false);
    });

    it('limits cache to 50 items', async () => {
      const mockItems = Array.from({ length: 100 }, (_, i) =>
        createMockNewsItem({ headline: `News ${i}`, publishedAt: Date.now() - i * 1000 })
      );

      const serviceWithFetcher = new NewsService({
        options: {
          fetcher: async () => mockItems,
        },
      });

      await serviceWithFetcher.refresh();
      const data = await serviceWithFetcher.getData<NewsItem[]>();

      expect(data.length).toBeLessThanOrEqual(50);
    });

    it('handles fetch errors gracefully', async () => {
      // NewsService catches individual source errors and continues
      // Only full failures increment error count
      let callCount = 0;
      const serviceWithPartialFailure = new NewsService({
        options: {
          sources: [{ name: 'test', url: 'http://test.com', parser: 'rss' as const }],
          fetcher: async () => {
            callCount++;
            throw new Error('Network error');
          },
        },
      });

      // Should NOT throw - service catches source-level errors
      await serviceWithPartialFailure.refresh();
      const health = serviceWithPartialFailure.getHealth();

      // Error was logged but service continued
      expect(callCount).toBe(1);
      expect(health.cacheSize).toBe(0); // No items fetched
    });
  });

  describe('getHealth', () => {
    it('returns health information', () => {
      const health = service.getHealth();

      expect(health.status).toBe('stopped');
      expect(health.refreshCount).toBe(0);
      expect(health.errorCount).toBe(0);
      expect(health.cacheSize).toBe(0);
      expect(health.lastRefresh).toBeNull();
      expect(health.lastError).toBeNull();
    });

    it('tracks refresh count', async () => {
      const serviceWithFetcher = new NewsService({
        options: { fetcher: async () => [] },
      });

      await serviceWithFetcher.refresh();
      await serviceWithFetcher.refresh();
      await serviceWithFetcher.refresh();

      const health = serviceWithFetcher.getHealth();
      expect(health.refreshCount).toBe(3);
    });

    it('tracks refresh count even when no items fetched', async () => {
      // NewsService catches individual source errors
      // But still completes refresh successfully (with empty cache)
      const serviceWithEmptyFetcher = new NewsService({
        options: {
          sources: [{ name: 'test', url: 'http://test.com', parser: 'rss' as const }],
          fetcher: async () => [], // Returns empty - no error
        },
      });

      await serviceWithEmptyFetcher.refresh();
      await serviceWithEmptyFetcher.refresh();

      const health = serviceWithEmptyFetcher.getHealth();
      expect(health.refreshCount).toBe(2);
      expect(health.errorCount).toBe(0); // No errors since we didn't throw
    });
  });
});

describe('createNewsService', () => {
  it('creates a NewsService instance', () => {
    const service = createNewsService();
    expect(service).toBeInstanceOf(NewsService);
  });

  it('passes configuration through', () => {
    const service = createNewsService({ refreshInterval: 30000 });
    expect(service.config.refreshInterval).toBe(30000);
  });
});
