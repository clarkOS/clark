/**
 * Knowledge base functions
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * List knowledge items
 */
export const listKnowledge = query({
  args: {
    limit: v.optional(v.number()),
    type: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    if (args.type) {
      return await ctx.db
        .query("knowledge")
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .order("desc")
        .take(limit);
    }

    if (args.source) {
      return await ctx.db
        .query("knowledge")
        .withIndex("by_source", (q) => q.eq("source", args.source!))
        .order("desc")
        .take(limit);
    }

    return await ctx.db
      .query("knowledge")
      .withIndex("by_ts")
      .order("desc")
      .take(limit);
  },
});

/**
 * Add knowledge item
 */
export const addKnowledge = mutation({
  args: {
    text: v.string(),
    type: v.optional(v.string()),
    source: v.optional(v.string()),
    url: v.optional(v.string()),
    author: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("knowledge", {
      ts: new Date().toISOString(),
      source: args.source || "user",
      type: args.type || "note",
      textExcerpt: args.text,
      url: args.url,
      author: args.author,
    });

    return { ok: true, id };
  },
});

/**
 * Get knowledge by ID
 */
export const getKnowledge = query({
  args: { knowledgeId: v.id("knowledge") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.knowledgeId);
  },
});

/**
 * Search knowledge by text
 */
export const searchKnowledge = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const queryLower = args.query.toLowerCase();

    // Basic text search (for full semantic search, use embeddings)
    const all = await ctx.db
      .query("knowledge")
      .withIndex("by_ts")
      .order("desc")
      .take(100);

    return all
      .filter((k) => k.textExcerpt.toLowerCase().includes(queryLower))
      .slice(0, limit);
  },
});
