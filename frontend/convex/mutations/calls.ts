import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    businessId: v.id("businesses"),
    leadId: v.id("leads"),
    vapiCallId: v.string(),
    status: v.string(),
    outcome: v.string(),
    dispositionNotes: v.string()
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("calls", {
      ...args,
      createdAt: now,
      updatedAt: now
    });
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("calls"),
    status: v.string(),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number())
  },
  handler: async (ctx, { id, ...updates }) => {
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now()
    });
  },
});

export const updateByVapiId = mutation({
  args: {
    vapiCallId: v.string(),
    status: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    transcript: v.optional(v.string()),
    recordingUrl: v.optional(v.string()),
    costUsd: v.optional(v.number())
  },
  handler: async (ctx, { vapiCallId, ...updates }) => {
    // Find call by vapiCallId
    const call = await ctx.db
      .query("calls")
      .filter((q) => q.eq(q.field("vapiCallId"), vapiCallId))
      .first();
    
    if (!call) {
      throw new Error(`Call not found for Vapi ID: ${vapiCallId}`);
    }
    
    await ctx.db.patch(call._id, {
      ...updates,
      updatedAt: Date.now()
    });
    
    return call._id;
  },
});

export const updateOutcome = mutation({
  args: {
    id: v.id("calls"),
    outcome: v.string(),
    dispositionNotes: v.string(),
    summary: v.optional(v.string())
  },
  handler: async (ctx, { id, ...updates }) => {
    const call = await ctx.db.get(id);
    if (!call) {
      throw new Error("Call not found");
    }
    
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now()
    });
    
    // Update lead status based on outcome
    let leadStatus = call.outcome;
    switch (updates.outcome) {
      case 'interested':
        leadStatus = 'reached';
        break;
      case 'callback':
        leadStatus = 'reached';
        break;
      case 'not_interested':
        leadStatus = 'do_not_call';
        break;
      case 'no_answer':
      case 'vm_left':
        leadStatus = 'no_answer';
        break;
      default:
        leadStatus = 'no_answer';
    }
    
    await ctx.db.patch(call.leadId, {
      status: leadStatus,
      updatedAt: Date.now()
    });
  },
});

export const addTranscript = mutation({
  args: {
    vapiCallId: v.string(),
    transcript: v.string(),
    summary: v.optional(v.string()),
    outcome: v.optional(v.string())
  },
  handler: async (ctx, { vapiCallId, ...updates }) => {
    const call = await ctx.db
      .query("calls")
      .filter((q) => q.eq(q.field("vapiCallId"), vapiCallId))
      .first();
    
    if (!call) {
      throw new Error(`Call not found for Vapi ID: ${vapiCallId}`);
    }
    
    await ctx.db.patch(call._id, {
      ...updates,
      updatedAt: Date.now()
    });
    
    // If outcome is provided, update lead status
    if (updates.outcome && call.leadId) {
      let leadStatus = 'no_answer';
      switch (updates.outcome) {
        case 'interested':
        case 'callback':
          leadStatus = 'reached';
          break;
        case 'not_interested':
          leadStatus = 'do_not_call';
          break;
        case 'no_answer':
        case 'vm_left':
          leadStatus = 'no_answer';
          break;
      }
      
      await ctx.db.patch(call.leadId, {
        status: leadStatus,
        updatedAt: Date.now()
      });
    }
    
    return call._id;
  },
});

export const remove = mutation({
  args: { id: v.id("calls") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});