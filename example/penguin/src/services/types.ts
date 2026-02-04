/**
 * Service Layer Types
 *
 * Services are background processes that gather data independently of the tick cycle.
 * They cache data and provide it to providers during tick execution.
 */

/**
 * Service type categories
 */
export enum ServiceType {
  NEWS = 'news',
  MARKET = 'market',
  SOCIAL = 'social',
  CALENDAR = 'calendar',
  WALLET = 'wallet',
  STORAGE = 'storage',
  CUSTOM = 'custom',
}

/**
 * Service status
 */
export type ServiceStatus = 'stopped' | 'starting' | 'running' | 'error';

/**
 * Service configuration
 */
export interface ServiceConfig {
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  /** Maximum cache age in milliseconds */
  maxCacheAge?: number;
  /** Whether to start automatically */
  autoStart?: boolean;
  /** Custom configuration options */
  options?: Record<string, unknown>;
}

/**
 * Service runtime interface (subset of AgentRuntime)
 */
export interface ServiceRuntime {
  agentId: string;
  config: Record<string, unknown>;
  useModel?(type: string, params: { prompt: string }): Promise<{ content: string }>;
}

/**
 * Base service interface
 */
export interface Service {
  /** Unique service name */
  name: string;

  /** Service type category */
  type: ServiceType;

  /** Current status */
  status: ServiceStatus;

  /** Configuration */
  config: ServiceConfig;

  /**
   * Initialize the service with runtime context
   * Called once before start
   */
  initialize(runtime: ServiceRuntime): Promise<void>;

  /**
   * Start the service
   * Begins data fetching/caching
   */
  start(): Promise<void>;

  /**
   * Stop the service
   * Cleanup and stop refreshing
   */
  stop(): Promise<void>;

  /**
   * Get current cached data
   * Returns immediately with cached data
   */
  getData<T = unknown>(): Promise<T>;

  /**
   * Force refresh data
   * Bypasses cache and fetches fresh data
   */
  refresh(): Promise<void>;

  /**
   * Get service health/stats
   */
  getHealth(): ServiceHealth;
}

/**
 * Service health information
 */
export interface ServiceHealth {
  status: ServiceStatus;
  lastRefresh: number | null;
  lastError: string | null;
  refreshCount: number;
  errorCount: number;
  cacheSize: number;
}

/**
 * News item from news service
 */
export interface NewsItem {
  id: string;
  headline: string;
  summary?: string;
  source: string;
  url?: string;
  publishedAt: number;
  importance?: number;
  sentiment?: number;
  topics?: string[];
}

/**
 * Market data from market service
 */
export interface MarketData {
  timestamp: number;
  assets: MarketAsset[];
  overall: MarketSentiment;
  volatilityIndex?: number;
}

/**
 * Individual asset data
 */
export interface MarketAsset {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h?: number;
  marketCap?: number;
}

/**
 * Market sentiment
 */
export type MarketSentiment = 'bullish' | 'bearish' | 'neutral' | 'volatile';

/**
 * Social data from social service
 */
export interface SocialData {
  mentions: SocialMention[];
  engagement: {
    total: number;
    positive: number;
    negative: number;
    neutral: number;
  };
  trending: string[];
}

/**
 * Social mention
 */
export interface SocialMention {
  id: string;
  platform: string;
  author: string;
  content: string;
  timestamp: number;
  sentiment?: number;
  engagement?: number;
}

/**
 * Environment state computed from all services
 */
export interface EnvironmentState {
  /** News activity level 0-1 */
  newsIntensity: number;
  /** Market turbulence 0-1 */
  marketVolatility: number;
  /** Social engagement 0-1 */
  socialActivity: number;
  /** Overall market sentiment */
  marketSentiment: MarketSentiment;
  /** Dominant news topics */
  trendingTopics: string[];
}
