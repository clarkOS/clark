/**
 * ClarkOS Convex Schema
 *
 * Database schema for the ClarkOS agent framework.
 * Provides tables for state, memories, knowledge, and logs.
 */

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ==========================================================================
  // Agent State (singleton)
  // ==========================================================================
  state: defineTable({
    mood: v.string(),
    health: v.number(),
    routine: v.string(),
    volatility: v.number(),
    counters: v.object({
      ticks: v.number(),
      feeds: v.number(),
    }),
    lastTick: v.union(v.string(), v.null()),
    cryo: v.boolean(),
  }),

  // ==========================================================================
  // Memory System
  // ==========================================================================
  memories: defineTable({
    ts: v.string(),
    content: v.string(),
    type: v.union(
      v.literal("episodic"),
      v.literal("semantic"),
      v.literal("emotional"),
      v.literal("procedural"),
      v.literal("reflection")
    ),
    scope: v.union(
      v.literal("short_term"),
      v.literal("working"),
      v.literal("long_term")
    ),
    // Sentiment analysis
    sentiment: v.object({
      score: v.number(),
      label: v.string(),
    }),
    valence: v.number(),
    emotionalIntensity: v.number(),
    // Importance and access tracking
    importance: v.number(),
    salience: v.optional(v.number()),
    confidence: v.optional(v.number()),
    accessCount: v.number(),
    lastAccessedAt: v.number(),
    // Metadata
    tags: v.array(v.string()),
    linkedMemoryIds: v.array(v.string()),
    sourceType: v.string(),
    sourceId: v.optional(v.string()),
    // Consolidation
    isConsolidated: v.boolean(),
    // Enhanced fields
    unique: v.optional(v.boolean()),
    version: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    // Embedding for semantic search
    embedding: v.optional(v.array(v.float64())),
    embeddingModel: v.optional(v.string()),
    // Context metadata
    metadata: v.optional(v.any()),
  })
    .index("by_ts", ["ts"])
    .index("by_type", ["type"])
    .index("by_scope", ["scope"])
    .index("by_consolidated", ["isConsolidated"])
    .index("by_importance", ["importance"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 768,
      filterFields: ["type", "scope"],
    }),

  // ==========================================================================
  // Core Memories (Consolidated Knowledge)
  // ==========================================================================
  core_memories: defineTable({
    createdAt: v.number(),
    theme: v.string(),
    summary: v.string(),
    insights: v.array(v.string()),
    embedding: v.optional(v.array(v.float64())),
    importance: v.number(),
    accessCount: v.number(),
    lastAccessedAt: v.number(),
    sourceMemoryIds: v.array(v.string()),
    memoryCount: v.number(),
    timespanEarliest: v.number(),
    timespanLatest: v.number(),
  })
    .index("by_importance", ["importance"])
    .index("by_theme", ["theme"]),

  // ==========================================================================
  // Memory Links (Bidirectional Relationships)
  // ==========================================================================
  memory_links: defineTable({
    sourceMemoryId: v.string(),
    targetMemoryId: v.string(),
    linkType: v.union(
      v.literal("caused_by"),
      v.literal("related_to"),
      v.literal("contradicts"),
      v.literal("elaborates"),
      v.literal("supersedes"),
      v.literal("temporal_before"),
      v.literal("temporal_after")
    ),
    strength: v.number(),
    confidence: v.number(),
    createdAt: v.number(),
    metadata: v.optional(v.any()),
  })
    .index("by_source", ["sourceMemoryId"])
    .index("by_target", ["targetMemoryId"])
    .index("by_type", ["linkType"]),

  // ==========================================================================
  // Emotional Associations
  // ==========================================================================
  emotional_associations: defineTable({
    subject: v.string(),
    subjectType: v.string(),
    sentiment: v.number(),
    confidence: v.number(),
    intensity: v.number(),
    interactionCount: v.number(),
    lastUpdatedAt: v.number(),
    memoryIds: v.array(v.string()),
    positiveContexts: v.array(v.string()),
    negativeContexts: v.array(v.string()),
  })
    .index("by_subject", ["subject"])
    .index("by_type", ["subjectType"]),

  // ==========================================================================
  // Knowledge Base
  // ==========================================================================
  knowledge: defineTable({
    ts: v.string(),
    source: v.string(),
    type: v.string(),
    textExcerpt: v.string(),
    url: v.optional(v.string()),
    author: v.optional(v.string()),
  })
    .index("by_ts", ["ts"])
    .index("by_source", ["source"])
    .index("by_type", ["type"]),

  // ==========================================================================
  // Activity Logs
  // ==========================================================================
  logs: defineTable({
    ts: v.string(),
    summary: v.string(),
    detail: v.optional(v.string()),
    mood: v.string(),
    health: v.optional(v.number()),
    routine: v.string(),
    volatility: v.optional(v.number()),
    artifacts: v.optional(v.array(v.any())),
  }).index("by_ts", ["ts"]),

  // ==========================================================================
  // Memory System State
  // ==========================================================================
  memory_state: defineTable({
    lastConsolidationAt: v.optional(v.number()),
    lastDecayAt: v.optional(v.number()),
    totalMemories: v.number(),
    totalCoreMemories: v.number(),
    totalAssociations: v.number(),
    totalPatterns: v.number(),
    stats: v.object({
      memoriesCreatedToday: v.number(),
      memoriesConsolidatedToday: v.number(),
      memoriesPrunedToday: v.number(),
      embeddingsGeneratedToday: v.number(),
    }),
  }),

  // ==========================================================================
  // Daily Journals
  // ==========================================================================
  daily_journals: defineTable({
    date: v.string(),
    journal: v.object({
      text: v.string(),
      insights: v.array(v.string()),
      sentiment: v.string(),
    }),
    stats: v.object({
      tickCount: v.number(),
      newsCount: v.number(),
      marketCount: v.number(),
      memoryCount: v.number(),
    }),
    createdAt: v.number(),
  }).index("by_date", ["date"]),
});
