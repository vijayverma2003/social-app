import { Input } from "@/components/ui/input";
import { useFriendActions } from "@/features/friends/hooks/useFriendActions";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  SendFriendRequestPayloadSchema,
  type SendFriendRequestPayload,
} from "@shared/schemas/friends";
import { FriendRequests } from "@shared/types/responses";
import React from "react";
import { useForm } from "react-hook-form";

interface FriendRequestFormProps {
  onFriendRequestSent: (newRequest: FriendRequests) => void;
}

const FriendRequestForm = ({ onFriendRequestSent }: FriendRequestFormProps) => {
  const [message, setMessage] = React.useState("");
  const { sendFriendRequest } = useFriendActions();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SendFriendRequestPayload>({
    resolver: zodResolver(SendFriendRequestPayloadSchema),
    defaultValues: {
      receiverTag: "",
    },
  });

  const handleSendRequest = async (data: SendFriendRequestPayload) => {
    if (isSubmitting) return;

    sendFriendRequest(data.receiverTag.trim(), (response) => {
      if (response.error) {
        setMessage(`Error: ${response.error}`);
        setTimeout(() => setMessage(""), 3000);
      } else if (response.success && response.data) {
        setMessage("Friend request sent successfully!");
        setTimeout(() => setMessage(""), 3000);
        reset({ receiverTag: "" });
        onFriendRequestSent(response.data);
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit(handleSendRequest)}
      className="flex flex-col gap-2"
    >
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter friend tag (username#0000)"
          className="flex-1"
          disabled={isSubmitting}
          aria-invalid={!!errors.receiverTag}
          {...register("receiverTag")}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Requesting..." : "Add Friend"}
        </button>
      </div>
      {errors.receiverTag && (
        <p className="text-xs text-destructive">{errors.receiverTag.message}</p>
      )}
      {message && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {message}
        </p>
      )}
    </form>
  );
};

export default FriendRequestForm;
