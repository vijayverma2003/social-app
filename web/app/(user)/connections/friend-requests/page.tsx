"use client";

import { useFriendRequests } from "@/hooks/useFriendRequests";
import { Check, UserPlus, X } from "lucide-react";
import { useState } from "react";

interface FriendRequest {
  _id: string;
  senderId: string;
  receiverId: string;
  createdAt: Date;
}

const FriendRequestsPage = () => {
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [message, setMessage] = useState("");

  const { acceptFriendRequest, rejectFriendRequest } = useFriendRequests({
    onFriendRequestReceived: (request) =>
      setReceivedRequests((prev) => [...prev, request]),
    onFriendRequestAccepted: (request) =>
      setReceivedRequests((prev) => prev.filter((r) => r._id !== request._id)),
    onFriendRequestRejected: (request) =>
      setReceivedRequests((prev) => prev.filter((r) => r._id !== request._id)),
  });

  const handleAccept = async (requestId: string) => {
    const response = await acceptFriendRequest(requestId);
    if (response.error) {
      setMessage(`Error: ${response.error}`);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleReject = async (requestId: string) => {
    const response = await rejectFriendRequest(requestId);
    if (response.error) {
      setMessage(`Error: ${response.error}`);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {message && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-lg border bg-background/95 backdrop-blur-sm px-4 py-3 shadow-lg">
          <p className="text-sm">{message}</p>
        </div>
      )}

      <div className="space-y-3">
        {receivedRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <UserPlus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg mb-1">No friend requests</h3>
            <p className="text-sm text-muted-foreground">
              When someone sends you a friend request, it will appear here
            </p>
          </div>
        ) : (
          receivedRequests.map((request) => (
            <div
              key={request._id}
              className="group relative flex items-center justify-between gap-4 rounded-xl border bg-background/50 p-4 transition-all hover:bg-accent/5 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                  {request.senderId.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{request.senderId}</p>
                  <p className="text-xs text-muted-foreground">
                    wants to connect
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAccept(request._id)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500/10 text-green-600 transition-all hover:bg-green-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Accept"
                >
                  <Check className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleReject(request._id)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10 text-red-600 transition-all hover:bg-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Reject"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FriendRequestsPage;
