"use client";

import { FriendRequest, useFriendRequests } from "@/hooks/useFriendRequests";
import { friendsService } from "@/services/friends";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import FriendRequestForm from "./components/FriendRequestForm";
import ReceivedRequests from "./components/ReceivedRequests";
import PendingRequests from "./components/PendingRequests";

const FriendRequestsPage = () => {
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();

  const { sendFriendRequest, acceptFriendRequest, rejectFriendRequest } =
    useFriendRequests({
      onFriendRequestReceived: handleFriendRequestReceived,
      onFriendRequestAccepted: handleFriendRequestAccepted,
      onFriendRequestRejected: handleFriendRequestRejected,
    });

  function handleFriendRequestReceived(request: FriendRequest) {
    setReceivedRequests((prev) => [...prev, request]);
  }

  function handleFriendRequestAccepted(request: FriendRequest) {
    setReceivedRequests((prev) => prev.filter((r) => r._id !== request._id));
    setSentRequests((prev) => prev.filter((r) => r._id !== request._id));
  }

  function handleFriendRequestRejected(request: FriendRequest) {
    setReceivedRequests((prev) => prev.filter((r) => r._id !== request._id));
    setSentRequests((prev) => prev.filter((r) => r._id !== request._id));
  }

  async function loadFriendRequests() {
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
  }

  useEffect(() => {
    loadFriendRequests();
  }, [getToken]);

  async function handleAccept(requestId: string) {
    const response = await acceptFriendRequest(requestId);
    if (response.error) {
      setMessage(`Error: ${response.error}`);
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function handleReject(requestId: string) {
    const response = await rejectFriendRequest(requestId);
    if (response.error) {
      setMessage(`Error: ${response.error}`);
      setTimeout(() => setMessage(""), 3000);
    }
  }

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
    <div className="max-w-2xl space-y-6">
      {message && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-lg border bg-background/95 backdrop-blur-sm px-4 py-3 shadow-lg">
          <p className="text-sm">{message}</p>
        </div>
      )}

      <FriendRequestForm
        sendFriendRequest={sendFriendRequest}
        onFriendRequestSent={(newRequest: FriendRequest) =>
          setSentRequests((prev) => [...prev, newRequest])
        }
      />

      <ReceivedRequests
        receivedRequests={receivedRequests}
        onAccept={handleAccept}
        onReject={handleReject}
      />

      <PendingRequests sentRequests={sentRequests} />
    </div>
  );
};

export default FriendRequestsPage;
