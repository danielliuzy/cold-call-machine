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
        console.log("analyzing...");
        const companyUrl = req.body.companyUrl;

        const response = await openai.responses.create({
            model: "gpt-4o",
            tools: [{ type: "web_search_preview" }],
            input: `Visit the website ${companyUrl} and analyze the customer category this business would sell to in a B2B context. Also get the address of the business. Response in a concise manner.`,
        });

        const businessNameInCompanyUrl = await openai.responses.create({
            model: "gpt-4o",
            tools: [{ type: "web_search_preview" }],
            input: `Visit the website ${companyUrl} and extract the name of the business. Respond with just the name, no other text.`,
        });

        await Promise.all(
            new Array(10).fill(0).map(async (_, i) => {
                const leadGenTask = await browseruse.tasks.run({
                    task: `
      New task:
      1. You are given a business on google maps. Find 1 potential customer nearby that matches the target customer profile, click on the result in row number ${i} and use the extract structured data to get the name, address and phone number of the business. Do not leave google maps, only use the information provided there.
      2. Return the results as a JSON object with the fields name, address and phoneNumber. Return the phone number with country code, no spaces or dashes or parentheses.
      
      NOTE: Make sure you only return one business, and your goal is to be fast. Return as soon as you have valid data. Think as little as possible.

      ===CONTEXT===
      ${response.output_text}
      `,
                    agentSettings: {
                        llm: "gemini-2.5-flash",
                        startUrl: `https://google.com/maps/search/${businessNameInCompanyUrl.output_text}/`,
                    },
                    schema: CustomerLead,
                });

                if (leadGenTask.parsedOutput) {
                    res.write(JSON.stringify(leadGenTask.parsedOutput));
                }
                console.log("Completed 1 leadgen");
            })
        );
        console.log("DONE!!!");
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
