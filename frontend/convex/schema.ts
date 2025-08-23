import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    urls: defineTable({
        url: v.string(),
        createdAt: v.number(),
        status: v.optional(v.string()), // For future use: pending, processed, etc.
    }),
});
