import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// write url to convex db
export const insertUrl = mutation({
    args: {
        url: v.string(),
    },
    handler: async (ctx, args) => {
        const urlId = await ctx.db.insert("urls", {
            url: args.url,
            createdAt: Date.now(),
            status: "pending",
        });
        return urlId;
    },
});

// read all urls from convex db
export const getUrls = query({
    handler: async (ctx) => {
        return await ctx.db.query("urls").collect();
    },
});
