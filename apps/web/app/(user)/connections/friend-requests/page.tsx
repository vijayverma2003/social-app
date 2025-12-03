"use client";

import { useFriendActions } from "@/hooks/useFriendActions";
import { useFriendRequestsStore } from "@/store/friendRequestsStore";
import { useState } from "react";
import FriendRequestForm from "./components/FriendRequestForm";
import PendingRequests from "./components/PendingRequests";
import ReceivedRequests from "./components/ReceivedRequests";

const FriendRequestsPage = () => {
  const [message, setMessage] = useState("");

  const { received, sent, isLoading, addSentRequest, removeRequestById } =
    useFriendRequestsStore();

  const { sendFriendRequest, acceptFriendRequest, rejectFriendRequest } =
    useFriendActions();

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
