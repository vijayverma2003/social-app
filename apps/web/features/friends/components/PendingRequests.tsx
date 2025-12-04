"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FriendRequests } from "@shared/types";
import { X } from "lucide-react";
import { useFriendActions } from "@/features/friends/hooks/useFriendActions";

interface PendingRequestsProps {
  sentRequests: FriendRequests[];
}

const PendingRequests = ({ sentRequests }: PendingRequestsProps) => {
  const { cancelFriendRequest } = useFriendActions();

  return (
    <>
      {sentRequests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-muted-foreground flex items-center gap-2">
            Pending Requests
          </h2>
          {sentRequests.map((request) => (
            <div
              key={request.id}
              className="group relative flex items-center justify-between gap-4 rounded-xl border bg-background/50 p-4"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={request.profile?.avatarURL || ""} />
                  <AvatarFallback>
                    {request.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {request.username}#{request.discriminator}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Request pending
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => cancelFriendRequest(request.id)}
                  variant="outline"
                  size="sm"
                  className="h-9"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default PendingRequests;
