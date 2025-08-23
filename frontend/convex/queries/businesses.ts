import { query } from "../_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { id: v.id("businesses") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("businesses").collect();
  },
});

export const getByOwner = query({
  args: { ownerUserId: v.id("users") },
  handler: async (ctx, { ownerUserId }) => {
    return await ctx.db
      .query("businesses")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", ownerUserId))
      .collect();
  },
});