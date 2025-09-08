import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface CallData {
    id: string;
    phoneNumberId: string;
    type: string;
    startedAt: string;
    endedAt: string;
    transcript: string;
    recordingUrl: string;
    summary: string;
    createdAt: string;
    updatedAt: string;
    orgId: string;
    cost: number;
    customer: {
        number: string;
    };
    status: string;
    endedReason: string;
    messages: any[];
    stereoRecordingUrl: string;
    costBreakdown: {
        transport: number;
    };
}

export default function CallDetails() {
    const { id } = useParams<{ id: string }>();
    const [callData, setCallData] = useState<CallData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchCallData = async () => {
            try {
                setLoading(true);
                const response = await fetch(
                    `http://localhost:3001/api/call/calls/${id}`
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                setCallData(data);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Failed to fetch call data"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchCallData();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading call details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 text-6xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Error Loading Call
                    </h1>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Link to="/">
                        <Button variant="outline">← Back to Home</Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (!callData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-gray-600 text-6xl mb-4">❓</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Call Not Found
                    </h1>
                    <p className="text-gray-600 mb-4">
                        The call you're looking for doesn't exist.
                    </p>
                    <Link to="/">
                        <Button variant="outline">← Back to Home</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "completed":
                return "bg-green-100 text-green-800";
            case "in-progress":
                return "bg-yellow-100 text-yellow-800";
            case "failed":
                return "bg-red-100 text-red-800";
            case "scheduled":
                return "bg-blue-100 text-blue-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const formatDuration = (seconds?: number) => {
        if (!seconds) return "N/A";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Call Details
                        </h1>
                        <p className="text-gray-600">Call ID: {id}</p>
                    </div>
                    <Link to="/">
                        <Button variant="outline">← Back to Home</Button>
                    </Link>
                </div>

                {/* Call Information Card */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Call Information</span>
                            <Badge className={getStatusColor(callData.status)}>
                                {callData.status}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        Phone Number
                                    </label>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {callData.phoneNumberId}
                                    </p>
                                </div>
                                {callData.customer && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">
                                            Customer Number
                                        </label>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {callData.customer.number}
                                        </p>
                                    </div>
                                )}
                                {callData.endedReason && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">
                                            Ended Reason
                                        </label>
                                        <p className="text-lg font-semibold text-gray-900">
                                            {callData.endedReason}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        Created At
                                    </label>
                                    <p className="text-sm text-gray-900">
                                        {formatDate(callData.createdAt)}
                                    </p>
                                </div>
                                {callData.startedAt && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">
                                            Started At
                                        </label>
                                        <p className="text-sm text-gray-900">
                                            {formatDate(callData.startedAt)}
                                        </p>
                                    </div>
                                )}
                                {callData.endedAt && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">
                                            Ended At
                                        </label>
                                        <p className="text-sm text-gray-900">
                                            {formatDate(callData.endedAt)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Call Details Card */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Call Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* <div> */}
                            {/* <label className="text-sm font-medium text-gray-500">
                                    Duration
                                </label>
                                <p className="text-lg font-semibold text-gray-900">
                                    {formatDuration(
                                        callData.endedAt
                                            ? new Date(
                                                  callData.endedAt
                                              ).getTime() -
                                                  new Date(
                                                      callData.startedAt
                                                  ).getTime()
                                            : 0
                                    )}
                                </p>
                            </div>
                            {callData.cost && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        Cost
                                    </label>
                                    <p className="text-lg font-semibold text-gray-900">
                                        ${callData.cost.toFixed(4)}
                                    </p>
                                </div>
                            )} */}
                        </div>
                        {callData.summary && (
                            <div className="mt-4">
                                <label className="text-sm font-medium text-gray-500">
                                    Summary
                                </label>
                                <p className="text-gray-900 mt-1">
                                    {callData.summary}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Transcript Card */}
                {callData.transcript && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Call Transcript</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-gray-900 whitespace-pre-wrap font-mono text-sm">
                                    {callData.transcript ||
                                        "No transcript available"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Technical Details Card */}
                {/* <Card>
                    <CardHeader>
                        <CardTitle>Technical Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">
                                    Call ID
                                </label>
                                <p className="text-sm font-mono text-gray-900 bg-gray-100 p-2 rounded">
                                    {callData.id}
                                </p>
                            </div>
                            {callData.recordingUrl && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        Recording URL
                                    </label>
                                    <p className="text-sm font-mono text-gray-900 bg-gray-100 p-2 rounded">
                                        <a
                                            href={callData.recordingUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="underline">
                                            {callData.recordingUrl}
                                        </a>
                                    </p>
                                </div>
                            )}
                            {callData.stereoRecordingUrl && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500">
                                        Stereo Recording URL
                                    </label>
                                    <p className="text-sm font-mono text-gray-900 bg-gray-100 p-2 rounded">
                                        <a
                                            href={callData.stereoRecordingUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="underline">
                                            {callData.stereoRecordingUrl}
                                        </a>
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card> */}
            </div>
        </div>
    );
}
