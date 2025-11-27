import { FriendRequest } from "@/hooks/useFriendRequests";

interface PendingRequestsProps {
  sentRequests: FriendRequest[];
}

const PendingRequests = ({ sentRequests }: PendingRequestsProps) => {
  return (
    <>
      {sentRequests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-muted-foreground flex items-center gap-2">
            Pending Requests
          </h2>
          {sentRequests.map((request) => (
            <div
              key={request._id}
              className="group relative flex items-center justify-between gap-4 rounded-xl border bg-background/50 p-4 opacity-60"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold">
                  {request.receiverId.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{request.receiverId}</p>
                  <p className="text-xs text-muted-foreground">
                    Request pending
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex h-9 items-center justify-center rounded-full bg-muted/50 px-3 text-xs text-muted-foreground">
                  Cancel
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default PendingRequests;
