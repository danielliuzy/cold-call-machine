import React, { useState } from "react";
import {
    Search,
    Users,
    Building,
    Phone,
    Loader2,
    CheckCircle,
} from "lucide-react";
import type { Lead } from "./App";

// Type definitions based on the API schema
interface CustomerLead {
    name: string;
    phoneNumber: string;
}

interface LeadGenerationData {
    companyDescription: string;
    industry: string;
    targetCustomerProfile: string;
    potentialCustomers: CustomerLead[];
}

interface BasicApiResponse {
    success: boolean;
    data: LeadGenerationData;
}

interface DetailedApiResponse extends BasicApiResponse {
    additionalInfo?: {
        companyName: string;
        keyProducts: string[];
        competitors: string[];
    };
}

interface ErrorResponse {
    success: false;
    error: string;
    details?: Array<{
        code: string;
        expected: string;
        received: string;
        path: string[];
        message: string;
    }>;
    message?: string;
}

type ApiResponse = BasicApiResponse | DetailedApiResponse | ErrorResponse;

const LeadGenerationTester: React.FC<{
    leads: Lead[];
    onCall: (url: string) => Promise<void>;
}> = ({ leads, onCall }) => {
    const [companyUrl, setCompanyUrl] = useState<string>(
        "https://www.markegardfamily.com/"
    );
    const [loading, setLoading] = useState<boolean>(false);
    const [results, setResults] = useState<
        BasicApiResponse | DetailedApiResponse | null
    >(null);
    const [error, setError] = useState<string | null>(null);

    // Change this to your actual API base URL

    const handleAnalyze = async (): Promise<void> => {
        if (!companyUrl.trim()) {
            setError("Please enter a company URL");
            return;
        }

        setLoading(true);
        setError(null);
        setResults(null);

        await onCall(companyUrl);

        setLoading(false);
    };

    const validateUrl = (url: string): boolean => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setCompanyUrl(e.target.value);
    };

    const isDetailedResponse = (
        response: BasicApiResponse | DetailedApiResponse
    ): response is DetailedApiResponse => {
        return "additionalInfo" in response;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        LeadGenAI
                    </h1>
                    <p className="text-lg text-gray-600">
                        Analyze companies and call customer leads
                    </p>
                </div>

                {/* Input Section */}
                <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                    <div className="flex flex-col space-y-6">
                        <div>
                            <label
                                htmlFor="companyUrl"
                                className="block text-sm font-medium text-gray-700 mb-2">
                                Company Website URL
                            </label>
                            <div className="relative">
                                <input
                                    type="url"
                                    id="companyUrl"
                                    value={companyUrl}
                                    onChange={handleUrlChange}
                                    placeholder="https://example-company.com"
                                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        companyUrl && !validateUrl(companyUrl)
                                            ? "border-red-300"
                                            : "border-gray-300"
                                    }`}
                                />
                                <Building className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                            </div>
                            {companyUrl && !validateUrl(companyUrl) && (
                                <p className="mt-1 text-sm text-red-600">
                                    Please enter a valid URL
                                </p>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={handleAnalyze}
                                disabled={
                                    loading ||
                                    !companyUrl ||
                                    !validateUrl(companyUrl)
                                }
                                className="cursor-pointer flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors">
                                {loading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Search className="h-5 w-5" />
                                )}
                                Call customers
                            </button>
                        </div>
                    </div>
                </div>

                {/* Error Display */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
                    <div className="flex items-center gap-3">
                        <div>{JSON.stringify(leads, null, 2)}</div>
                    </div>
                </div>

                {/* Results Display */}
                {results && (
                    <div className="space-y-8">
                        {/* Success Message */}
                        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                            <div className="flex items-center gap-3">
                                <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                                <div>
                                    <h3 className="text-lg font-semibold text-green-800">
                                        Analysis Complete!
                                    </h3>
                                    <p className="text-green-700">
                                        Found{" "}
                                        {results.data?.potentialCustomers
                                            ?.length || 0}{" "}
                                        potential leads
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Company Analysis */}
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <Building className="h-7 w-7 text-blue-600 flex-shrink-0" />
                                Company Analysis
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-2">
                                        Industry
                                    </h3>
                                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                                        {results.data?.industry ||
                                            "Not provided"}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="font-semibold text-gray-700 mb-2">
                                        Target Customer Profile
                                    </h3>
                                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                                        {results.data?.targetCustomerProfile ||
                                            "Not provided"}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6">
                                <h3 className="font-semibold text-gray-700 mb-2">
                                    Company Description
                                </h3>
                                <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                                    {results.data?.companyDescription ||
                                        "Not provided"}
                                </p>
                            </div>

                            {/* Additional Info for Detailed Analysis */}
                            {isDetailedResponse(results) &&
                                results.additionalInfo && (
                                    <div className="mt-6 pt-6 border-t">
                                        <h3 className="font-semibold text-gray-700 mb-4">
                                            Additional Insights
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {results.additionalInfo
                                                .companyName && (
                                                <div>
                                                    <span className="font-medium">
                                                        Company Name:
                                                    </span>
                                                    <span className="ml-2 text-gray-600">
                                                        {
                                                            results
                                                                .additionalInfo
                                                                .companyName
                                                        }
                                                    </span>
                                                </div>
                                            )}
                                            {results.additionalInfo
                                                .keyProducts &&
                                                results.additionalInfo
                                                    .keyProducts.length > 0 && (
                                                    <div>
                                                        <span className="font-medium">
                                                            Key Products:
                                                        </span>
                                                        <span className="ml-2 text-gray-600">
                                                            {results.additionalInfo.keyProducts.join(
                                                                ", "
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                            {results.additionalInfo
                                                .competitors &&
                                                results.additionalInfo
                                                    .competitors.length > 0 && (
                                                    <div className="col-span-full">
                                                        <span className="font-medium">
                                                            Competitors:
                                                        </span>
                                                        <span className="ml-2 text-gray-600">
                                                            {results.additionalInfo.competitors.join(
                                                                ", "
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                )}
                        </div>

                        {/* Customer Leads */}
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <Users className="h-7 w-7 text-green-600 flex-shrink-0" />
                                Potential Customer Leads (
                                {results.data?.potentialCustomers?.length || 0})
                            </h2>

                            {results.data?.potentialCustomers &&
                            results.data.potentialCustomers.length > 0 ? (
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {results.data.potentialCustomers.map(
                                        (
                                            customer: CustomerLead,
                                            index: number
                                        ) => (
                                            <div
                                                key={`customer-${index}`}
                                                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900">
                                                            {customer.name}
                                                        </h3>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Phone className="h-4 w-4 flex-shrink-0" />
                                                        <a
                                                            href={`tel:${customer.phoneNumber}`}
                                                            className="hover:text-blue-600 transition-colors">
                                                            {
                                                                customer.phoneNumber
                                                            }
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-8">
                                    No leads found
                                </p>
                            )}
                        </div>

                        {/* Raw JSON Response (for debugging) */}
                        <details className="bg-gray-50 rounded-xl p-6">
                            <summary className="cursor-pointer font-semibold text-gray-700 mb-4">
                                Raw API Response (for debugging)
                            </summary>
                            <pre className="bg-white p-4 rounded-lg overflow-auto text-sm">
                                {JSON.stringify(results, null, 2)}
                            </pre>
                        </details>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeadGenerationTester;
