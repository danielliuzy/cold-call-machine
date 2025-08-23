import { query } from "../_generated/server";
import { v } from "convex/values";

export const list = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    const calls = await ctx.db
      .query("calls")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .collect();
    
    // Get lead information for each call
    const callsWithLeads = await Promise.all(
      calls.map(async (call) => {
        const lead = await ctx.db.get(call.leadId);
        return {
          ...call,
          lead: lead ? {
            name: lead.name,
            phone: lead.phone,
            city: lead.city
          } : null
        };
      })
    );
    
    return callsWithLeads.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const get = query({
  args: { id: v.id("calls") },
  handler: async (ctx, { id }) => {
    const call = await ctx.db.get(id);
    if (!call) return null;
    
    const lead = await ctx.db.get(call.leadId);
    return {
      ...call,
      lead: lead ? {
        name: lead.name,
        phone: lead.phone,
        city: lead.city,
        website: lead.website
      } : null
    };
  },
});

export const getByLead = query({
  args: { leadId: v.id("leads") },
  handler: async (ctx, { leadId }) => {
    return await ctx.db
      .query("calls")
      .withIndex("by_lead", (q) => q.eq("leadId", leadId))
      .collect();
  },
});

export const getStats = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    const calls = await ctx.db
      .query("calls")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .collect();
    
    const stats = {
      total: calls.length,
      queued: 0,
      initiated: 0,
      in_progress: 0,
      ended: 0,
      failed: 0,
      interested: 0,
      callback: 0,
      not_interested: 0,
      vm_left: 0,
      no_answer: 0,
      totalCost: 0,
      avgDuration: 0
    };
    
    let totalDuration = 0;
    let completedCalls = 0;
    
    for (const call of calls) {
      // Status counts
      switch (call.status) {
        case 'queued': stats.queued++; break;
        case 'initiated': stats.initiated++; break;
        case 'in_progress': stats.in_progress++; break;
        case 'ended': stats.ended++; break;
        case 'failed': stats.failed++; break;
      }
      
      // Outcome counts
      switch (call.outcome) {
        case 'interested': stats.interested++; break;
        case 'callback': stats.callback++; break;
        case 'not_interested': stats.not_interested++; break;
        case 'vm_left': stats.vm_left++; break;
        case 'no_answer': stats.no_answer++; break;
      }
      
      // Cost and duration
      if (call.costUsd) {
        stats.totalCost += call.costUsd;
      }
      
      if (call.startedAt && call.endedAt) {
        totalDuration += call.endedAt - call.startedAt;
        completedCalls++;
      }
    }
    
    stats.avgDuration = completedCalls > 0 
      ? Math.round(totalDuration / completedCalls / 1000) 
      : 0; // Convert to seconds
    
    stats.totalCost = Math.round(stats.totalCost * 100) / 100; // Round to cents
    
    return stats;
  },
});

export const getActive = query({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    return await ctx.db
      .query("calls")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .filter((q) => q.or(
        q.eq(q.field("status"), "queued"),
        q.eq(q.field("status"), "initiated"),
        q.eq(q.field("status"), "in_progress")
      ))
      .collect();
  },
});