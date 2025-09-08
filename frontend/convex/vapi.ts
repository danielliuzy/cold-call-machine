import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Schedule a call for a specific contact
export const scheduleCall = mutation({
    args: {
        urlId: v.id("urls"),
        contactId: v.string(),
        phoneNumber: v.string(),
        vapiCallId: v.string(),
        scheduledAt: v.number(),
    },
    handler: async (ctx, args) => {
        const callId = await ctx.db.insert("calls", {
            urlId: args.urlId,
            contactId: args.contactId,
            phoneNumber: args.phoneNumber,
            status: "scheduled",
            scheduledAt: args.scheduledAt,
            vapiCallId: args.vapiCallId,
        });
        return callId;
    },
});

// Get all scheduled calls
export const getScheduledCalls = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("calls")
            .filter((q) => q.eq(q.field("status"), "scheduled"))
            .order("asc")
            .collect();
    },
});

// Get calls for a specific URL
export const getCallsForUrl = query({
    args: { urlId: v.id("urls") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("calls")
            .filter((q) => q.eq(q.field("urlId"), args.urlId))
            .order("desc")
            .collect();
    },
});

// Update call status
export const updateCallStatus = mutation({
    args: {
        callId: v.id("calls"),
        status: v.string(),
        startedAt: v.optional(v.number()),
        completedAt: v.optional(v.number()),
        duration: v.optional(v.number()),
        outcome: v.optional(v.string()),
        notes: v.optional(v.string()),
        vapiCallId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { callId, ...updates } = args;
        await ctx.db.patch(callId, updates);
        return callId;
    },
});

// Get call statistics
export const getCallStats = query({
    args: {},
    handler: async (ctx) => {
        const allCalls = await ctx.db.query("calls").collect();

        const stats = {
            total: allCalls.length,
            scheduled: allCalls.filter((call) => call.status === "scheduled")
                .length,
            inProgress: allCalls.filter((call) => call.status === "in-progress")
                .length,
            completed: allCalls.filter((call) => call.status === "completed")
                .length,
            failed: allCalls.filter((call) => call.status === "failed").length,
        };

        return stats;
    },
});
