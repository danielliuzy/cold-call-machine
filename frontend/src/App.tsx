import { useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { makeCall } from "./lib/vapi-client";
import { Link } from "react-router-dom";

const API_BASE_URL = "http://localhost:3001";

export type Lead = {
    name: string;
    address: string;
    phoneNumber: string;
};

// Type for the transformed data that matches Convex schema
type TransformedLead = {
    name: string;
    phoneNumber: string;
    address: string;
};

function App() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [currentUrl, setCurrentUrl] = useState("");
    const [contactCallIds, setContactCallIds] = useState<{
        [key: string]: string;
    }>({});

    // Convex mutations and queries
    const insertUrl = useMutation(api.urls.insertUrl);
    const updateUrlWithContacts = useMutation(api.urls.updateUrlWithContacts);
    const urls = useQuery(api.urls.getUrls);
    const scheduleCall = useMutation(api.vapi.scheduleCall);
    const called = useRef(false);

    const onCall = async (url: string) => {
        setCurrentUrl(url);

        try {
            // First, insert the URL into Convex
            const urlId = await insertUrl({ url });
            console.log("URL inserted into Convex:", urlId);

            // Then call Browser Use to get leads
            const response = await fetch(
                `${API_BASE_URL}/api/leads/analyze-company-leads`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ companyUrl: url }),
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body!.getReader();
            const decoder = new TextDecoder("utf-8");
            const allLeads: TransformedLead[] = [];
            const contactCallIds: { [key: string]: string } = {};

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                try {
                    const lead = JSON.parse(chunk);
                    // Transform the data to match the currently deployed schema
                    const transformedLead = {
                        name: lead.name,
                        phoneNumber: lead.phoneNumber, // Convert phoneNumber to phone
                        address: lead.address,
                    };
                    allLeads.push(transformedLead);

                    // Make the call via Vapi and get the call ID
                    try {
                        const vapiCallId = await makeCall({
                            phoneNumber: !called.current
                                ? "+15109600603"
                                : lead.phoneNumber, // Always call this number
                            businessName: lead.address,
                        });
                        called.current = true;

                        // Store the call ID for this specific contact
                        contactCallIds[lead.name] = vapiCallId;
                        setContactCallIds((prev) => ({
                            ...prev,
                            [lead.name]: vapiCallId,
                        }));

                        // Store the call in Convex DB with the Vapi call ID
                        await scheduleCall({
                            urlId,
                            contactId: lead.name,
                            phoneNumber: !called.current
                                ? "+15109600603"
                                : lead.phoneNumber,
                            vapiCallId: vapiCallId,
                            scheduledAt: Date.now(),
                        });

                        console.log(
                            `✅ Auto-call initiated for ${lead.name} with Vapi ID: ${vapiCallId}`
                        );
                        console.log(
                            `🔗 View call details: /call/${vapiCallId}`
                        );
                    } catch (callError) {
                        console.error(
                            `❌ Failed to auto-call ${lead.name}:`,
                            callError
                        );
                    }

                    setLeads((cur) => [...cur, lead]); // Keep original format for display
                } catch (e) {
                    console.log("Raw chunk:", chunk);
                }
            }

            // Store all leads in Convex DB with their individual call IDs
            if (allLeads.length > 0) {
                await updateUrlWithContacts({
                    urlId,
                    contactInfo: allLeads.map((lead) => ({
                        name: lead.name,
                        phoneNumber: lead.phoneNumber ?? "+15109600603",
                        address: lead.address,
                        vapiCallId: contactCallIds[lead.name],
                    })),
                    status: "completed",
                });
                console.log(`✅ Stored ${allLeads.length} leads in Convex DB`);
            }
        } catch (error) {
            console.error("Error processing leads:", error);
            // alert(`Error: ${error}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        SalesMaxi.ai
                    </h1>
                    <p className="text-xl text-gray-600">
                        Analyze companies and call customer leads
                    </p>
                </div>

                {/* Main URL Input Card */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Company Website URL
                    </h2>
                    <div className="flex gap-4">
                        <input
                            type="url"
                            value={currentUrl}
                            onChange={(e) => setCurrentUrl(e.target.value)}
                            placeholder="Enter company website URL"
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                            onClick={() => onCall(currentUrl)}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                            Find prospects
                        </button>
                    </div>
                </div>

                {/* Results Section - Only show when there are leads */}
                {leads.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">
                                Retrieved Contact Information
                            </h2>
                            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-medium">
                                {leads.length} contacts found
                            </span>
                            {/* <p>{leads[0].callId}</p> */}
                        </div>

                        <div className="grid gap-4">
                            {leads
                                .filter(
                                    (lead) =>
                                        lead.phoneNumber != null &&
                                        lead.phoneNumber !== ""
                                )
                                .map((lead, index) => (
                                    <div
                                        key={index}
                                        className="p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                    {lead.name}
                                                </h3>
                                                <div className="space-y-2 text-gray-700">
                                                    <div className="flex items-center">
                                                        <span className="text-blue-600 mr-3">
                                                            📞
                                                        </span>
                                                        <span className="font-medium">
                                                            {lead.phoneNumber}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <span className="text-green-600 mr-3">
                                                            📍
                                                        </span>
                                                        <span>
                                                            {lead.address}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="ml-4 flex flex-col items-end gap-2">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                                    Contact #{index + 1}
                                                </span>
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                                    ✅ Call Initiated
                                                </span>
                                                <Link
                                                    target="_blank"
                                                    to={`/call/${contactCallIds[lead.name]}`}>
                                                    <button className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors">
                                                        📞 View Call Details
                                                    </button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Stored URLs from Convex - Only show when there are URLs */}
                {urls && urls.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">
                            Analysis History
                        </h2>
                        <div className="space-y-4">
                            {urls.map((urlDoc) => (
                                <div
                                    key={urlDoc._id}
                                    className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="font-medium text-gray-900 text-lg">
                                            {urlDoc.url}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                    urlDoc.status ===
                                                    "completed"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-yellow-100 text-yellow-800"
                                                }`}>
                                                {urlDoc.status || "pending"}
                                            </span>
                                            {urlDoc.contactInfo && (
                                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                                    {urlDoc.contactInfo.length}{" "}
                                                    contacts
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {urlDoc.contactInfo &&
                                        urlDoc.contactInfo.length > 0 && (
                                            <div className="pt-3 border-t border-gray-200">
                                                <div className="text-sm font-medium text-gray-700 mb-2">
                                                    Contacts found:
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {urlDoc.contactInfo.map(
                                                        (contact, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex items-center text-sm text-gray-600 bg-white p-2 rounded border">
                                                                <span className="text-blue-500 mr-2">
                                                                    •
                                                                </span>
                                                                <span className="font-medium">
                                                                    {
                                                                        contact.name
                                                                    }
                                                                </span>
                                                                <span className="mx-2 text-gray-400">
                                                                    -
                                                                </span>
                                                                <span>
                                                                    {
                                                                        contact.phoneNumber
                                                                    }
                                                                </span>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
