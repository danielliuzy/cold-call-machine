import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    sourceUrl: v.string(),
    name: v.string(),
    category: v.string(),
    serviceArea: v.array(v.string()),
    icp: v.string(),
    notes: v.string(),
    ownerUserId: v.id("users")
  },
  handler: async (ctx, args) => {
    const businessId = await ctx.db.insert("businesses", {
      ...args,
      createdAt: Date.now()
    });
    
    // Create default settings for the business
    await ctx.db.insert("settings", {
      businessId,
      callWindowLocal: {
        start: "09:00",
        end: "17:00",
        timezone: "America/New_York"
      },
      doNotCallPatterns: [],
      maxConcurrentCalls: 3,
      perRunLeadCap: 20,
      providerKeysConfigured: {
        google: false,
        yelp: false,
        browseruse: false,
        vapi: false,
        openai: false
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    return businessId;
  },
});

export const update = mutation({
  args: {
    id: v.id("businesses"),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    serviceArea: v.optional(v.array(v.string())),
    icp: v.optional(v.string()),
    notes: v.optional(v.string())
  },
  handler: async (ctx, { id, ...updates }) => {
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("businesses") },
  handler: async (ctx, { id }) => {
    // Remove related data
    const leads = await ctx.db
      .query("leads")
      .withIndex("by_business", (q) => q.eq("businessId", id))
      .collect();
    
    for (const lead of leads) {
      await ctx.db.delete(lead._id);
    }
    
    const calls = await ctx.db
      .query("calls")
      .withIndex("by_business", (q) => q.eq("businessId", id))
      .collect();
    
    for (const call of calls) {
      await ctx.db.delete(call._id);
    }
    
    const settings = await ctx.db
      .query("settings")
      .withIndex("by_business", (q) => q.eq("businessId", id))
      .first();
    
    if (settings) {
      await ctx.db.delete(settings._id);
    }
    
    await ctx.db.delete(id);
  },
});