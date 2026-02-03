/**
 * News Service
 *
 * Fetches and caches news from multiple sources.
 * Provides filtered, deduplicated news items for agent consumption.
 */

import type {
  Service,
  ServiceType,
  ServiceStatus,
  ServiceConfig,
  ServiceRuntime,
  ServiceHealth,
  NewsItem,
} from './types.js';

/**
 * News source configuration
 */
interface NewsSource {
  name: string;
  url: string;
  parser: 'rss' | 'json' | 'html';
  category?: string;
}

/**
 * Default news sources
 */
const DEFAULT_SOURCES: NewsSource[] = [
  { name: 'bbc', url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', parser: 'rss', category: 'tech' },
  { name: 'coindesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/', parser: 'rss', category: 'crypto' },
  { name: 'techcrunch', url: 'https://techcrunch.com/feed/', parser: 'rss', category: 'tech' },
];

/**
 * News Service implementation
 */
export class NewsService implements Service {
  name = 'news';
  type: ServiceType = 'news' as ServiceType;
  status: ServiceStatus = 'stopped';
  config: ServiceConfig;

  private runtime: ServiceRuntime | null = null;
  private cache: NewsItem[] = [];
  private lastRefresh: number | null = null;
  private lastError: string | null = null;
  private refreshCount = 0;
  private errorCount = 0;
  private interval: ReturnType<typeof setInterval> | null = null;
  private sources: NewsSource[];

  constructor(config: Partial<ServiceConfig> = {}) {
    this.config = {
      refreshInterval: 5 * 60 * 1000, // 5 minutes
      maxCacheAge: 30 * 60 * 1000, // 30 minutes
      autoStart: true,
      ...config,
    };
    this.sources = (config.options?.sources as NewsSource[]) ?? DEFAULT_SOURCES;
  }

  async initialize(runtime: ServiceRuntime): Promise<void> {
    this.runtime = runtime;

    // Override sources from runtime config if provided
    const configSources = runtime.config?.newsSources as NewsSource[] | undefined;
    if (configSources) {
      this.sources = configSources;
    }
  }

  async start(): Promise<void> {
    if (this.status === 'running') return;

    this.status = 'starting';

    try {
      // Initial fetch
      await this.refresh();

      // Start refresh interval
      if (this.config.refreshInterval) {
        this.interval = setInterval(
          () => this.refresh().catch(console.error),
          this.config.refreshInterval
        );
      }

      this.status = 'running';
    } catch (error) {
      this.status = 'error';
      this.lastError = error instanceof Error ? error.message : 'Failed to start';
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.status = 'stopped';
  }

  async getData<T = NewsItem[]>(): Promise<T> {
    // Check cache age
    if (this.lastRefresh && this.config.maxCacheAge) {
      const age = Date.now() - this.lastRefresh;
      if (age > this.config.maxCacheAge) {
        // Cache is stale, trigger background refresh
        this.refresh().catch(console.error);
      }
    }

    return this.cache as T;
  }

  async refresh(): Promise<void> {
    try {
      const allItems: NewsItem[] = [];

      // Fetch from all sources in parallel
      const fetchPromises = this.sources.map((source) =>
        this.fetchFromSource(source).catch((error) => {
          console.error(`Failed to fetch from ${source.name}:`, error);
          return [];
        })
      );

      const results = await Promise.all(fetchPromises);
      for (const items of results) {
        allItems.push(...items);
      }

      // Sort by date, newest first
      allItems.sort((a, b) => b.publishedAt - a.publishedAt);

      // Deduplicate by headline similarity
      const deduplicated = this.deduplicateNews(allItems);

      // Keep only recent items (last 24 hours)
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      this.cache = deduplicated
        .filter((item) => item.publishedAt > oneDayAgo)
        .slice(0, 50); // Max 50 items

      this.lastRefresh = Date.now();
      this.refreshCount++;
      this.lastError = null;
    } catch (error) {
      this.errorCount++;
      this.lastError = error instanceof Error ? error.message : 'Refresh failed';
      throw error;
    }
  }

  getHealth(): ServiceHealth {
    return {
      status: this.status,
      lastRefresh: this.lastRefresh,
      lastError: this.lastError,
      refreshCount: this.refreshCount,
      errorCount: this.errorCount,
      cacheSize: this.cache.length,
    };
  }

  /**
   * Fetch news from a single source
   * Override this method or provide a fetcher in config to enable real data
   */
  private async fetchFromSource(source: NewsSource): Promise<NewsItem[]> {
    // Check if custom fetcher provided
    const fetcher = this.config.options?.fetcher as ((source: NewsSource) => Promise<NewsItem[]>) | undefined;
    if (fetcher) {
      return fetcher(source);
    }

    // No data source configured - return empty
    // Real implementation should use Convex action to fetch RSS/JSON
    return [];
  }

  /**
   * Deduplicate news by headline similarity
   */
  private deduplicateNews(items: NewsItem[]): NewsItem[] {
    const seen = new Set<string>();
    const result: NewsItem[] = [];

    for (const item of items) {
      // Normalize headline for comparison
      const normalized = item.headline
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .sort()
        .join(' ');

      // Check for similar headlines
      let isDuplicate = false;
      for (const seenNorm of seen) {
        if (this.jaccardSimilarity(normalized, seenNorm) > 0.7) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        seen.add(normalized);
        result.push(item);
      }
    }

    return result;
  }

  /**
   * Calculate Jaccard similarity between two strings
   */
  private jaccardSimilarity(a: string, b: string): number {
    const setA = new Set(a.split(' '));
    const setB = new Set(b.split(' '));

    const intersection = new Set([...setA].filter((x) => setB.has(x)));
    const union = new Set([...setA, ...setB]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }
}

/**
 * Create a news service with custom configuration
 */
export function createNewsService(config?: Partial<ServiceConfig>): NewsService {
  return new NewsService(config);
}
