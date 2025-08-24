import { VapiClient } from "@vapi-ai/server-sdk";

const VAPI_API_BASE = "https://api.vapi.ai";

// Initialize Vapi client
const vapi = new VapiClient({
    token: import.meta.env.VITE_VAPI_API_KEY!,
});

export interface ContactInfo {
    name: string;
    phoneNumber: string;
    email?: string;
    business?: string;
    address: string;
    notes?: string;
}

export interface CallConfig {
    phoneNumber: string;
    businessName?: string;
}

// Make a phone call using Vapi SDK
export const makeCall = async (config: CallConfig): Promise<string> => {
    try {
        if (!import.meta.env.VITE_VAPI_API_KEY) {
            throw new Error("Vapi API key not found in environment variables");
        }

        // Format phone number to E.164 format
        const formattedPhone = config.phoneNumber.startsWith("+")
            ? config.phoneNumber
            : `+1${config.phoneNumber.replace(/\D/g, "")}`;

        console.log(`Making call to: ${formattedPhone}`);

        // Create call using Vapi SDK
        const call = await vapi.calls.create({
            phoneNumberId: "57d4951a-eeee-4a4b-9fdf-cda3cd02167f", // Your phone number ID from dashboard
            // customer: { number: formattedPhone },
            customer: { number: "+15109600603" },
            // assistantId: "b6258565-a11e-4e75-a5aa-bd7e7facffef", // Your assistant ID from dashboard
            workflowId: "18fe8463-1e75-4409-bbc8-521846344e30",
        });

        console.log(`✅ Vapi call created successfully:`, call);

        // Handle different response types - use type assertion for now
        const response = call as any;
        if (response.id) {
            return response.id;
        } else if (response.calls && response.calls.length > 0) {
            return response.calls[0].id;
        } else {
            throw new Error("Unexpected response format from Vapi API");
        }
    } catch (error) {
        console.error("Error making call:", error);
        throw new Error(`Failed to make call: ${error}`);
    }
};

// Get call status using Vapi REST API
export const getCallStatus = async (callId: string) => {
    try {
        const apiKey = import.meta.env.VITE_VAPI_API_KEY;
        if (!apiKey) {
            throw new Error("Vapi API key not found in environment variables");
        }

        const response = await fetch(`${VAPI_API_BASE}/call/${callId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(
                `Vapi API error: ${response.status} - ${errorData}`
            );
        }

        return await response.json();
    } catch (error) {
        console.error("Error getting call status:", error);
        throw new Error(`Failed to get call status: ${error}`);
    }
};

// End an active call using Vapi REST API
export const endCall = async (callId: string) => {
    try {
        const apiKey = import.meta.env.VITE_VAPI_API_KEY;
        if (!apiKey) {
            throw new Error("Vapi API key not found in environment variables");
        }

        const response = await fetch(`${VAPI_API_BASE}/call/${callId}/end`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(
                `Vapi API error: ${response.status} - ${errorData}`
            );
        }

        return true;
    } catch (error) {
        console.error("Error ending call:", error);
        throw new Error(`Failed to end call: ${error}`);
    }
};
