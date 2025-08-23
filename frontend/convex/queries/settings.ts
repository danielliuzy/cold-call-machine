import { query } from "../_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    const settings = await ctx.db
      .query("settings")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .first();
    
    // Return default settings if none exist
    if (!settings) {
      return {
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
      };
    }
    
    return settings;
  },
});