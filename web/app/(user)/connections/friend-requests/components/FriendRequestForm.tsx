import {
  FriendRequest,
  FriendRequestSocketResponse,
} from "@/hooks/useFriendRequests";
import { UserPlus, Send } from "lucide-react";
import React from "react";

interface FriendRequestFormProps {
  sendFriendRequest: (
    receiverId: string
  ) => Promise<FriendRequestSocketResponse>;
  onFriendRequestSent: (newRequest: FriendRequest) => void;
}

const FriendRequestForm = ({
  sendFriendRequest,
  onFriendRequestSent,
}: FriendRequestFormProps) => {
  const [receiverId, setReceiverId] = React.useState("");
  const [isRequesting, setIsRequesting] = React.useState(false);
  const [message, setMessage] = React.useState("");

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverId.trim() || isRequesting) return;

    setIsRequesting(true);
    const response = await sendFriendRequest(receiverId.trim());

    if (response.error) {
      setMessage(`Error: ${response.error}`);
      setTimeout(() => setMessage(""), 3000);
    } else if (response.success && response.data) {
      setMessage("Friend request sent successfully!");
      setTimeout(() => setMessage(""), 3000);
      setReceiverId("");
      onFriendRequestSent(response.data);
    }

    setIsRequesting(false);
  };

  return (
    <form onSubmit={handleSendRequest} className="flex gap-2">
      <input
        type="text"
        value={receiverId}
        onChange={(e) => setReceiverId(e.target.value)}
        placeholder="Enter user ID"
        className="flex-1 rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        disabled={isRequesting}
      />
      <button
        type="submit"
        disabled={!receiverId.trim() || isRequesting}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="h-4 w-4" />
        {isRequesting ? "Requesting..." : "Add Friend"}
      </button>
    </form>
  );
};

export default FriendRequestForm;
