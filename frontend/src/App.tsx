import { useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

function App() {
    const [url, setUrl] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const insertUrl = useMutation(api.urls.insertUrl);
    const urls = useQuery(api.urls.getUrls);

    const handleSubmit = async () => {
        if (!url.trim()) return;

        setIsSubmitting(true);
        try {
            await insertUrl({ url: url.trim() });
            setUrl(""); // Clear input after successful submission
        } catch (error) {
            console.error("Failed to save URL:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="h-screen w-screen px-4 py-8 bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="max-w-4xl mx-auto">
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

                {/* Display stored URLs */}
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
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                                    </div>
                                    <span
                                        className={`px-2 py-1 text-xs rounded-full ${
                                            urlDoc.status === "pending"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-green-100 text-green-800"
                                        }`}>
                                        {urlDoc.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
