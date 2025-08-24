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

// Update URL with contact information
export const updateUrlWithContacts = mutation({
    args: {
        urlId: v.id("urls"),
        contactInfo: v.array(
            v.object({
                name: v.string(),
                phoneNumber: v.string(),
                address: v.string(),
            })
        ),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.urlId, {
            contactInfo: args.contactInfo,
            status: args.status,
            lastProcessed: Date.now(),
        });
        return args.urlId;
    },
});

// Get URL by ID with contact information
export const getUrlById = query({
    args: { urlId: v.id("urls") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.urlId);
    },
});

// Update URL status
export const updateUrlStatus = mutation({
    args: {
        urlId: v.id("urls"),
        status: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.urlId, {
            status: args.status,
            lastProcessed: Date.now(),
        });
        return args.urlId;
    },
});
