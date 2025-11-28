import { Button } from "@/components/ui/button";
import { FriendRequest } from "@/services/friends";
import { Check, X } from "lucide-react";

interface ReceivedRequestsProps {
  receivedRequests: FriendRequest[];
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

const ReceivedRequests = ({
  receivedRequests,
  onAccept,
  onReject,
}: ReceivedRequestsProps) => {
  return (
    <div>
      {receivedRequests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs text-muted-foreground font-bold flex items-center gap-2">
            Incoming Requests
          </h2>
          {receivedRequests.map((request) => (
            <div
              key={request._id}
              className="group relative flex items-center justify-between gap-4 rounded-xl bg-accent/50 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                  {request?.senderAvatarURL ??
                    request.senderId.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {request?.senderUsername ?? request.senderId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    wants to connect
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => onAccept(request._id)}
                  variant="outline"
                  size="icon"
                  title="Accept"
                >
                  <Check className="h-5 w-5 text-green-500" />
                </Button>
                <Button
                  onClick={() => onReject(request._id)}
                  variant="outline"
                  size="icon"
                  title="Reject"
                >
                  <X className="h-5 w-5 text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReceivedRequests;
