// callRoutes.ts
import express, { Request, Response } from "express";
import axios, { AxiosError } from "axios";
import dotenv from "dotenv";
dotenv.config();
// Create router instance
const router = express.Router();

// Configuration - You can move these to environment variables
const VAPI_BASE_URL = "https://api.vapi.ai";
const VAPI_API_TOKEN = process.env["VAPI_API_TOKEN"];

// Type definitions for the response (partial - you can expand based on your needs)
interface VapiCallResponse {
    id: string;
    orgId: string;
    createdAt: string;
    updatedAt: string;
    type: "inboundPhoneCall" | "outboundPhoneCall" | "webCall" | null;
    status: string | null;
    endedReason: string | null;
    startedAt: string | null;
    endedAt: string | null;
    cost: number | null;
    name: string | null;
    phoneCallProvider?: string | null;
    phoneCallProviderId?: string | null;
    messages?: Array<{
        role: string;
        message: string;
        time: number;
        endTime: number;
        secondsFromStart: number;
        duration: number;
    }> | null;
    costBreakdown?: {
        transport: number;
        stt: number;
        llm: number;
        tts: number;
        vapi: number;
        total: number;
    } | null;
}

/**
 * GET /calls/:id
 * Retrieve a specific call by ID
 */
router.get("/calls/:id", async (req: Request, res: Response) => {
    const { id } = req.params;

    // Validate ID parameter
    if (!id) {
        return res.status(400).json({
            error: "Bad Request",
            message: "Call ID is required",
        });
    }

    try {
        // Make API request to Vapi
        const response = await axios.get<VapiCallResponse>(
            `${VAPI_BASE_URL}/call/${id}`,
            {
                headers: {
                    Authorization: `Bearer ${VAPI_API_TOKEN}`,
                    "Content-Type": "application/json",
                },
            }
        );

        // Return the call data
        res.status(200).json(response.data);
    } catch (error) {
        // Handle errors
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;

            // Handle specific HTTP status codes
            if (axiosError.response) {
                switch (axiosError.response.status) {
                    case 401:
                        return res.status(401).json({
                            error: "Unauthorized",
                            message: "Invalid API token",
                        });
                    case 404:
                        return res.status(404).json({
                            error: "Not Found",
                            message: `Call with ID ${id} not found`,
                        });
                    case 429:
                        return res.status(429).json({
                            error: "Too Many Requests",
                            message:
                                "Rate limit exceeded. Please try again later.",
                        });
                    default:
                        return res.status(axiosError.response.status).json({
                            error: "API Error",
                            message:
                                axiosError.response.data ||
                                "An error occurred while fetching the call",
                        });
                }
            }

            // Network or other axios errors
            return res.status(500).json({
                error: "Network Error",
                message: "Failed to connect to Vapi API",
            });
        }

        // Unknown errors
        console.error("Unexpected error:", error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "An unexpected error occurred",
        });
    }
    return;
});

/**
 * Optional: GET /calls
 * List all calls with query parameters
 */
router.get("/calls", async (req: Request, res: Response) => {
    try {
        // You can add query parameters here if the API supports listing calls
        const queryParams = new URLSearchParams(req.query as any).toString();
        const url = queryParams
            ? `${VAPI_BASE_URL}/call?${queryParams}`
            : `${VAPI_BASE_URL}/call`;

        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${VAPI_API_TOKEN}`,
                "Content-Type": "application/json",
            },
        });

        res.status(200).json(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;

            if (axiosError.response) {
                return res.status(axiosError.response.status).json({
                    error: "API Error",
                    message:
                        axiosError.response.data || "Failed to fetch calls",
                });
            }
        }

        console.error("Error fetching calls:", error);
        res.status(500).json({
            error: "Internal Server Error",
            message: "Failed to fetch calls",
        });
    }
    return;
});

// Export the router
export default router;
