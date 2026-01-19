import { Button } from "@/components/ui/button";
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

const FriendRequestForm = () => {
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

    sendFriendRequest(data.receiverTag?.trim() ?? "", () => {
      reset({ receiverTag: "" });
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
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Requesting..." : "Add Friend"}
        </Button>
      </div>
      {errors.receiverTag && (
        <p className="text-xs text-destructive">{errors.receiverTag.message}</p>
      )}
    </form>
  );
};

export default FriendRequestForm;
