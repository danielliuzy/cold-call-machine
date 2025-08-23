import { query } from "../_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { 
    businessId: v.id("businesses"), 
    status: v.optional(v.string()) 
  },
  handler: async (ctx, { businessId, status }) => {
    const q = ctx.db
      .query("leads")
      .withIndex("by_business", (q) => q.eq("businessId", businessId));
    
    let leads = await q.collect();
    
    if (status) {
      leads = leads.filter(lead => lead.status === status);
    }
    
    return leads.sort((a, b) => b.score - a.score);
  },
});

export const get = query({
  args: { id: v.id("leads") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getTopScored = query({
  args: { 
    businessId: v.id("businesses"), 
    limit: v.optional(v.number()) 
  },
  handler: async (ctx, { businessId, limit = 20 }) => {
    const leads = await ctx.db
      .query("leads")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .filter((q) => q.and(
        q.neq(q.field("status"), "do_not_call"),
        q.gt(q.field("score"), 0)
      ))
      .collect();
    
    return leads
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },
});

export const getStats = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    const leads = await ctx.db
      .query("leads")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .collect();
    
    const stats = {
      total: leads.length,
      new: 0,
      queued: 0,
      calling: 0,
      reached: 0,
      no_answer: 0,
      do_not_call: 0,
      withPhone: 0,
      withEmail: 0,
      withWebsite: 0,
      avgScore: 0
    };
    
    let totalScore = 0;
    
    for (const lead of leads) {
      switch (lead.status) {
        case 'new': stats.new++; break;
        case 'queued': stats.queued++; break;
        case 'calling': stats.calling++; break;
        case 'reached': stats.reached++; break;
        case 'no_answer': stats.no_answer++; break;
        case 'do_not_call': stats.do_not_call++; break;
      }
      
      if (lead.phone) stats.withPhone++;
      if (lead.email) stats.withEmail++;
      if (lead.website) stats.withWebsite++;
      
      totalScore += lead.score;
    }
    
    stats.avgScore = leads.length > 0 ? Math.round(totalScore / leads.length) : 0;
    
    return stats;
  },
});