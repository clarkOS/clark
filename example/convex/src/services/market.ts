/**
 * Market Service
 *
 * Fetches and caches market data from crypto/stock APIs.
 * Provides price data, sentiment analysis, and volatility metrics.
 */

import type {
  Service,
  ServiceType,
  ServiceStatus,
  ServiceConfig,
  ServiceRuntime,
  ServiceHealth,
  MarketData,
  MarketAsset,
  MarketSentiment,
} from './types.js';

/**
 * Default assets to track
 */
const DEFAULT_ASSETS = ['bitcoin', 'ethereum', 'solana'];

/**
 * Market Service implementation
 */
export class MarketService implements Service {
  name = 'market';
  type: ServiceType = 'market' as ServiceType;
  status: ServiceStatus = 'stopped';
  config: ServiceConfig;

  private runtime: ServiceRuntime | null = null;
  private cache: MarketData | null = null;
  private lastRefresh: number | null = null;
  private lastError: string | null = null;
  private refreshCount = 0;
  private errorCount = 0;
  private interval: ReturnType<typeof setInterval> | null = null;
  private assets: string[];
  private priceHistory: Map<string, number[]> = new Map();

  constructor(config: Partial<ServiceConfig> = {}) {
    this.config = {
      refreshInterval: 4 * 60 * 1000, // 4 minutes
      maxCacheAge: 10 * 60 * 1000, // 10 minutes
      autoStart: true,
      ...config,
    };
    this.assets = (config.options?.assets as string[]) ?? DEFAULT_ASSETS;
  }

  async initialize(runtime: ServiceRuntime): Promise<void> {
    this.runtime = runtime;

    // Override assets from runtime config if provided
    const configAssets = runtime.config?.marketAssets as string[] | undefined;
    if (configAssets) {
      this.assets = configAssets;
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

  async getData<T = MarketData>(): Promise<T> {
    // Check cache age
    if (this.lastRefresh && this.config.maxCacheAge) {
      const age = Date.now() - this.lastRefresh;
      if (age > this.config.maxCacheAge) {
        // Cache is stale, trigger background refresh
        this.refresh().catch(console.error);
      }
    }

    return (this.cache ?? this.getDefaultData()) as T;
  }

  async refresh(): Promise<void> {
    try {
      const assets = await this.fetchMarketData();

      // Update price history for volatility calculation
      for (const asset of assets) {
        const history = this.priceHistory.get(asset.symbol) ?? [];
        history.push(asset.price);
        // Keep last 100 prices
        if (history.length > 100) history.shift();
        this.priceHistory.set(asset.symbol, history);
      }

      // Calculate overall sentiment
      const overall = this.calculateSentiment(assets);

      // Calculate volatility index
      const volatilityIndex = this.calculateVolatilityIndex(assets);

      this.cache = {
        timestamp: Date.now(),
        assets,
        overall,
        volatilityIndex,
      };

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
      cacheSize: this.cache ? this.cache.assets.length : 0,
    };
  }

  /**
   * Fetch market data from API
   * Override this method or provide a fetcher in config to enable real data
   */
  private async fetchMarketData(): Promise<MarketAsset[]> {
    // Check if custom fetcher provided
    const fetcher = this.config.options?.fetcher as ((assets: string[]) => Promise<MarketAsset[]>) | undefined;
    if (fetcher) {
      return fetcher(this.assets);
    }

    // No data source configured - return empty
    // Real implementation should use Convex action to call CoinGecko/etc.
    console.warn('[MarketService] No data fetcher configured, returning empty data');
    return [];
  }

  /**
   * Calculate overall market sentiment
   */
  private calculateSentiment(assets: MarketAsset[]): MarketSentiment {
    if (assets.length === 0) return 'neutral';

    const avgChange = assets.reduce((sum, a) => sum + a.changePercent24h, 0) / assets.length;
    const volatility = this.calculateVolatilityIndex(assets);

    if (volatility > 0.7) return 'volatile';
    if (avgChange > 3) return 'bullish';
    if (avgChange < -3) return 'bearish';
    return 'neutral';
  }

  /**
   * Calculate volatility index (0-1)
   */
  private calculateVolatilityIndex(assets: MarketAsset[]): number {
    if (assets.length === 0) return 0;

    // Use absolute change percentages
    const absChanges = assets.map((a) => Math.abs(a.changePercent24h));
    const avgAbsChange = absChanges.reduce((sum, c) => sum + c, 0) / absChanges.length;

    // Normalize to 0-1 (10% absolute change = 1.0)
    return Math.min(1, avgAbsChange / 10);
  }

  /**
   * Get default data when cache is empty
   */
  private getDefaultData(): MarketData {
    return {
      timestamp: Date.now(),
      assets: [],
      overall: 'neutral',
      volatilityIndex: 0,
    };
  }
}

/**
 * Create a market service with custom configuration
 */
export function createMarketService(config?: Partial<ServiceConfig>): MarketService {
  return new MarketService(config);
}
