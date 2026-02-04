/**
 * Convex backend implementation.
 * @module backend/convex
 */

import type {
  AgentState,
  Memory,
  Knowledge,
  Log,
  Painting,
} from '../core/types.js';
import type { Backend, BackendOptions } from './types.js';
import type { GetMemoriesOptions, SearchMemoriesOptions, MemoryStats } from '../memory/types.js';
import type { GetKnowledgeOptions } from '../knowledge/types.js';

/**
 * Convex backend - connects to a Convex deployment.
 */
export class ConvexBackend implements Backend {
  private baseUrl: string;
  private tickToken?: string;
  private writeToken?: string;

  constructor(options: BackendOptions) {
    if (!options.url) {
      throw new Error('Convex URL is required');
    }

    // Convert .convex.cloud to .convex.site for HTTP routes
    this.baseUrl = options.url.replace('.convex.cloud', '.convex.site');
    this.tickToken = options.tickToken;
    this.writeToken = options.writeToken;
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json() as Promise<T>;
  }

  private authHeaders(scope: 'tick' | 'write'): Record<string, string> {
    const token = scope === 'tick' ? this.tickToken : this.writeToken;
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }

  async getState(): Promise<AgentState> {
    const data = await this.fetch<Record<string, unknown>>('/state');

    return {
      mood: (data.mood as AgentState['mood']) ?? 'neutral',
      health: (data.health as number) ?? 100,
      routine: (data.routine as AgentState['routine']) ?? 'day',
      volatility: (data.volatility as number) ?? 0.05,
      counters: (data.counters as AgentState['counters']) ?? { ticks: 0, feeds: 0 },
      lastTick: (data.last_tick as string) ?? null,
      cryo: (data.cryo as boolean) ?? false,
    };
  }

  async getLogs(options: { limit?: number } = {}): Promise<Log[]> {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', String(options.limit));

    const data = await this.fetch<unknown[]>(`/logs?${params}`);

    return data.map((item) => {
      const d = item as Record<string, unknown>;
      return {
        id: d._id as string,
        ts: d.ts as string,
        summary: (d.summary as string) ?? '',
        detail: (d.detail as string) ?? '',
        mood: (d.mood as Log['mood']) ?? 'neutral',
        routine: (d.routine as Log['routine']) ?? 'day',
        volatility: (d.volatility as number) ?? 0,
        artifacts: (d.artifacts as unknown[]) ?? [],
        remark: d.remark as string | undefined,
        remarkTone: d.remark_tone as string | undefined,
      };
    });
  }

  async getMemories(options: GetMemoriesOptions = {}): Promise<Memory[]> {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', String(options.limit));
    if (options.type) params.set('type', options.type);
    if (options.scope) params.set('scope', options.scope);

    const data = await this.fetch<unknown[]>(`/memories?${params}`);

    return data.map((item) => {
      const d = item as Record<string, unknown>;
      return {
        id: d._id as string,
        content: (d.content as string) ?? '',
        type: (d.type as Memory['type']) ?? 'semantic',
        scope: (d.scope as Memory['scope']) ?? 'short_term',
        importance: (d.importance as number) ?? 0.5,
        salience: (d.salience as number) ?? 0.5,
        valence: (d.valence as number) ?? 0,
        confidence: (d.confidence as number) ?? 1,
        tags: (d.tags as string[]) ?? [],
        sourceType: (d.source_type as string) ?? 'unknown',
        sourceId: d.source_id as string | undefined,
        createdAt: (d.created_at as string) ?? new Date().toISOString(),
        accessedAt: d.accessed_at as string | undefined,
        accessCount: (d.access_count as number) ?? 0,
        unique: (d.unique as boolean) ?? true,
      };
    });
  }

  async storeMemory(memory: Omit<Memory, 'id'>, deduplicate = true): Promise<Memory> {
    const endpoint = deduplicate ? '/memories/store-dedup' : '/memories/store';

    const data = await this.fetch<Record<string, unknown>>(endpoint, {
      method: 'POST',
      headers: this.authHeaders('write'),
      body: JSON.stringify({
        content: memory.content,
        type: memory.type,
        sourceType: memory.sourceType,
        tags: memory.tags,
        sourceId: memory.sourceId,
      }),
    });

    return {
      ...memory,
      id: data.id as string,
    };
  }

  async getKnowledge(options: GetKnowledgeOptions = {}): Promise<Knowledge[]> {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', String(options.limit));

    const data = await this.fetch<unknown[]>(`/knowledge?${params}`);

    return data.map((item) => {
      const d = item as Record<string, unknown>;
      return {
        id: d._id as string,
        ts: (d.ts as string) ?? new Date().toISOString(),
        source: (d.source as string) ?? 'unknown',
        type: (d.type as string) ?? 'note',
        textExcerpt: (d.text_excerpt as string) ?? '',
        url: d.url as string | undefined,
        author: d.author as string | undefined,
      };
    });
  }

  async addKnowledge(knowledge: Omit<Knowledge, 'id'>): Promise<Knowledge> {
    const data = await this.fetch<Record<string, unknown>>('/knowledge', {
      method: 'POST',
      headers: this.authHeaders('write'),
      body: JSON.stringify({
        text: knowledge.textExcerpt,
        type: knowledge.type,
        url: knowledge.url,
        author: knowledge.author,
      }),
    });

    return {
      ...knowledge,
      id: data.id as string,
    };
  }

  async triggerTick(reason = 'sdk'): Promise<void> {
    await this.fetch('/tick', {
      method: 'POST',
      headers: this.authHeaders('tick'),
      body: JSON.stringify({ reason }),
    });
  }

  async health(): Promise<{ ok: boolean; [key: string]: unknown }> {
    return this.fetch('/health');
  }

  async getMemoryStats(): Promise<MemoryStats> {
    const data = await this.fetch<Record<string, unknown>>('/memories/stats');

    return {
      total: (data.totalMemories as number) ?? 0,
      byType: (data.byType as Record<Memory['type'], number>) ?? {
        episodic: 0,
        semantic: 0,
        procedural: 0,
      },
      byScope: (data.byScope as Record<Memory['scope'], number>) ?? {
        short_term: 0,
        working: 0,
        long_term: 0,
      },
      averageImportance: (data.averageImportance as number) ?? 0,
    };
  }

  async getPaintings(options: { limit?: number } = {}): Promise<Painting[]> {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', String(options.limit));

    try {
      const data = await this.fetch<unknown[]>(`/paintings?${params}`);

      return data.map((item) => {
        const d = item as Record<string, unknown>;
        return {
          id: d._id as string,
          ts: (d.ts as string) ?? new Date().toISOString(),
          imageUrl: d.image_url as string | undefined,
          prompt: d.prompt as string | undefined,
          style: d.style as string | undefined,
          mood: d.mood as Painting['mood'] | undefined,
          title: d.title as string | undefined,
        };
      });
    } catch {
      // Paintings endpoint may not exist
      return [];
    }
  }
}

/**
 * Create a Convex backend instance.
 */
export function createConvexBackend(options: BackendOptions): ConvexBackend {
  return new ConvexBackend(options);
}
