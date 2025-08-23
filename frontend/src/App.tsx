import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState } from "react";
import type { Id } from "../convex/_generated/dataModel";

function App() {
    const [currentView, setCurrentView] = useState<"onboard" | "dashboard">(
        "onboard"
    );
    const [businessUrl, setBusinessUrl] = useState("");
    const [selectedBusinessId, setSelectedBusinessId] =
        useState<Id<"businesses"> | null>(null);

    // Demo user ID - in real app this would come from auth
    const demoUserId = "demo_user" as Id<"users">;

    const businesses = useQuery(api.queries.businesses.list);
    const classifyBusiness = useMutation(
        api.mutations.workflows.classifyBusiness
    );
    const discoverLeads = useMutation(api.mutations.workflows.discoverLeads);
    const generateScript = useMutation(api.mutations.workflows.generateScript);
    const startCalls = useMutation(api.mutations.workflows.startCalls);

    // Always call hooks - conditionally pass undefined args
    const leads = useQuery(
        api.queries.leads.list,
        selectedBusinessId ? { businessId: selectedBusinessId } : "skip"
    );

    const calls = useQuery(
        api.queries.calls.list,
        selectedBusinessId ? { businessId: selectedBusinessId } : "skip"
    );

    const leadStats = useQuery(
        api.queries.leads.getStats,
        selectedBusinessId ? { businessId: selectedBusinessId } : "skip"
    );

    const callStats = useQuery(
        api.queries.calls.getStats,
        selectedBusinessId ? { businessId: selectedBusinessId } : "skip"
    );

    const handleAnalyzeBusiness = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!businessUrl.trim()) return;

        try {
            const businessId = await classifyBusiness({
                sourceUrl: businessUrl.trim(),
                ownerUserId: demoUserId,
            });
            setSelectedBusinessId(businessId);
            setCurrentView("dashboard");
            setBusinessUrl("");
        } catch (error) {
            console.error("Error analyzing business:", error);
            alert("Failed to analyze business. Please try again.");
        }
    };

    const handleGenerateLeads = async () => {
        if (!selectedBusinessId) return;
        try {
            await discoverLeads({
                businessId: selectedBusinessId,
                provider: "google_places",
            });
        } catch (error) {
            console.error("Error generating leads:", error);
            alert("Failed to generate leads. Please try again.");
        }
    };

    const handleGenerateScript = async () => {
        if (!selectedBusinessId) return;
        try {
            await generateScript({
                businessId: selectedBusinessId,
            });
            alert("Script generated successfully!");
        } catch (error) {
            console.error("Error generating script:", error);
            alert("Failed to generate script. Please try again.");
        }
    };

    const handleStartCalls = async () => {
        if (!selectedBusinessId) return;
        try {
            const result = await startCalls({
                businessId: selectedBusinessId,
            });
            alert(`Started ${result.leadsQueued} calls!`);
        } catch (error) {
            console.error("Error starting calls:", error);
            alert("Failed to start calls. Please try again.");
        }
    };

    if (currentView === "onboard") {
        return (
            <div className="max-w-2xl mx-auto mt-12 p-8 bg-white rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    Cold Call Machine
                </h1>
                <p className="text-gray-600 mb-8">
                    Analyze your business, discover leads, and start making
                    calls with AI
                </p>

                <form onSubmit={handleAnalyzeBusiness} className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Website URL
                    </label>
                    <div className="flex gap-3">
                        <input
                            type="url"
                            value={businessUrl}
                            onChange={(e) => setBusinessUrl(e.target.value)}
                            placeholder="https://your-business.com"
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <button
                            type="submit"
                            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                            Analyze Business
                        </button>
                    </div>
                </form>

                {businesses && businesses.length > 0 && (
                    <div className="border-t pt-6">
                        <h2 className="text-lg font-semibold mb-4">
                            Previous Businesses
                        </h2>
                        <div className="space-y-2">
                            {businesses.map((business) => (
                                <div
                                    key={business._id}
                                    onClick={() => {
                                        setSelectedBusinessId(business._id);
                                        setCurrentView("dashboard");
                                    }}
                                    className="p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
                                    <div className="font-medium">
                                        {business.name}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {business.category}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    const selectedBusiness = businesses?.find(
        (b) => b._id === selectedBusinessId
    );

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {selectedBusiness?.name || "Dashboard"}
                    </h1>
                    <p className="text-gray-600">
                        {selectedBusiness?.category} •{" "}
                        {selectedBusiness?.serviceArea?.join(", ")}
                    </p>
                </div>
                <button
                    onClick={() => setCurrentView("onboard")}
                    className="px-4 py-2 text-blue-600 hover:text-blue-800">
                    ← Back to Onboarding
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="text-2xl font-bold text-blue-600">
                        {leadStats?.total || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Leads</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="text-2xl font-bold text-green-600">
                        {leadStats?.withPhone || 0}
                    </div>
                    <div className="text-sm text-gray-600">With Phone</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="text-2xl font-bold text-purple-600">
                        {callStats?.total || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Calls</div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                    <div className="text-2xl font-bold text-orange-600">
                        {callStats?.interested || 0}
                    </div>
                    <div className="text-sm text-gray-600">Interested</div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-8">
                <button
                    onClick={handleGenerateLeads}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Generate Leads
                </button>
                <button
                    onClick={handleGenerateScript}
                    className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700">
                    Generate Script
                </button>
                <button
                    onClick={handleStartCalls}
                    className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                    Start Calls
                </button>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Leads */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b">
                        <h2 className="text-lg font-semibold">Leads</h2>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {leads === undefined ? (
                            <div className="p-6 text-gray-500">
                                Loading leads...
                            </div>
                        ) : leads.length === 0 ? (
                            <div className="p-6 text-gray-500">
                                No leads yet. Generate some leads to get
                                started.
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {leads.slice(0, 10).map((lead) => (
                                    <div
                                        key={lead._id}
                                        className="p-4 border-b last:border-b-0">
                                        <div className="font-medium">
                                            {lead.name}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {lead.phone} • {lead.city},{" "}
                                            {lead.state}
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <span
                                                className={`px-2 py-1 text-xs rounded-full ${
                                                    lead.status === "new"
                                                        ? "bg-blue-100 text-blue-800"
                                                        : lead.status ===
                                                            "queued"
                                                          ? "bg-yellow-100 text-yellow-800"
                                                          : lead.status ===
                                                              "calling"
                                                            ? "bg-purple-100 text-purple-800"
                                                            : lead.status ===
                                                                "reached"
                                                              ? "bg-green-100 text-green-800"
                                                              : "bg-gray-100 text-gray-800"
                                                }`}>
                                                {lead.status}
                                            </span>
                                            <span className="text-sm font-medium">
                                                Score: {lead.score}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Calls */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b">
                        <h2 className="text-lg font-semibold">Recent Calls</h2>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {calls === undefined ? (
                            <div className="p-6 text-gray-500">
                                Loading calls...
                            </div>
                        ) : calls.length === 0 ? (
                            <div className="p-6 text-gray-500">
                                No calls yet. Start some calls to see activity
                                here.
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {calls.slice(0, 10).map((call) => (
                                    <div
                                        key={call._id}
                                        className="p-4 border-b last:border-b-0">
                                        <div className="font-medium">
                                            {call.lead?.name || "Unknown Lead"}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {call.lead?.phone} •{" "}
                                            {new Date(
                                                call.createdAt
                                            ).toLocaleString()}
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <span
                                                className={`px-2 py-1 text-xs rounded-full ${
                                                    call.status === "queued"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : call.status ===
                                                            "in_progress"
                                                          ? "bg-blue-100 text-blue-800"
                                                          : call.status ===
                                                              "ended"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-gray-100 text-gray-800"
                                                }`}>
                                                {call.status}
                                            </span>
                                            {call.outcome && (
                                                <span className="text-sm font-medium">
                                                    {call.outcome}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
