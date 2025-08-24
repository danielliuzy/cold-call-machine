import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
// import { Badge } from "./ui/badge";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { makeCall } from "../lib/vapi-client";
import type { ContactInfo } from "../lib/vapi-client";
import type { Id } from "../../convex/_generated/dataModel";

interface CallManagerProps {
    urlId: Id<"urls">;
    contactInfo: ContactInfo[];
}

export function CallManager({ urlId, contactInfo }: CallManagerProps) {
    const [isMakingCall, setIsMakingCall] = useState(false);
    const [selectedContact, setSelectedContact] = useState<ContactInfo | null>(
        null
    );

    const scheduleCall = useMutation(api.vapi.scheduleCall);
    const updateCallStatus = useMutation(api.vapi.updateCallStatus);
    const calls = useQuery(api.vapi.getCallsForUrl, { urlId });
    const callStats = useQuery(api.vapi.getCallStats);

    const handleMakeCall = async (contact: ContactInfo) => {
        if (!contact.phoneNumber) {
            alert("No phone number available for this contact");
            return;
        }

        setIsMakingCall(true);
        setSelectedContact(contact);

        try {
            // Make the call via Vapi
            const vapiCallId = await makeCall({
                phoneNumber: contact.phoneNumber,
                contactName: contact.name,
                businessName: contact.business,
            });

            // Schedule the call in our database
            const callId = await scheduleCall({
                urlId,
                contactId: contact.name, // Using name as contact ID for simplicity
                phoneNumber: contact.phoneNumber,
                scheduledAt: Date.now(),
            });

            // Update call status to in-progress
            await updateCallStatus({
                callId,
                status: "in-progress",
                startedAt: Date.now(),
                vapiCallId,
            });

            alert(
                `Call initiated to ${contact.name} at ${contact.phoneNumber}`
            );
        } catch (error) {
            console.error("Error making call:", error);
            alert(`Failed to make call: ${error}`);
        } finally {
            setIsMakingCall(false);
            setSelectedContact(null);
        }
    };

    // const getStatusColor = (status: string) => {
    //     switch (status) {
    //         case "scheduled":
    //             return "bg-blue-100 text-blue-800";
    //         case "in-progress":
    //             return "bg-yellow-100 text-yellow-800";
    //         case "completed":
    //             return "bg-green-100 text-green-800";
    //         case "failed":
    //             return "bg-red-100 text-red-800";
    //         default:
    //             return "bg-gray-100 text-gray-800";
    //     }
    // };

    return (
        <div className="space-y-6">
            {/* Call Statistics */}
            {callStats && (
                <Card>
                    <CardHeader>
                        <CardTitle>Call Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {callStats.total}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Total Calls
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {callStats.scheduled}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Scheduled
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600">
                                    {callStats.inProgress}
                                </div>
                                <div className="text-sm text-gray-600">
                                    In Progress
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {callStats.completed}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Completed
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">
                                    {callStats.failed}
                                </div>
                                <div className="text-sm text-gray-600">
                                    Failed
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Contact Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {contactInfo.map((contact, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg">
                                        {contact.name}
                                    </h3>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        {contact.phoneNumber && (
                                            <div>📞 {contact.phoneNumber}</div>
                                        )}
                                        {contact.email && (
                                            <div>✉️ {contact.email}</div>
                                        )}
                                        {contact.business && (
                                            <div>🏢 {contact.business}</div>
                                        )}
                                        {contact.address && (
                                            <div>📍 {contact.address}</div>
                                        )}
                                        {contact.notes && (
                                            <div>📝 {contact.notes}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Button
                                        onClick={() => handleMakeCall(contact)}
                                        disabled={
                                            isMakingCall || !contact.phoneNumber
                                        }
                                        className="w-full">
                                        {isMakingCall &&
                                        selectedContact === contact
                                            ? "Making Call..."
                                            : "📞 Call Now"}
                                    </Button>
                                    <Button
                                        onClick={() =>
                                            scheduleCall({
                                                urlId,
                                                contactId: contact.name,
                                                phoneNumber:
                                                    contact.phoneNumber,
                                                scheduledAt: Date.now() + 60000, // Schedule for 1 minute from now
                                            })
                                        }
                                        disabled={!contact.phoneNumber}
                                        variant="outline"
                                        className="w-full">
                                        ⏰ Schedule Call
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Call History */}
            {calls && calls.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Call History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {calls.map((call) => (
                                <div
                                    key={call._id}
                                    className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex-1">
                                        <div className="font-medium">
                                            {call.phoneNumber}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {new Date(
                                                call.scheduledAt
                                            ).toLocaleString()}
                                        </div>
                                    </div>
                                    {/* <div className="flex items-center gap-2">
                                        <Badge
                                            className={getStatusColor(
                                                call.status
                                            )}>
                                            {call.status}
                                        </Badge>
                                        {call.outcome && (
                                            <Badge variant="secondary">
                                                {call.outcome}
                                            </Badge>
                                        )}
                                    </div> */}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
