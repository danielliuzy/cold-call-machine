import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Import service functions (these would need to be adapted for server-side use)
export const classifyBusiness = mutation({
  args: { 
    sourceUrl: v.string(),
    ownerUserId: v.id("users")
  },
  handler: async (ctx, { sourceUrl, ownerUserId }) => {
    try {
      // This would call the classification service
      // For now, return a placeholder
      const businessId = await ctx.db.insert("businesses", {
        sourceUrl,
        name: "Sample Business",
        category: "General Business",
        serviceArea: ["Unknown Area"],
        icp: "General customers", 
        notes: "Automatically classified",
        ownerUserId,
        createdAt: Date.now()
      });
      
      // Create default settings
      await ctx.db.insert("settings", {
        businessId,
        callWindowLocal: {
          start: "09:00",
          end: "17:00",
          timezone: "America/New_York"
        },
        doNotCallPatterns: [],
        maxConcurrentCalls: 3,
        perRunLeadCap: 20,
        providerKeysConfigured: {
          google: false,
          yelp: false,
          browseruse: false,
          vapi: false,
          openai: false
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      
      return businessId;
      
    } catch (error) {
      throw new Error(`Failed to classify business: ${error}`);
    }
  },
});

export const discoverLeads = mutation({
  args: { 
    businessId: v.id("businesses"),
    provider: v.string() // "google_places" | "yelp"
  },
  handler: async (ctx, { businessId, provider }) => {
    const business = await ctx.db.get(businessId);
    if (!business) {
      throw new Error("Business not found");
    }
    
    // Create a lead source record
    const leadSourceId = await ctx.db.insert("leadSources", {
      businessId,
      provider,
      query: `${business.category} in ${business.serviceArea.join(", ")}`,
      status: "pending",
      meta: { radiusKm: 50, maxResults: 50 },
      createdAt: Date.now()
    });
    
    try {
      // This would call the lead discovery service
      // For now, create sample leads
      const sampleLeads = [
        {
          extId: "sample_1",
          provider,
          name: "Sample Lead 1",
          category: business.category,
          website: "https://example1.com",
          phone: "(555) 123-4567",
          address: "123 Main St",
          city: business.serviceArea[0] || "Anytown",
          state: "NY",
          postalCode: "12345",
          rating: 4.2,
          reviewCount: 45,
          sourceConfidence: 0.8,
          score: 75,
          dedupKey: "phone_5551234567"
        },
        {
          extId: "sample_2", 
          provider,
          name: "Sample Lead 2",
          category: business.category,
          website: "https://example2.com",
          phone: "(555) 987-6543",
          address: "456 Oak Ave",
          city: business.serviceArea[0] || "Anytown",
          state: "NY",
          postalCode: "12346",
          rating: 3.8,
          reviewCount: 23,
          sourceConfidence: 0.7,
          score: 65,
          dedupKey: "phone_5559876543"
        }
      ];
      
      const leadIds = [];
      for (const leadData of sampleLeads) {
        const leadId = await ctx.db.insert("leads", {
          businessId,
          ...leadData,
          status: "new",
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
        leadIds.push(leadId);
      }
      
      // Update lead source status
      await ctx.db.patch(leadSourceId, {
        status: "done",
        meta: { 
          radiusKm: 50, 
          maxResults: 50,
          found: leadIds.length,
          apiCost: 0.15
        }
      });
      
      return { leadSourceId, leadIds };
      
    } catch (error) {
      // Update lead source with error
      await ctx.db.patch(leadSourceId, {
        status: "error",
        meta: { error: error instanceof Error ? error.message : String(error) }
      });
      throw error;
    }
  },
});

export const generateScript = mutation({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    const business = await ctx.db.get(businessId);
    if (!business) {
      throw new Error("Business not found");
    }
    
    // Create a sample script
    const script = {
      opener: `Hi there, this is a virtual assistant calling on behalf of ${business.name}. This call may be recorded. Is now a bad time?`,
      valueProps: [
        `We help ${business.category} businesses improve their operations`,
        'Our proven approach saves time and reduces costs'
      ],
      objections: [
        {
          objection: "We're not interested right now",
          reply: "I understand timing is important. Would it be helpful if I sent you some information to review when you have a moment?"
        },
        {
          objection: "We already have a solution", 
          reply: "That's great to hear you're being proactive. Many of our best clients had existing solutions before discovering the additional benefits we could provide."
        }
      ],
      cta: 'Would you be available for a brief 15-minute conversation next week to discuss how this might benefit your business?',
      closing: 'Thank you for your time today. Have a great day!'
    };
    
    const scriptId = await ctx.db.insert("callScripts", {
      businessId,
      version: 1,
      purpose: "intro",
      script: JSON.stringify(script),
      tone: "professional",
      objections: script.objections,
      createdAt: Date.now()
    });
    
    return scriptId;
  },
});

export const startCalls = mutation({
  args: { businessId: v.id("businesses") },
  handler: async (ctx, { businessId }) => {
    // Get top scoring leads that are ready to call
    const leads = await ctx.db
      .query("leads")
      .withIndex("by_business", (q) => q.eq("businessId", businessId))
      .filter((q) => q.and(
        q.eq(q.field("status"), "new"),
        q.neq(q.field("phone"), undefined),
        q.gt(q.field("score"), 50)
      ))
      .collect();
    
    const topLeads = leads
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Start with 5 calls for demo
    
    const callIds = [];
    for (const lead of topLeads) {
      // Create call record
      const callId = await ctx.db.insert("calls", {
        businessId,
        leadId: lead._id,
        vapiCallId: `demo_call_${Date.now()}_${Math.random()}`,
        status: "queued",
        outcome: "",
        dispositionNotes: "",
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      
      // Update lead status
      await ctx.db.patch(lead._id, {
        status: "queued",
        updatedAt: Date.now()
      });
      
      callIds.push(callId);
    }
    
    return { callIds, leadsQueued: topLeads.length };
  },
});