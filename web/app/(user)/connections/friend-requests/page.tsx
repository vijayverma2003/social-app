"use client";

import { useFriendRequests } from "@/hooks/useFriendRequests";
import { Check, Send, UserPlus, X, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { friendsService } from "@/services/friends";
import { useAuth } from "@clerk/nextjs";

interface FriendRequest {
  _id: string;
  senderId: string;
  receiverId: string;
  createdAt: Date;
}

const FriendRequestsPage = () => {
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [message, setMessage] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();

  const { sendFriendRequest, acceptFriendRequest, rejectFriendRequest } =
    useFriendRequests({
      onFriendRequestReceived: (request) =>
        setReceivedRequests((prev) => [...prev, request]),
      onFriendRequestAccepted: (request) => {
        setReceivedRequests((prev) =>
          prev.filter((r) => r._id !== request._id)
        );
        setSentRequests((prev) => prev.filter((r) => r._id !== request._id));
      },
      onFriendRequestRejected: (request) => {
        setReceivedRequests((prev) =>
          prev.filter((r) => r._id !== request._id)
        );
        setSentRequests((prev) => prev.filter((r) => r._id !== request._id));
      },
    });

  useEffect(() => {
    const loadFriendRequests = async () => {
      try {
        const token = await getToken();
        const data = await friendsService.getFriendRequests(token || undefined);
        setReceivedRequests(data.incoming);
        setSentRequests(data.outgoing);
      } catch (error) {
        console.error("Failed to load friend requests:", error);
        setMessage("Failed to load friend requests");
        setTimeout(() => setMessage(""), 3000);
      } finally {
        setIsLoading(false);
      }
    };

    loadFriendRequests();
  }, [getToken]);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverId.trim() || isSending) return;

    setIsSending(true);
    const response = await sendFriendRequest(receiverId.trim());

    if (response.error) {
      setMessage(`Error: ${response.error}`);
      setTimeout(() => setMessage(""), 3000);
    } else if (response.success && response.data) {
      setMessage("Friend request sent successfully!");
      setTimeout(() => setMessage(""), 3000);
      setSentRequests((prev) => [...prev, response.data!]);
      setReceiverId("");
    }

    setIsSending(false);
  };

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

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">
            Loading friend requests...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {message && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-lg border bg-background/95 backdrop-blur-sm px-4 py-3 shadow-lg">
          <p className="text-sm">{message}</p>
        </div>
      )}

      {/* Send Friend Request Section */}
      <div className="rounded-xl border bg-background/50 p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Send Friend Request
        </h2>
        <form onSubmit={handleSendRequest} className="flex gap-2">
          <input
            type="text"
            value={receiverId}
            onChange={(e) => setReceiverId(e.target.value)}
            placeholder="Enter user ID"
            className="flex-1 rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!receiverId.trim() || isSending}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
            {isSending ? "Sending..." : "Send"}
          </button>
        </form>
      </div>

      {/* Received Requests Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Received Requests
        </h2>
        {receivedRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border bg-background/50">
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

      {/* Sent Requests Section */}
      {sentRequests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Requests
          </h2>
          {sentRequests.map((request) => (
            <div
              key={request._id}
              className="group relative flex items-center justify-between gap-4 rounded-xl border bg-background/50 p-4 opacity-60"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold">
                  {request.receiverId.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{request.receiverId}</p>
                  <p className="text-xs text-muted-foreground">
                    Request pending
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex h-9 items-center justify-center rounded-full bg-muted/50 px-3 text-xs text-muted-foreground">
                  Pending
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendRequestsPage;
