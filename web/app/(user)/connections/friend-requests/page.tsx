"use client";

import { useFriendRequests } from "@/hooks/useFriendRequests";
import { friendsService } from "@/services/friends";
import { useFriendRequestsStore } from "@/store/friendRequestsStore";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import FriendRequestForm from "./components/FriendRequestForm";
import PendingRequests from "./components/PendingRequests";
import ReceivedRequests from "./components/ReceivedRequests";

const FriendRequestsPage = () => {
  const [message, setMessage] = useState("");
  const { getToken } = useAuth();

  const {
    received,
    sent,
    isLoading,
    setInitialRequests,
    addReceivedRequest,
    addSentRequest,
    removeRequestById,
    setLoading,
  } = useFriendRequestsStore();

  const { sendFriendRequest, acceptFriendRequest, rejectFriendRequest } =
    useFriendRequests({
      onFriendRequestReceived: addReceivedRequest,
      onFriendRequestAccepted: (request) => removeRequestById(request._id),
      onFriendRequestRejected: (request) => removeRequestById(request._id),
    });

  async function loadFriendRequests() {
    try {
      setLoading(true);
      const token = await getToken();
      const data = await friendsService.getFriendRequests(token || undefined);
      setInitialRequests(data.incoming, data.outgoing);
    } catch (error) {
      console.error("Failed to load friend requests:", error);
      setMessage("Failed to load friend requests");
      setTimeout(() => setMessage(""), 3000);
      setLoading(false);
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
    } else {
      removeRequestById(requestId);
    }
  }

  async function handleReject(requestId: string) {
    const response = await rejectFriendRequest(requestId);
    if (response.error) {
      setMessage(`Error: ${response.error}`);
      setTimeout(() => setMessage(""), 3000);
    } else {
      removeRequestById(requestId);
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
        onFriendRequestSent={addSentRequest}
      />

      <ReceivedRequests
        receivedRequests={received}
        onAccept={handleAccept}
        onReject={handleReject}
      />

      <PendingRequests sentRequests={sent} />
    </div>
  );
};

export default FriendRequestsPage;
