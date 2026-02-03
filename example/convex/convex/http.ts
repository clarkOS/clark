/**
 * ClarkOS HTTP Router
 *
 * Exposes REST API endpoints for the agent framework.
 */

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const router = httpRouter();

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const json = (data: any, status = 200) =>
  new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });

// =============================================================================
// State Endpoints
// =============================================================================

router.route({
  path: "/state",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const state = await ctx.runQuery(api.state.getState, {});
    return json(state);
  }),
});

// =============================================================================
// Memory Endpoints
// =============================================================================

router.route({
  path: "/memories",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") || 20);
    const type = url.searchParams.get("type") as any;
    const scope = url.searchParams.get("scope") as any;

    const memories = await ctx.runQuery(api.memories.listMemories, {
      limit,
      type: type || undefined,
      scope: scope || undefined,
    });
    return json(memories);
  }),
});

router.route({
  path: "/memories",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.json().catch(() => ({}));

    if (!body.content || !body.type) {
      return json({ error: "content and type required" }, 400);
    }

    const result = await ctx.runMutation(api.memories.storeMemory, {
      content: body.content,
      type: body.type,
      scope: body.scope,
      importance: body.importance,
      tags: body.tags,
      sourceType: body.sourceType,
      sourceId: body.sourceId,
    });
    return json(result);
  }),
});

router.route({
  path: "/memories/core",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") || 10);
    const coreMemories = await ctx.runQuery(api.memories.listCoreMemories, { limit });
    return json(coreMemories);
  }),
});

router.route({
  path: "/memories/stats",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const stats = await ctx.runQuery(api.memories.getStats, {});
    return json(stats);
  }),
});

// =============================================================================
// Knowledge Endpoints
// =============================================================================

router.route({
  path: "/knowledge",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") || 20);
    const type = url.searchParams.get("type") || undefined;
    const source = url.searchParams.get("source") || undefined;

    const knowledge = await ctx.runQuery(api.knowledge.listKnowledge, {
      limit,
      type,
      source,
    });
    return json(knowledge);
  }),
});

router.route({
  path: "/knowledge",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.json().catch(() => ({}));

    if (!body.text) {
      return json({ error: "text required" }, 400);
    }

    const result = await ctx.runMutation(api.knowledge.addKnowledge, {
      text: body.text,
      type: body.type,
      source: body.source,
      url: body.url,
      author: body.author,
    });
    return json(result);
  }),
});

// =============================================================================
// Log Endpoints
// =============================================================================

router.route({
  path: "/logs",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit") || 15);
    const logs = await ctx.runQuery(api.logs.listLogs, { limit });
    return json(logs);
  }),
});

// =============================================================================
// Health Check
// =============================================================================

router.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const state = await ctx.runQuery(api.state.getState, {});
    return json({
      ok: true,
      service: "clarkos-agent",
      now: new Date().toISOString(),
      lastTick: state.lastTick,
    });
  }),
});

// =============================================================================
// CORS Preflight
// =============================================================================

router.route({
  path: "/:path*",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers });
  }),
});

export default router;
