import { useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { CallManager } from "./components/CallManager";
import type { ContactInfo } from "./lib/vapi-client";
import type { Id } from "../convex/_generated/dataModel";

function App() {
    const [url, setUrl] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedUrlId, setSelectedUrlId] = useState<Id<"urls"> | null>(null);

    const insertUrl = useMutation(api.urls.insertUrl);
    const updateUrlWithContacts = useMutation(api.urls.updateUrlWithContacts);
    const urls = useQuery(api.urls.getUrls);

    const handleSubmit = async () => {
        if (!url.trim()) return;

        setIsSubmitting(true);
        try {
            const urlId = await insertUrl({ url: url.trim() });
            setUrl(""); // Clear input after successful submission

            // For demo purposes, let's simulate adding contact information
            // In a real app, this would come from Browser Use scraping
            await simulateContactExtraction(urlId);
        } catch (error) {
            console.error("Failed to save URL:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Simulate contact extraction (replace with actual Browser Use integration)
    const simulateContactExtraction = async (urlId: Id<"urls">) => {
        // Mock contact data - replace this with actual Browser Use results
        const mockContacts: ContactInfo[] = [
            {
                name: "John Smith",
                phone: "+1-510-960-0603",
                email: "john.smith@business.com",
                business: "Smith & Co.",
                address: "123 Business St, City, State",
                notes: "Business owner, interested in growth opportunities",
            },
            {
                name: "Sarah Johnson",
                phone: "+1-510-960-0603",
                email: "sarah.j@business.com",
                business: "Smith & Co.",
                address: "123 Business St, City, State",
                notes: "Marketing manager, handles partnerships",
            },
            {
                name: "Mike Wilson",
                phone: "+1-510-960-0603",
                email: "mike.wilson@business.com",
                business: "Smith & Co.",
                address: "123 Business St, City, State",
                notes: "Operations director, decision maker",
            },
        ];

        try {
            // Update the URL with contact information
            await updateUrlWithContacts({
                urlId,
                contactInfo: mockContacts,
                status: "completed",
            });
        } catch (error) {
            console.error("Failed to update URL with contacts:", error);
        }
    };

    const handleUrlSelect = (urlId: Id<"urls">) => {
        setSelectedUrlId(urlId);
    };

    return (
        <div className="h-screen w-screen px-4 py-8 bg-gradient-to-br from-blue-50 to-indigo-100 overflow-y-auto">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
                    Sales Agent URL Collector
                </h1>

                <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                    <div className="flex gap-4 mb-4">
                        <Input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Enter business website URL..."
                            className="flex-1"
                            onKeyPress={(e: React.KeyboardEvent) =>
                                e.key === "Enter" && handleSubmit()
                            }
                        />
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !url.trim()}
                            className="px-6">
                            {isSubmitting ? "Saving..." : "Save URL"}
                        </Button>
                    </div>
                    <p className="text-sm text-gray-600">
                        Enter a local business website URL to start the customer
                        discovery process.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* URL List */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800">
                            Stored URLs
                        </h2>
                        {urls === undefined ? (
                            <p className="text-gray-500">Loading...</p>
                        ) : urls.length === 0 ? (
                            <p className="text-gray-500">No URLs stored yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {urls.map((urlDoc) => (
                                    <div
                                        key={urlDoc._id}
                                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                            selectedUrlId === urlDoc._id
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-gray-200 hover:border-gray-300"
                                        }`}
                                        onClick={() =>
                                            handleUrlSelect(urlDoc._id)
                                        }>
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-800">
                                                    {urlDoc.url}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Added:{" "}
                                                    {new Date(
                                                        urlDoc.createdAt
                                                    ).toLocaleString()}
                                                </p>
                                                {urlDoc.contactInfo && (
                                                    <p className="text-sm text-green-600 mt-1">
                                                        📞{" "}
                                                        {
                                                            urlDoc.contactInfo
                                                                .length
                                                        }{" "}
                                                        contacts found
                                                    </p>
                                                )}
                                            </div>
                                            <span
                                                className={`px-2 py-1 text-xs rounded-full ${
                                                    urlDoc.status === "pending"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : urlDoc.status ===
                                                            "completed"
                                                          ? "bg-green-100 text-green-800"
                                                          : "bg-blue-100 text-blue-800"
                                                }`}>
                                                {urlDoc.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Call Manager */}
                    {selectedUrlId && urls && (
                        <div className="bg-white rounded-lg shadow-lg p-6">
                            <h2 className="text-xl font-semibold mb-4 text-gray-800">
                                Call Management
                            </h2>
                            {(() => {
                                const selectedUrl = urls.find(
                                    (url) => url._id === selectedUrlId
                                );
                                if (!selectedUrl) return <p>URL not found</p>;

                                if (
                                    !selectedUrl.contactInfo ||
                                    selectedUrl.contactInfo.length === 0
                                ) {
                                    return (
                                        <div className="text-center py-8">
                                            <p className="text-gray-500 mb-4">
                                                No contact information available
                                                yet.
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                Contact information will appear
                                                here after Browser Use
                                                processing.
                                            </p>
                                        </div>
                                    );
                                }

                                return (
                                    <CallManager
                                        urlId={selectedUrlId}
                                        contactInfo={selectedUrl.contactInfo}
                                    />
                                );
                            })()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
