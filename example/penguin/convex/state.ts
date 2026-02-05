/**
 * State management functions
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Get current agent state
 */
export const getState = query({
  args: {},
  handler: async (ctx) => {
    const state = await ctx.db.query("state").first();
    if (!state) {
      // Return default state
      return {
        mood: "neutral",
        health: 75,
        routine: getRoutine(),
        volatility: 0.1,
        counters: { ticks: 0, feeds: 0 },
        lastTick: null,
        cryo: false,
      };
    }
    return state;
  },
});

/**
 * Update agent state
 */
export const updateState = mutation({
  args: {
    mood: v.optional(v.string()),
    health: v.optional(v.number()),
    routine: v.optional(v.string()),
    volatility: v.optional(v.number()),
    cryo: v.optional(v.boolean()),
    incrementTicks: v.optional(v.boolean()),
    incrementFeeds: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("state").first();

    if (existing) {
      const counters = { ...existing.counters };
      if (args.incrementTicks) counters.ticks++;
      if (args.incrementFeeds) counters.feeds++;

      await ctx.db.patch(existing._id, {
        mood: args.mood ?? existing.mood,
        health: args.health ?? existing.health,
        routine: args.routine ?? existing.routine,
        volatility: args.volatility ?? existing.volatility,
        cryo: args.cryo ?? existing.cryo,
        counters,
        lastTick: new Date().toISOString(),
      });
    } else {
      await ctx.db.insert("state", {
        mood: args.mood ?? "neutral",
        health: args.health ?? 75,
        routine: args.routine ?? getRoutine(),
        volatility: args.volatility ?? 0.1,
        counters: {
          ticks: args.incrementTicks ? 1 : 0,
          feeds: args.incrementFeeds ? 1 : 0,
        },
        lastTick: new Date().toISOString(),
        cryo: args.cryo ?? false,
      });
    }

    return { ok: true };
  },
});

/**
 * Initialize state (idempotent)
 */
export const initState = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("state").first();
    if (existing) {
      return { ok: true, existing: true };
    }

    await ctx.db.insert("state", {
      mood: "neutral",
      health: 75,
      routine: getRoutine(),
      volatility: 0.1,
      counters: { ticks: 0, feeds: 0 },
      lastTick: null,
      cryo: false,
    });

    return { ok: true, existing: false };
  },
});

/**
 * Get current routine based on time
 */
function getRoutine(): string {
  const now = new Date();
  // Adjust to PST (UTC-8)
  const pstHour = (now.getUTCHours() - 8 + 24) % 24;

  if (pstHour >= 6 && pstHour < 12) return "morning";
  if (pstHour >= 12 && pstHour < 18) return "day";
  if (pstHour >= 18 && pstHour < 22) return "evening";
  return "overnight";
}
