/**
 * Tests for in-memory backend.
 * @module tests/backend/memory
 */

import { MemoryBackend, createMemoryBackend } from '../../src/backend/memory.js';
import type { Memory, Knowledge, AgentState } from '../../src/core/types.js';

describe('MemoryBackend', () => {
  let backend: MemoryBackend;

  beforeEach(() => {
    backend = new MemoryBackend();
  });

  describe('getState', () => {
    it('returns initial state', async () => {
      const state = await backend.getState();

      expect(state.mood).toBe('neutral');
      expect(state.health).toBe(100);
      expect(state.routine).toBe('day');
      expect(state.volatility).toBe(0.05);
      expect(state.counters.ticks).toBe(0);
      expect(state.counters.feeds).toBe(0);
      expect(state.lastTick).toBeNull();
      expect(state.cryo).toBe(false);
    });

    it('returns a copy (not reference)', async () => {
      const state1 = await backend.getState();
      const state2 = await backend.getState();

      state1.health = 50;
      expect(state2.health).toBe(100);
    });
  });

  describe('commitTick', () => {
    it('updates state', async () => {
      const newState: AgentState = {
        mood: 'expressive',
        health: 80,
        routine: 'evening',
        volatility: 0.2,
        counters: { ticks: 1, feeds: 5 },
        lastTick: new Date().toISOString(),
        cryo: false,
      };

      await backend.commitTick(newState);
      const state = await backend.getState();

      expect(state.mood).toBe('expressive');
      expect(state.health).toBe(80);
      expect(state.routine).toBe('evening');
      expect(state.counters.ticks).toBe(1);
    });

    it('creates a log entry', async () => {
      const newState: AgentState = {
        mood: 'curious',
        health: 75,
        routine: 'morning',
        volatility: 0.1,
        counters: { ticks: 1, feeds: 0 },
        lastTick: new Date().toISOString(),
        cryo: false,
      };

      await backend.commitTick(newState);
      const logs = await backend.getLogs({ limit: 1 });

      expect(logs.length).toBe(1);
      expect(logs[0].mood).toBe('curious');
      expect(logs[0].routine).toBe('morning');
    });
  });

  describe('getLogs', () => {
    it('returns empty array initially', async () => {
      const logs = await backend.getLogs();
      expect(logs).toEqual([]);
    });

    it('returns logs in reverse chronological order', async () => {
      // Create multiple ticks to generate logs
      for (let i = 1; i <= 3; i++) {
        await backend.commitTick({
          mood: 'neutral',
          health: 100 - i * 10,
          routine: 'day',
          volatility: 0.05,
          counters: { ticks: i, feeds: 0 },
          lastTick: new Date().toISOString(),
          cryo: false,
        });
      }

      const logs = await backend.getLogs({ limit: 10 });

      expect(logs.length).toBe(3);
      expect(logs[0].summary).toBe('Tick 3');
      expect(logs[1].summary).toBe('Tick 2');
      expect(logs[2].summary).toBe('Tick 1');
    });

    it('respects limit parameter', async () => {
      for (let i = 1; i <= 5; i++) {
        await backend.commitTick({
          mood: 'neutral',
          health: 100,
          routine: 'day',
          volatility: 0.05,
          counters: { ticks: i, feeds: 0 },
          lastTick: new Date().toISOString(),
          cryo: false,
        });
      }

      const logs = await backend.getLogs({ limit: 2 });
      expect(logs.length).toBe(2);
    });
  });

  describe('storeMemory', () => {
    it('stores a memory and returns it with an id', async () => {
      const memory = await backend.storeMemory({
        ts: new Date().toISOString(),
        content: 'Test memory content',
        type: 'episodic',
        scope: 'working',
        importance: 0.7,
        salience: 0.5,
        valence: 0.3,
        confidence: 0.8,
        unique: true,
        tags: ['test'],
        sourceType: 'test',
        createdAt: Date.now(),
        accessedAt: Date.now(),
        accessCount: 0,
      });

      expect(memory.id).toBeDefined();
      expect(memory.id).toMatch(/^mem_\d+$/);
      expect(memory.content).toBe('Test memory content');
    });

    it('assigns unique ids', async () => {
      const mem1 = await backend.storeMemory({
        ts: new Date().toISOString(),
        content: 'First',
        type: 'semantic',
        scope: 'working',
        importance: 0.5,
        salience: 0.5,
        valence: 0,
        confidence: 0.7,
        unique: true,
        tags: [],
        sourceType: 'test',
        createdAt: Date.now(),
        accessedAt: Date.now(),
        accessCount: 0,
      });

      const mem2 = await backend.storeMemory({
        ts: new Date().toISOString(),
        content: 'Second',
        type: 'semantic',
        scope: 'working',
        importance: 0.5,
        salience: 0.5,
        valence: 0,
        confidence: 0.7,
        unique: true,
        tags: [],
        sourceType: 'test',
        createdAt: Date.now(),
        accessedAt: Date.now(),
        accessCount: 0,
      });

      expect(mem1.id).not.toBe(mem2.id);
    });
  });

  describe('getMemories', () => {
    beforeEach(async () => {
      // Seed with test memories
      await backend.storeMemory({
        ts: new Date().toISOString(),
        content: 'Episodic memory 1',
        type: 'episodic',
        scope: 'working',
        importance: 0.8,
        salience: 0.5,
        valence: 0,
        confidence: 0.7,
        unique: true,
        tags: [],
        sourceType: 'test',
        createdAt: Date.now(),
        accessedAt: Date.now(),
        accessCount: 0,
      });
      await backend.storeMemory({
        ts: new Date().toISOString(),
        content: 'Semantic memory 1',
        type: 'semantic',
        scope: 'long_term',
        importance: 0.5,
        salience: 0.5,
        valence: 0,
        confidence: 0.7,
        unique: true,
        tags: [],
        sourceType: 'test',
        createdAt: Date.now(),
        accessedAt: Date.now(),
        accessCount: 0,
      });
      await backend.storeMemory({
        ts: new Date().toISOString(),
        content: 'Semantic memory 2',
        type: 'semantic',
        scope: 'working',
        importance: 0.9,
        salience: 0.5,
        valence: 0,
        confidence: 0.7,
        unique: true,
        tags: [],
        sourceType: 'test',
        createdAt: Date.now(),
        accessedAt: Date.now(),
        accessCount: 0,
      });
    });

    it('returns all memories by default', async () => {
      const memories = await backend.getMemories();
      expect(memories.length).toBe(3);
    });

    it('filters by type', async () => {
      const semantic = await backend.getMemories({ type: 'semantic' });
      expect(semantic.length).toBe(2);
      expect(semantic.every((m) => m.type === 'semantic')).toBe(true);
    });

    it('filters by scope', async () => {
      const working = await backend.getMemories({ scope: 'working' });
      expect(working.length).toBe(2);
      expect(working.every((m) => m.scope === 'working')).toBe(true);
    });

    it('filters by minimum importance', async () => {
      const important = await backend.getMemories({ minImportance: 0.7 });
      expect(important.length).toBe(2);
      expect(important.every((m) => m.importance >= 0.7)).toBe(true);
    });

    it('sorts by importance descending', async () => {
      const memories = await backend.getMemories();

      for (let i = 1; i < memories.length; i++) {
        expect(memories[i - 1].importance).toBeGreaterThanOrEqual(memories[i].importance);
      }
    });

    it('respects limit parameter', async () => {
      const memories = await backend.getMemories({ limit: 2 });
      expect(memories.length).toBe(2);
    });
  });

  describe('addKnowledge', () => {
    it('stores knowledge and returns it with an id', async () => {
      const knowledge = await backend.addKnowledge({
        source: 'test',
        type: 'fact',
        textExcerpt: 'Test knowledge content',
        createdAt: Date.now(),
      });

      expect(knowledge.id).toBeDefined();
      expect(knowledge.textExcerpt).toBe('Test knowledge content');
    });
  });

  describe('getKnowledge', () => {
    beforeEach(async () => {
      await backend.addKnowledge({
        source: 'news',
        type: 'article',
        textExcerpt: 'News article 1',
        createdAt: Date.now(),
      });
      await backend.addKnowledge({
        source: 'research',
        type: 'fact',
        textExcerpt: 'Research fact 1',
        createdAt: Date.now(),
      });
    });

    it('returns all knowledge by default', async () => {
      const knowledge = await backend.getKnowledge();
      expect(knowledge.length).toBe(2);
    });

    it('filters by type', async () => {
      const facts = await backend.getKnowledge({ type: 'fact' });
      expect(facts.length).toBe(1);
      expect(facts[0].type).toBe('fact');
    });

    it('filters by source', async () => {
      const news = await backend.getKnowledge({ source: 'news' });
      expect(news.length).toBe(1);
      expect(news[0].source).toBe('news');
    });
  });

  describe('reset', () => {
    it('resets all data to initial state', async () => {
      // Add some data
      await backend.storeMemory({
        ts: new Date().toISOString(),
        content: 'Test',
        type: 'semantic',
        scope: 'working',
        importance: 0.5,
        salience: 0.5,
        valence: 0,
        confidence: 0.7,
        unique: true,
        tags: [],
        sourceType: 'test',
        createdAt: Date.now(),
        accessedAt: Date.now(),
        accessCount: 0,
      });
      await backend.addKnowledge({
        source: 'test',
        type: 'fact',
        textExcerpt: 'Test',
        createdAt: Date.now(),
      });
      await backend.commitTick({
        mood: 'expressive',
        health: 50,
        routine: 'evening',
        volatility: 0.5,
        counters: { ticks: 10, feeds: 5 },
        lastTick: new Date().toISOString(),
        cryo: true,
      });

      // Reset
      backend.reset();

      // Verify everything is cleared
      const state = await backend.getState();
      expect(state.mood).toBe('neutral');
      expect(state.health).toBe(100);
      expect(state.counters.ticks).toBe(0);
      expect(state.cryo).toBe(false);

      const memories = await backend.getMemories();
      expect(memories.length).toBe(0);

      const knowledge = await backend.getKnowledge();
      expect(knowledge.length).toBe(0);

      const logs = await backend.getLogs();
      expect(logs.length).toBe(0);
    });
  });
});

describe('createMemoryBackend', () => {
  it('creates a new MemoryBackend instance', () => {
    const backend = createMemoryBackend();
    expect(backend).toBeInstanceOf(MemoryBackend);
  });
});
