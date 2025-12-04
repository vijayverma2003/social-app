"use client";

import { NotificationBadge } from "@/components/ui/notification-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FriendRequestForm from "@/features/friends/components/FriendRequestForm";
import FriendsList from "@/features/friends/components/FriendsList";
import PendingRequests from "@/features/friends/components/PendingRequests";
import ReceivedRequests from "@/features/friends/components/ReceivedRequests";
import { useFriendRequestsStore } from "@/features/friends/store/friendRequestsStore";
import { useFriendsStore } from "@/features/friends/store/friendsStore";

const FriendsPage = () => {
  const { friends } = useFriendsStore();
  const { received, sent } = useFriendRequestsStore();

  return (
    <div className="max-w-2xl space-y-4 py-2">
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
            <ReceivedRequests receivedRequests={received} />
          )}
        </TabsContent>

        <TabsContent value="outgoing" className="mt-4 space-y-6">
          <div>
            <h2 className="text-sm text-muted-foreground font-bold mb-4">
              Send Friend Request
            </h2>
            <FriendRequestForm />
          </div>
          {sent.length > 0 && (
            <div>
              <PendingRequests sentRequests={sent} />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FriendsPage;
