import z from "zod";
import express from "express";
import BrowserUse from "browser-use-sdk";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
const browseruse = new BrowserUse({
  apiKey: process.env["BROWSER_USE_API_KEY"],
});

const openai = new OpenAI();
const router = express.Router();

const CustomerLead = z.object({
  name: z.string(),
  address: z.string(),
  phoneNumber: z.string(),
});

// Main endpoint
router.post("/analyze-company-leads", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  try {
    const companyUrl = req.body.companyUrl;

    const response = await openai.responses.create({
      model: "gpt-4o",
      tools: [{ type: "web_search_preview" }],
      input: `Visit the website ${companyUrl} and analyze the customer category this business would sell to in a B2B context. Also get the address of the business. Response in a concise manner.`,
    });

    const existingCustomers: {
      name: string;
      address: string;
      phoneNumber: string;
    }[] = [];

    for (let i = 0; i < 10; i++) {
      const leadGenTask = await browseruse.tasks.run({
        task: `
      New task:
      1. Go to https://maps.google.com
      2. Search for the business in google maps
      3. Find 1 potential customer nearby that is not under EXISTING CUSTOMERS, click on them and use the extract structured data to get the name, address and phone number of the business. Do not leave google maps, only use the information provided there.
      4. Return the results as a JSON array with the fields name, address and phoneNumber. Return the phone number with country code, no spaces or dashes or parentheses.

      ===CONTEXT===
      ${response.output_text}
      
      ===EXISTING CUSTOMERS===
      ${JSON.stringify(existingCustomers, null, 2)}
      `,
        agentSettings: {
          llm: "o3",
        },
        schema: CustomerLead,
      });

      if (leadGenTask.parsedOutput) {
        res.write(JSON.stringify(leadGenTask.parsedOutput));
        existingCustomers.push(leadGenTask.parsedOutput);
      }
    }
    res.end();
  } catch (error) {
    console.error("Error processing request:", error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: "Validation error",
        details: error,
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: error,
      });
    }
  }
});

export default router;
