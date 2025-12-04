"use client";

import { getFriends } from "@/services/friends";
import { useFriendsStore } from "@/store/friendsStore";
import { useFriendRequestsStore } from "@/store/friendRequestsStore";
import { useFriendActions } from "@/hooks/useFriendActions";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { NotificationBadge } from "@/components/ui/notification-badge";
import FriendsList from "./components/FriendsList";
import ReceivedRequests from "./components/ReceivedRequests";
import PendingRequests from "./components/PendingRequests";
import FriendRequestForm from "./components/FriendRequestForm";

const FriendsPage = () => {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const { friends, setFriends } = useFriendsStore();
  const { received, sent, addSentRequest, removeRequestById } =
    useFriendRequestsStore();
  const {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
  } = useFriendActions();

  useEffect(() => {
    const loadFriends = async () => {
      try {
        setIsLoading(true);
        const token = await getToken();
        const response = await getFriends(token || undefined);
        setFriends(response.data ?? []);
      } catch (err) {
        console.error("Failed to load friends:", err);
        setError("Failed to load friends");
      } finally {
        setIsLoading(false);
      }
    };

    loadFriends();
  }, [getToken, setFriends]);

  const handleAccept = async (requestId: string) => {
    const response = await acceptFriendRequest(requestId);
    if (response.error) {
      setMessage(`Error: ${response.error}`);
      setTimeout(() => setMessage(""), 3000);
    } else {
      removeRequestById(requestId);
    }
  };

  const handleReject = async (requestId: string) => {
    const response = await rejectFriendRequest(requestId);
    if (response.error) {
      setMessage(`Error: ${response.error}`);
      setTimeout(() => setMessage(""), 3000);
    } else {
      removeRequestById(requestId);
    }
  };

  const handleCancel = async (requestId: string) => {
    const response = await cancelFriendRequest(requestId);
    if (response.error) {
      setMessage(`Error: ${response.error}`);
      setTimeout(() => setMessage(""), 3000);
    } else {
      removeRequestById(requestId);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading friends...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4 py-2">
      {message && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-lg border bg-background/95 backdrop-blur-sm px-4 py-3 shadow-lg">
          <p className="text-sm">{message}</p>
        </div>
      )}

      <Tabs defaultValue="friends" className="w-full">
        <TabsList>
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="received" className="relative">
            Friend Requests
            {received.length > 0 && (
              <NotificationBadge count={received.length} className="ml-2" />
            )}
          </TabsTrigger>
          <TabsTrigger value="outgoing">Add Friend</TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="mt-4">
          {friends.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You don't have any friends yet. Send a friend request to get
              started!
            </p>
          ) : (
            <div className="space-y-3">
              <FriendsList friends={friends} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="received" className="mt-4">
          {received.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No incoming friend requests at the moment.
            </p>
          ) : (
            <ReceivedRequests
              receivedRequests={received}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          )}
        </TabsContent>

        <TabsContent value="outgoing" className="mt-4 space-y-6">
          <div>
            <h2 className="text-sm text-muted-foreground font-bold mb-4">
              Send Friend Request
            </h2>
            <FriendRequestForm
              sendFriendRequest={sendFriendRequest}
              onFriendRequestSent={addSentRequest}
            />
          </div>
          {sent.length > 0 && (
            <div>
              <PendingRequests sentRequests={sent} onCancel={handleCancel} />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FriendsPage;
