import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  businesses: defineTable({
    sourceUrl: v.string(),
    name: v.string(),
    category: v.string(),
    serviceArea: v.array(v.string()),
    icp: v.string(),
    notes: v.string(),
    ownerUserId: v.id("users"),
    createdAt: v.number(),
  }).index("by_owner", ["ownerUserId"]),

  leadSources: defineTable({
    businessId: v.id("businesses"),
    provider: v.string(),
    query: v.string(),
    status: v.string(),
    meta: v.any(),
    createdAt: v.number(),
  }).index("by_business", ["businessId"]),

  leads: defineTable({
    businessId: v.id("businesses"),
    extId: v.string(),
    provider: v.string(),
    name: v.string(),
    category: v.string(),
    website: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.string(),
    city: v.string(),
    state: v.string(),
    postalCode: v.optional(v.string()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
    rating: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
    sourceConfidence: v.number(),
    score: v.number(),
    dedupKey: v.string(),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_business", ["businessId"])
    .index("by_dedup", ["dedupKey"]),

  callScripts: defineTable({
    businessId: v.id("businesses"),
    leadId: v.optional(v.id("leads")),
    version: v.number(),
    purpose: v.string(),
    script: v.string(),
    tone: v.string(),
    objections: v.any(),
    createdAt: v.number(),
  }).index("by_business", ["businessId"]),

  calls: defineTable({
    businessId: v.id("businesses"),
    leadId: v.id("leads"),
    vapiCallId: v.string(),
    status: v.string(),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    outcome: v.string(),
    dispositionNotes: v.string(),
    recordingUrl: v.optional(v.string()),
    transcript: v.optional(v.string()),
    summary: v.optional(v.string()),
    costUsd: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_lead", ["leadId"])
    .index("by_business", ["businessId"]),

  settings: defineTable({
    businessId: v.id("businesses"),
    callWindowLocal: v.any(),
    doNotCallPatterns: v.array(v.string()),
    maxConcurrentCalls: v.number(),
    perRunLeadCap: v.number(),
    providerKeysConfigured: v.any(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_business", ["businessId"]),

  agentRuns: defineTable({
    businessId: v.id("businesses"),
    type: v.string(),
    status: v.string(),
    metrics: v.any(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_business", ["businessId"]),

  // Keep the original tasks table for now
  tasks: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
  }),
});