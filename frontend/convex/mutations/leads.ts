import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    businessId: v.id("businesses"),
    extId: v.string(),
    provider: v.string(),
    name: v.string(),
    category: v.string(),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    postalCode: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    rating: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
    sourceConfidence: v.number(),
    score: v.number(),
    dedupKey: v.string(),
    status: v.string()
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("leads", {
      ...args,
      createdAt: now,
      updatedAt: now
    });
  },
});

export const upsert = mutation({
  args: {
    businessId: v.id("businesses"),
    extId: v.string(),
    provider: v.string(),
    name: v.string(),
    category: v.string(),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    postalCode: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    rating: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
    sourceConfidence: v.number(),
    score: v.number(),
    dedupKey: v.string(),
    status: v.string()
  },
  handler: async (ctx, args) => {
    // Check if lead already exists
    const existing = await ctx.db
      .query("leads")
      .withIndex("by_dedup", (q) => q.eq("dedupKey", args.dedupKey))
      .first();
    
    const now = Date.now();
    
    if (existing) {
      // Update existing lead
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now
      });
      return existing._id;
    } else {
      // Create new lead
      return await ctx.db.insert("leads", {
        ...args,
        createdAt: now,
        updatedAt: now
      });
    }
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("leads"),
    status: v.string()
  },
  handler: async (ctx, { id, status }) => {
    await ctx.db.patch(id, {
      status,
      updatedAt: Date.now()
    });
  },
});

export const enrich = mutation({
  args: {
    id: v.id("leads"),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    sourceConfidence: v.number()
  },
  handler: async (ctx, { id, ...updates }) => {
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now()
    });
  },
});

export const updateScore = mutation({
  args: {
    id: v.id("leads"),
    score: v.number()
  },
  handler: async (ctx, { id, score }) => {
    await ctx.db.patch(id, {
      score,
      updatedAt: Date.now()
    });
  },
});

export const batchUpdateStatus = mutation({
  args: {
    businessId: v.id("businesses"),
    fromStatus: v.string(),
    toStatus: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, { businessId, fromStatus, toStatus, limit = 20 }) => {
    let leads = await ctx.db
      .query("leads")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .filter((q) => q.eq(q.field("status"), fromStatus))
      .collect();
    
    // Sort by score descending and take limit
    leads = leads
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    const updates = [];
    for (const lead of leads) {
      await ctx.db.patch(lead._id, {
        status: toStatus,
        updatedAt: Date.now()
      });
      updates.push(lead._id);
    }
    
    return updates;
  },
});

export const remove = mutation({
  args: { id: v.id("leads") },
  handler: async (ctx, { id }) => {
    // Remove related calls first
    const calls = await ctx.db
      .query("calls")
      .withIndex("by_lead", (q) => q.eq("leadId", id))
      .collect();
    
    for (const call of calls) {
      await ctx.db.delete(call._id);
    }
    
    await ctx.db.delete(id);
  },
});