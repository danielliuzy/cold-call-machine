import z from "zod";
import express from "express";
import BrowserUse from "browser-use-sdk";
import dotenv from 'dotenv'

dotenv.config();
const client = new BrowserUse({
  apiKey: process.env["BROWSWER_USE_API_KEY"],
});


const router = express.Router();

// Zod schemas for validation
const CompanyAnalysisInput = z.object({
  companyUrl: z.string().url(),
});

const CustomerLead = z.object({
  name: z.string(),
  phoneNumber: z.string(),
});

const LeadGenerationOutput = z.object({
  companyDescription: z.string(),
  industry: z.string(),
  targetCustomerProfile: z.string(),
  potentialCustomers: z.array(CustomerLead).length(50),
});

const companyDataOutput = z.object({
        companyDescription: z.string(),
        industry: z.string(),
        productsServices: z.array(z.string()),
        targetMarket: z.string(),
        businessModel: z.string(),
        idealCustomerProfile: z.string(),
      });
// Main endpoint
router.post("/analyze-company-leads", async (req, res) => {
  try {
    // Validate input
    console.log("analyxin...",)
    const  companyUrl  = req.body.companyUrl;
    console.log(companyUrl,"url")

    // Step 1: Analyze the company website
    const companyAnalysis = await client.tasks.run({
      task: `Visit the website ${companyUrl} and analyze what this company does. 
             Determine their industry, products/services, target market, and business model.
             Provide a comprehensive understanding of their niche and who would be their ideal customers.`,
      schema: companyDataOutput,
      agentSettings: {
        llm: "gpt-4.1",
      },
    });
    console.log(companyAnalysis, "companyana");
    // Step 2: Generate potential customer leads
    const leadGeneration = await client.tasks.run({
      task: `Based on this company analysis: ${JSON.stringify(companyAnalysis)}
             
             Find 50 potential customers who would be interested in this company's products/services.
             Focus on businesses or individuals in their target market.
             
             For each potential customer, provide:
             - Full name (decision maker/business owner)
             - Phone number
             
             Make sure all phone numbers are valid and properly formatted.
             Prioritize leads that are most likely to convert based on the company's niche.`,
      schema: z.object({
        potentialCustomers: z.array(z.object({
          name: z.string(),
          phoneNumber: z.string(),
          company: z.string().optional(),
          relevanceReason: z.string().optional(),
        })).length(50),
      }),
    });

    // console.log(leadGeneration, "leadGeneration");
    // Format the response according to our schema
    const result = {
      companyDescription: companyAnalysis.parsedOutput?.companyDescription,
      industry: companyAnalysis.parsedOutput?.industry,
      targetCustomerProfile: companyAnalysis.parsedOutput?.idealCustomerProfile,
      potentialCustomers: leadGeneration.parsedOutput?.potentialCustomers.map(customer => ({
        name: customer.name,
        phoneNumber: customer.phoneNumber,
      })),
    };

    // Validate output
    const validatedResult = LeadGenerationOutput.parse(result);

    res.json({
      success: true,
      data: validatedResult,
    });

  } catch (error) {
    console.error("Error processing request:", error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: error.message,
      });
    }
  }
});

// Alternative endpoint with more detailed analysis
router.post("/analyze-company-leads-detailed", async (req, res) => {
  try {
    const { companyUrl } = CompanyAnalysisInput.parse(req.body);

    // Enhanced analysis with competitor research
    const enhancedAnalysis = await client.tasks.run({
      task: `Perform a comprehensive analysis of ${companyUrl}:
             
             1. Analyze their website content, products, services, pricing
             2. Identify their industry and market position
             3. Research their competitors
             4. Determine their ideal customer personas
             5. Identify specific pain points their solution addresses
             
             Use this analysis to create a detailed customer profile.`,
      schema: z.object({
        companyName: z.string(),
        description: z.string(),
        industry: z.string(),
        keyProducts: z.array(z.string()),
        targetMarket: z.string(),
        customerPersonas: z.array(z.string()),
        painPointsAddressed: z.array(z.string()),
        competitors: z.array(z.string()),
      }),
    });

    // Generate highly targeted leads
    const targetedLeads = await client.tasks.run({
      task: `Generate 50 high-quality leads for ${enhancedAnalysis.parsedOutput?.companyName}.
             
             Company details: ${JSON.stringify(enhancedAnalysis.parsedOutput)}
             
             Find potential customers who:
             - Match their customer personas exactly
             - Have the pain points this company solves
             - Are in the right industry/market segment
             - Have decision-making authority
             - Are likely to have budget for this solution
             
             Provide name and phone number for each lead. Ensure phone numbers are current and valid.`,
      schema: z.object({
        leads: z.array(z.object({
          name: z.string(),
          phoneNumber: z.string(),
          title: z.string().optional(),
          company: z.string().optional(),
          matchReason: z.string().optional(),
        })).length(50),
      }),
    });

    const detailedResult = {
      companyDescription: enhancedAnalysis.parsedOutput?.description,
      industry: enhancedAnalysis.parsedOutput?.industry,
      targetCustomerProfile: enhancedAnalysis.parsedOutput?.customerPersonas.join(", "),
      potentialCustomers: targetedLeads.parsedOutput?.leads.map(lead => ({
        name: lead.name,
        phoneNumber: lead.phoneNumber,
      })),
    };

    const validatedResult = LeadGenerationOutput.parse(detailedResult);

    res.json({
      success: true,
      data: validatedResult,
      additionalInfo: {
        companyName: enhancedAnalysis.parsedOutput?.companyName,
        keyProducts: enhancedAnalysis.parsedOutput?.keyProducts,
        competitors: enhancedAnalysis.parsedOutput?.competitors,
      },
    });

  } catch (error) {
    console.error("Error in detailed analysis:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Usage example endpoint for testing
router.get("/example-usage", (req, res) => {
    console.log("EEEE")
  res.json({
    endpoints: [
      {
        method: "POST",
        path: "/analyze-company-leads",
        description: "Basic company analysis and lead generation",
        exampleRequest: {
          companyUrl: "https://example-saas-company.com"
        }
      },
      {
        method: "POST", 
        path: "/analyze-company-leads-detailed",
        description: "Enhanced analysis with competitor research",
        exampleRequest: {
          companyUrl: "https://example-marketing-agency.com"
        }
      }
    ],
    sampleResponse: {
      success: true,
      data: {
        companyDescription: "SaaS platform for project management",
        industry: "Software/Technology",
        targetCustomerProfile: "Small to medium businesses, remote teams, project managers",
        potentialCustomers: [
          {
            name: "John Smith",
            phoneNumber: "+1-555-123-4567"
          },
          // ... 49 more customers
        ]
      }
    }
  });
});


export default router;