/**
 * Service Registry
 *
 * Manages service lifecycle and provides unified access to all services.
 */

import type {
  Service,
  ServiceType,
  ServiceRuntime,
  ServiceHealth,
  EnvironmentState,
  NewsItem,
  MarketData,
  SocialData,
} from './types.js';

/**
 * Service Registry - manages all services
 */
export class ServiceRegistry {
  private services = new Map<string, Service>();
  private runtime: ServiceRuntime | null = null;

  /**
   * Register a service
   */
  register(service: Service): void {
    if (this.services.has(service.name)) {
      console.warn(`Service "${service.name}" already registered, overwriting`);
    }
    this.services.set(service.name, service);
  }

  /**
   * Register multiple services
   */
  registerAll(services: Service[]): void {
    for (const service of services) {
      this.register(service);
    }
  }

  /**
   * Get a service by name
   */
  get<T extends Service>(name: string): T | undefined {
    return this.services.get(name) as T | undefined;
  }

  /**
   * Get all services of a specific type
   */
  getByType(type: ServiceType): Service[] {
    return [...this.services.values()].filter((s) => s.type === type);
  }

  /**
   * Get all registered services
   */
  getAll(): Service[] {
    return [...this.services.values()];
  }

  /**
   * Initialize all services with runtime
   */
  async initializeAll(runtime: ServiceRuntime): Promise<void> {
    this.runtime = runtime;

    const initPromises = [...this.services.values()].map(async (service) => {
      try {
        await service.initialize(runtime);
      } catch (error) {
        console.error(`Failed to initialize service "${service.name}":`, error);
      }
    });

    await Promise.all(initPromises);
  }

  /**
   * Start all services (or those with autoStart)
   */
  async startAll(autoStartOnly = false): Promise<void> {
    const startPromises = [...this.services.values()]
      .filter((service) => !autoStartOnly || service.config.autoStart !== false)
      .map(async (service) => {
        try {
          await service.start();
        } catch (error) {
          console.error(`Failed to start service "${service.name}":`, error);
        }
      });

    await Promise.all(startPromises);
  }

  /**
   * Stop all services
   */
  async stopAll(): Promise<void> {
    const stopPromises = [...this.services.values()].map(async (service) => {
      try {
        await service.stop();
      } catch (error) {
        console.error(`Failed to stop service "${service.name}":`, error);
      }
    });

    await Promise.all(stopPromises);
  }

  /**
   * Refresh all services
   */
  async refreshAll(): Promise<void> {
    const refreshPromises = [...this.services.values()]
      .filter((service) => service.status === 'running')
      .map(async (service) => {
        try {
          await service.refresh();
        } catch (error) {
          console.error(`Failed to refresh service "${service.name}":`, error);
        }
      });

    await Promise.all(refreshPromises);
  }

  /**
   * Get health status of all services
   */
  getHealthAll(): Map<string, ServiceHealth> {
    const health = new Map<string, ServiceHealth>();
    for (const [name, service] of this.services) {
      health.set(name, service.getHealth());
    }
    return health;
  }

  /**
   * Compute environment state from all services
   */
  async getEnvironmentState(): Promise<EnvironmentState> {
    // Get data from each service type
    const newsServices = this.getByType('news' as ServiceType);
    const marketServices = this.getByType('market' as ServiceType);
    const socialServices = this.getByType('social' as ServiceType);

    // Aggregate news
    let allNews: NewsItem[] = [];
    for (const service of newsServices) {
      try {
        const news = await service.getData<NewsItem[]>();
        if (Array.isArray(news)) {
          allNews = allNews.concat(news);
        }
      } catch {
        // Ignore errors
      }
    }

    // Aggregate market data
    let marketData: MarketData | null = null;
    for (const service of marketServices) {
      try {
        const data = await service.getData<MarketData>();
        if (data) {
          marketData = data;
          break; // Use first available
        }
      } catch {
        // Ignore errors
      }
    }

    // Aggregate social data
    let socialData: SocialData | null = null;
    for (const service of socialServices) {
      try {
        const data = await service.getData<SocialData>();
        if (data) {
          socialData = data;
          break; // Use first available
        }
      } catch {
        // Ignore errors
      }
    }

    // Compute environment state
    const newsIntensity = Math.min(1, allNews.length / 20);
    const marketVolatility = marketData?.volatilityIndex ?? 0.3;
    const socialActivity = socialData
      ? Math.min(1, socialData.engagement.total / 100)
      : 0;
    const marketSentiment = marketData?.overall ?? 'neutral';

    // Extract trending topics from news
    const topicCounts = new Map<string, number>();
    for (const item of allNews) {
      for (const topic of item.topics ?? []) {
        topicCounts.set(topic, (topicCounts.get(topic) ?? 0) + 1);
      }
    }
    const trendingTopics = [...topicCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);

    return {
      newsIntensity,
      marketVolatility,
      socialActivity,
      marketSentiment,
      trendingTopics,
    };
  }

  /**
   * Clear all services
   */
  clear(): void {
    this.services.clear();
    this.runtime = null;
  }
}

/**
 * Default global service registry
 */
export const serviceRegistry = new ServiceRegistry();
