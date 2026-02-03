/**
 * Memory system functions
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * List memories with optional filters
 */
export const listMemories = query({
  args: {
    limit: v.optional(v.number()),
    type: v.optional(
      v.union(
        v.literal("episodic"),
        v.literal("semantic"),
        v.literal("emotional"),
        v.literal("procedural"),
        v.literal("reflection")
      )
    ),
    scope: v.optional(
      v.union(
        v.literal("short_term"),
        v.literal("working"),
        v.literal("long_term")
      )
    ),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    let memories;
    if (args.type) {
      memories = await ctx.db
        .query("memories")
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .order("desc")
        .take(limit);
    } else {
      memories = await ctx.db
        .query("memories")
        .withIndex("by_ts")
        .order("desc")
        .take(limit);
    }

    if (args.scope) {
      return memories.filter((m) => m.scope === args.scope);
    }

    return memories;
  },
});

/**
 * Store a new memory
 */
export const storeMemory = mutation({
  args: {
    content: v.string(),
    type: v.union(
      v.literal("episodic"),
      v.literal("semantic"),
      v.literal("emotional"),
      v.literal("procedural"),
      v.literal("reflection")
    ),
    scope: v.optional(
      v.union(
        v.literal("short_term"),
        v.literal("working"),
        v.literal("long_term")
      )
    ),
    importance: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    sourceType: v.optional(v.string()),
    sourceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const sentiment = analyzeSentiment(args.content);

    const id = await ctx.db.insert("memories", {
      ts: new Date().toISOString(),
      content: args.content,
      type: args.type,
      scope: args.scope || "short_term",
      sentiment,
      valence: sentiment.score,
      emotionalIntensity: Math.abs(sentiment.score),
      importance: args.importance || 0.5,
      salience: 0.5,
      confidence: 1.0,
      accessCount: 0,
      lastAccessedAt: now,
      tags: args.tags || [],
      linkedMemoryIds: [],
      sourceType: args.sourceType || "user",
      sourceId: args.sourceId,
      isConsolidated: false,
      unique: true,
      version: 1,
      updatedAt: now,
    });

    return { stored: true, id };
  },
});

/**
 * Get memory by ID
 */
export const getMemory = query({
  args: { memoryId: v.id("memories") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.memoryId);
  },
});

/**
 * Update memory access (boosts importance)
 */
export const accessMemory = mutation({
  args: { memoryId: v.id("memories") },
  handler: async (ctx, args) => {
    const memory = await ctx.db.get(args.memoryId);
    if (!memory) return { ok: false, reason: "not_found" };

    const newImportance = Math.min(1, memory.importance + 0.05);
    await ctx.db.patch(args.memoryId, {
      accessCount: memory.accessCount + 1,
      lastAccessedAt: Date.now(),
      importance: newImportance,
    });

    return { ok: true };
  },
});

/**
 * List core memories
 */
export const listCoreMemories = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("core_memories")
      .withIndex("by_importance")
      .order("desc")
      .take(args.limit || 10);
  },
});

/**
 * Get memory statistics
 */
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const memories = await ctx.db.query("memories").collect();
    const coreMemories = await ctx.db.query("core_memories").collect();

    const typeDistribution: Record<string, number> = {
      episodic: 0,
      semantic: 0,
      emotional: 0,
      procedural: 0,
      reflection: 0,
    };
    const scopeDistribution: Record<string, number> = {
      short_term: 0,
      working: 0,
      long_term: 0,
    };

    let totalImportance = 0;
    for (const m of memories) {
      typeDistribution[m.type] = (typeDistribution[m.type] || 0) + 1;
      scopeDistribution[m.scope] = (scopeDistribution[m.scope] || 0) + 1;
      totalImportance += m.importance;
    }

    return {
      totalMemories: memories.length,
      coreMemoryCount: coreMemories.length,
      typeDistribution,
      scopeDistribution,
      averageImportance: memories.length > 0 ? totalImportance / memories.length : 0,
    };
  },
});

/**
 * Simple sentiment analysis (lexicon-based)
 */
function analyzeSentiment(text: string): { score: number; label: string } {
  const positive = [
    "good", "great", "excellent", "happy", "love", "amazing", "wonderful",
    "fantastic", "brilliant", "awesome", "positive", "success", "win",
    "bullish", "growth", "profit", "gain", "up", "rise", "strong",
  ];
  const negative = [
    "bad", "terrible", "awful", "sad", "hate", "horrible", "poor",
    "negative", "fail", "loss", "down", "drop", "weak", "bearish",
    "crash", "decline", "fall", "worried", "concerned", "fear",
  ];

  const words = text.toLowerCase().split(/\s+/);
  let score = 0;

  for (const word of words) {
    if (positive.some((p) => word.includes(p))) score += 0.1;
    if (negative.some((n) => word.includes(n))) score -= 0.1;
  }

  score = Math.max(-1, Math.min(1, score));

  let label = "neutral";
  if (score > 0.2) label = "positive";
  else if (score < -0.2) label = "negative";

  return { score, label };
}
