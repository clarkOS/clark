/**
 * Activity log functions
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * List recent logs
 */
export const listLogs = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit || 15;
    return await ctx.db
      .query("logs")
      .withIndex("by_ts")
      .order("desc")
      .take(limit);
  },
});

/**
 * Add a log entry
 */
export const addLog = mutation({
  args: {
    summary: v.string(),
    detail: v.optional(v.string()),
    mood: v.string(),
    health: v.optional(v.number()),
    routine: v.string(),
    volatility: v.optional(v.number()),
    artifacts: v.optional(v.array(v.any())),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("logs", {
      ts: new Date().toISOString(),
      summary: args.summary,
      detail: args.detail,
      mood: args.mood,
      health: args.health,
      routine: args.routine,
      volatility: args.volatility,
      artifacts: args.artifacts,
    });

    return { ok: true, id };
  },
});
