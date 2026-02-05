/**
 * Ingested Books Tracking
 *
 * Tracks which books have been ingested to prevent duplicate work.
 * Follows Convex best practices for scaling.
 */

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Check if a book has already been ingested
 * Uses index for fast lookup - no .collect()
 */
export const isBookIngested = query({
  args: { identifier: v.string() },
  handler: async (ctx, args) => {
    const book = await ctx.db
      .query("ingested_books")
      .withIndex("by_identifier", (q) => q.eq("identifier", args.identifier))
      .first(); // Fast - stops after first match

    return book !== null;
  },
});

/**
 * Get book ingestion metadata
 */
export const getBookMetadata = query({
  args: { identifier: v.string() },
  handler: async (ctx, args) => {
    const book = await ctx.db
      .query("ingested_books")
      .withIndex("by_identifier", (q) => q.eq("identifier", args.identifier))
      .first();

    return book;
  },
});

/**
 * List all ingested books for a plugin
 * Uses .take() instead of .collect() for safety
 */
export const listIngestedBooks = query({
  args: {
    pluginName: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100; // Default limit

    const books = await ctx.db
      .query("ingested_books")
      .withIndex("by_plugin", (q) => q.eq("pluginName", args.pluginName))
      .order("desc") // Newest first
      .take(limit); // Never load everything

    return books;
  },
});

/**
 * Record a book ingestion
 */
export const recordIngestion = mutation({
  args: {
    identifier: v.string(),
    title: v.string(),
    source: v.string(),
    pluginName: v.string(),
    chunkCount: v.number(),
    sizeBytes: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Check if already exists (idempotent)
    const existing = await ctx.db
      .query("ingested_books")
      .withIndex("by_identifier", (q) => q.eq("identifier", args.identifier))
      .first();

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        chunkCount: args.chunkCount,
        ingestedAt: Date.now(),
        sizeBytes: args.sizeBytes,
        metadata: args.metadata,
      });
      return existing._id;
    }

    // Create new record
    const id = await ctx.db.insert("ingested_books", {
      identifier: args.identifier,
      title: args.title,
      source: args.source,
      pluginName: args.pluginName,
      chunkCount: args.chunkCount,
      ingestedAt: Date.now(),
      sizeBytes: args.sizeBytes,
      metadata: args.metadata,
    });

    return id;
  },
});

/**
 * Get chunk count for a book
 * Fast query using index
 */
export const getBookChunkCount = query({
  args: { identifier: v.string() },
  handler: async (ctx, args) => {
    // Use memories index with tags filter
    // Count without loading all documents
    const chunks = await ctx.db
      .query("memories")
      .withIndex("by_type", (q) => q.eq("type", "semantic"))
      .filter((q) =>
        q.and(
          q.eq(q.field("sourceType"), "book"),
          q.or(
            // Check if identifier is in tags
            ...args.identifier.split('-').map(tag =>
              q.eq(q.field("tags"), tag)
            )
          )
        )
      )
      .take(500); // Limit for safety

    return chunks.length;
  },
});

/**
 * Get ingestion stats (summary table pattern)
 * Small, denormalized data for dashboards
 */
export const getIngestionStats = query({
  args: { pluginName: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let query = ctx.db.query("ingested_books");

    if (args.pluginName) {
      query = query.withIndex("by_plugin", (q) =>
        q.eq("pluginName", args.pluginName)
      );
    }

    const books = await query.take(1000); // Safe limit

    const stats = {
      totalBooks: books.length,
      totalChunks: books.reduce((sum, book) => sum + book.chunkCount, 0),
      totalSize: books.reduce((sum, book) => sum + (book.sizeBytes ?? 0), 0),
      byPlugin: {} as Record<string, number>,
      recentIngestions: books
        .sort((a, b) => b.ingestedAt - a.ingestedAt)
        .slice(0, 5)
        .map(b => ({
          title: b.title,
          identifier: b.identifier,
          chunks: b.chunkCount,
          when: new Date(b.ingestedAt).toISOString(),
        })),
    };

    // Count by plugin
    for (const book of books) {
      stats.byPlugin[book.pluginName] =
        (stats.byPlugin[book.pluginName] || 0) + 1;
    }

    return stats;
  },
});
