"use client";

import { NotificationBadge } from "@/components/ui/notification-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FriendRequestForm from "@/features/friends/components/FriendRequestForm";
import FriendsList from "@/features/friends/components/FriendsList";
import PendingRequests from "@/features/friends/components/PendingRequests";
import ReceivedRequests from "@/features/friends/components/ReceivedRequests";
import { useFriendActions } from "@/features/friends/hooks/useFriendActions";
import { useFriendRequestsStore } from "@/features/friends/store/friendRequestsStore";
import { useFriendsStore } from "@/features/friends/store/friendsStore";
import { useState } from "react";

const FriendsPage = () => {
  const [message, setMessage] = useState("");
  const { friends } = useFriendsStore();
  const { received, sent, addSentRequest, removeRequestById } =
    useFriendRequestsStore();
  const { acceptFriendRequest, rejectFriendRequest, cancelFriendRequest } =
    useFriendActions();

  const handleAccept = (requestId: string) => {
    acceptFriendRequest(requestId, (response) => {
      if (response.error) {
        setMessage(`Error: ${response.error}`);
        setTimeout(() => setMessage(""), 3000);
      } else {
        removeRequestById(requestId);
      }
    });
  };

  const handleReject = (requestId: string) => {
    rejectFriendRequest(requestId, (response) => {
      if (response.error) {
        setMessage(`Error: ${response.error}`);
        setTimeout(() => setMessage(""), 3000);
      } else {
        removeRequestById(requestId);
      }
    });
  };

  const handleCancel = (requestId: string) => {
    cancelFriendRequest(requestId, (response) => {
      if (response.error) {
        setMessage(`Error: ${response.error}`);
        setTimeout(() => setMessage(""), 3000);
      } else {
        removeRequestById(requestId);
      }
    });
  };

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
            <FriendRequestForm onFriendRequestSent={addSentRequest} />
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
