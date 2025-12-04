"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FriendRequests, SocketResponse } from "@shared/types";
import { X } from "lucide-react";
import { useState } from "react";
import { useFriendRequestsStore } from "@/features/friends/store/friendRequestsStore";

interface PendingRequestsProps {
  sentRequests: FriendRequests[];
  onCancel: (
    requestId: string,
    callback: (response: SocketResponse<{ requestId: string }>) => void
  ) => void;
}

const PendingRequests = ({ sentRequests, onCancel }: PendingRequestsProps) => {
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const { removeRequestById } = useFriendRequestsStore();
  const handleCancel = async (requestId: string) => {
    if (cancelingId === requestId) return;
    setCancelingId(requestId);
    try {
      onCancel(requestId, (response: SocketResponse<{ requestId: string }>) => {
        if (response.error) {
          console.log(response.error);
        } else {
          removeRequestById(requestId);
        }
      });
    } finally {
      setCancelingId(null);
    }
  };

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
                  onClick={() => handleCancel(request.id)}
                  variant="outline"
                  size="sm"
                  disabled={cancelingId === request.id}
                  className="h-9"
                >
                  {cancelingId === request.id ? (
                    "Canceling..."
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </>
                  )}
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
