"use client";

import { Button } from "@/components/ui/button";
import { useMessageRequestsStore } from "@/stores/messageRequestsStore";
import { ConversationPreview } from "@/features/posts/components/ConversationPreview";
import { cn } from "@/lib/utils";
import { useUser } from "@/providers/UserContextProvider";
import { MessageCircle, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  acceptMessageRequest,
  rejectMessageRequest,
} from "@/services/messagesService";
import { toast } from "sonner";

const MessageRequestsPage = () => {
  const { requests, removeRequestById } = useMessageRequestsStore();
  const { user } = useUser();
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  );

  const selectedRequest = useMemo(
    () => requests.find((r) => r.id === selectedRequestId) || null,
    [requests, selectedRequestId]
  );

  const handlePreview = (id: string) => {
    setSelectedRequestId(id);
  };

  const handleClosePreview = () => {
    setSelectedRequestId(null);
  };

  const handleAccept = async () => {
    if (!selectedRequest) return;

    try {
      await acceptMessageRequest({
        messageRequestId: selectedRequest.id,
      });
      // Remove the request from the store (channel is now added to dmChannelsStore)
      removeRequestById(selectedRequest.id);
      setSelectedRequestId(null);
      toast.success("Message request accepted");
    } catch (error) {
      console.error("Failed to accept message request:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to accept message request"
      );
    }
  };

  const handleIgnore = async () => {
    if (!selectedRequest) return;

    try {
      await rejectMessageRequest({
        messageRequestId: selectedRequest.id,
      });
      // Remove the request from the store
      removeRequestById(selectedRequest.id);
      setSelectedRequestId(null);
      toast.success("Message request rejected");
    } catch (error) {
      console.error("Failed to reject message request:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to reject message request"
      );
    }
  };

  return (
    <div className="flex h-full p-6 gap-6">
      {/* Left: Message Requests List */}
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-xl font-semibold">Message Requests</h1>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You don&apos;t have any message requests yet.
          </p>
        ) : (
          <div className="space-y-3">
            {requests.map((request) => {
              const isSelected = request.id === selectedRequestId;
              const isIncoming = request.receiverId === user?.id;

              return (
                <button
                  key={request.id}
                  onClick={() => handlePreview(request.id)}
                  className={cn(
                    "w-full text-left rounded-xl border bg-background/50 p-4 flex items-center justify-between gap-3 cursor-pointer transition-colors",
                    isSelected && "border-primary/70 bg-primary/5"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="inline-flex size-10 items-center justify-center rounded-full bg-secondary">
                      <MessageCircle className="size-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        Message request
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isIncoming
                          ? "Someone wants to message you"
                          : "You started a message request"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Preview
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: Preview Panel */}
      <div className="flex-1 flex flex-col">
        {selectedRequest ? (
          <div className="h-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Message Request Preview
              </h2>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleClosePreview}
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="flex-1">
              <ConversationPreview
                channelId={selectedRequest.channelId}
                onClose={handleClosePreview}
                title="Message Request"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={handleIgnore}
              >
                Ignore
              </Button>
              <Button
                variant="default"
                className="cursor-pointer"
                onClick={handleAccept}
              >
                Accept
              </Button>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
            Select a message request on the left to preview it here.
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageRequestsPage;

