import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    urls: defineTable({
        url: v.string(),
        createdAt: v.number(),
        status: v.optional(v.string()), // pending, processing, completed, failed
        contactInfo: v.optional(
            v.array(
                v.object({
                    name: v.string(),
                    phoneNumber: v.string(),
                    address: v.string(),
                })
            )
        ),
        lastProcessed: v.optional(v.number()),
    }),

    calls: defineTable({
        urlId: v.id("urls"),
        contactId: v.optional(v.string()), // Reference to contact in the contactInfo array
        phoneNumber: v.string(),
        status: v.optional(v.string()), // scheduled, in-progress, completed, failed
        scheduledAt: v.number(),
        startedAt: v.optional(v.number()),
        completedAt: v.optional(v.number()),
        duration: v.optional(v.number()), // in seconds
        outcome: v.optional(v.string()), // interested, not-interested, callback, voicemail
        notes: v.optional(v.string()),
        vapiCallId: v.optional(v.string()), // Vapi's call ID for tracking
    }),
});
