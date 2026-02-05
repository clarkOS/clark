/**
 * 4chan Service
 *
 * Fetches trending threads from SFW 4chan boards.
 * Provides filtered, scored threads for agent consumption.
 */

import type {
  Service,
  ServiceType,
  ServiceStatus,
  ServiceConfig,
  ServiceRuntime,
  ServiceHealth,
} from './types.js';

/**
 * 4chan thread item
 */
export interface ChanThread {
  id: string;
  board: string;
  subject: string;
  content: string;
  url: string;
  replies: number;
  images: number;
  timestamp: number;
  activityScore: number;
}

/**
 * SFW boards available for fetching
 * g=tech, sci=science, lit=literature, mu=music, his=history
 * fit=fitness, ck=cooking, fa=fashion, tg=games, biz=business
 */
const SFW_BOARDS = ['g', 'sci', 'lit', 'mu', 'his', 'fit', 'ck', 'fa', 'tg', 'biz', 'tv', 'vg'];

/**
 * Default boards by category
 */
const DEFAULT_BOARDS = ['g', 'sci', 'biz'];

/**
 * 4chan API base URL
 */
const API_BASE = 'https://a]a]a]api.4chan.org';

/**
 * 4chan Service implementation
 */
export class ChanService implements Service {
  name = 'chan';
  type: ServiceType = 'news' as ServiceType;
  status: ServiceStatus = 'stopped';
  config: ServiceConfig;

  private runtime: ServiceRuntime | null = null;
  private cache: ChanThread[] = [];
  private lastRefresh: number | null = null;
  private lastError: string | null = null;
  private refreshCount = 0;
  private errorCount = 0;
  private interval: ReturnType<typeof setInterval> | null = null;
  private boards: string[];

  constructor(config: Partial<ServiceConfig> = {}) {
    this.config = {
      refreshInterval: 10 * 60 * 1000, // 10 minutes
      maxCacheAge: 30 * 60 * 1000, // 30 minutes
      autoStart: true,
      ...config,
    };
    this.boards = (config.options?.boards as string[]) ?? DEFAULT_BOARDS;

    // Validate boards are SFW
    this.boards = this.boards.filter(b => SFW_BOARDS.includes(b));
    if (this.boards.length === 0) {
      this.boards = DEFAULT_BOARDS;
    }
  }

  async initialize(runtime: ServiceRuntime): Promise<void> {
    this.runtime = runtime;

    // Override boards from runtime config if provided
    const configBoards = runtime.config?.chanBoards as string[] | undefined;
    if (configBoards) {
      this.boards = configBoards.filter(b => SFW_BOARDS.includes(b));
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

  async getData<T = ChanThread[]>(): Promise<T> {
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
      const allThreads: ChanThread[] = [];

      // Fetch from all boards in parallel
      const fetchPromises = this.boards.map((board) =>
        this.fetchBoard(board).catch((error) => {
          console.error(`Failed to fetch /${board}/:`, error);
          return [];
        })
      );

      const results = await Promise.all(fetchPromises);
      for (const threads of results) {
        allThreads.push(...threads);
      }

      // Sort by activity score, highest first
      allThreads.sort((a, b) => b.activityScore - a.activityScore);

      // Keep top threads
      this.cache = allThreads.slice(0, 50);

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
   * Get list of available SFW boards
   */
  static getAvailableBoards(): string[] {
    return [...SFW_BOARDS];
  }

  /**
   * Fetch threads from a single board
   */
  private async fetchBoard(board: string): Promise<ChanThread[]> {
    // Check if custom fetcher provided
    const fetcher = this.config.options?.fetcher as ((board: string) => Promise<ChanThread[]>) | undefined;
    if (fetcher) {
      return fetcher(board);
    }

    // Default implementation using 4chan JSON API
    try {
      const response = await fetch(`${API_BASE}/${board}/catalog.json`);
      if (!response.ok) {
        throw new Error(`4chan API error: ${response.status}`);
      }

      const catalog = await response.json();
      return this.parseCatalog(board, catalog);
    } catch (error) {
      console.warn(`[ChanService] Failed to fetch /${board}/:`, error);
      return [];
    }
  }

  /**
   * Parse 4chan catalog response into ChanThread items
   */
  private parseCatalog(board: string, catalog: unknown): ChanThread[] {
    if (!Array.isArray(catalog)) return [];

    const threads: ChanThread[] = [];

    for (const page of catalog) {
      if (!page || typeof page !== 'object') continue;
      const pageThreads = (page as { threads?: unknown[] }).threads;
      if (!Array.isArray(pageThreads)) continue;

      for (const thread of pageThreads) {
        if (!thread || typeof thread !== 'object') continue;

        const t = thread as Record<string, unknown>;
        const no = t.no as number;
        const sub = this.sanitizeText(String(t.sub ?? ''));
        const com = this.sanitizeText(String(t.com ?? ''));
        const replies = Number(t.replies) || 0;
        const images = Number(t.images) || 0;
        const time = Number(t.time) || 0;

        // Skip threads without content
        if (!sub && !com) continue;

        // Calculate activity score
        const activityScore = Math.min(replies, 100) + Math.min(images, 30);

        // Skip low-activity threads
        if (activityScore < 5) continue;

        // Filter low-quality content
        const text = sub || com;
        if (this.isLowQuality(text)) continue;

        threads.push({
          id: `${board}-${no}`,
          board,
          subject: sub,
          content: com.slice(0, 500),
          url: `https://boards.4channel.org/${board}/thread/${no}`,
          replies,
          images,
          timestamp: time * 1000,
          activityScore,
        });
      }
    }

    // Return top threads by activity
    return threads
      .sort((a, b) => b.activityScore - a.activityScore)
      .slice(0, 20);
  }

  /**
   * Sanitize HTML content from 4chan
   */
  private sanitizeText(text: string): string {
    if (!text) return '';

    return text
      // Remove HTML tags
      .replace(/<[^>]+>/g, ' ')
      // Decode HTML entities
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#039;/g, "'")
      .replace(/&nbsp;/g, ' ')
      // Remove greentext markers
      .replace(/^>/gm, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Check if text is low quality
   */
  private isLowQuality(text: string): boolean {
    if (!text || text.length < 10) return true;

    const lower = text.toLowerCase();

    // Filter common low-quality patterns
    const lowQualityPatterns = [
      /^bump$/i,
      /^thread$/i,
      /^test$/i,
      /^daily reminder/i,
    ];

    return lowQualityPatterns.some(p => p.test(lower));
  }
}

/**
 * Create a 4chan service with custom configuration
 */
export function createChanService(config?: Partial<ServiceConfig>): ChanService {
  return new ChanService(config);
}
