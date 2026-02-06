"use client";

import { useEffect } from "react";
import { useSocket } from "@/contexts/socket";
import { useUser } from "@/providers/UserContextProvider";
import { usePathname } from "next/navigation";
import { MESSAGE_EVENTS } from "@shared/socketEvents";
import { ChannelType, MessageData } from "@shared/schemas/messages";
import { ServerToClientEvents } from "@shared/types/socket";
import { useMessagesStore } from "@/stores/messagesStore";
import { useDMChannelsStore } from "@/stores/dmChannelStore";

type UseMessagesBootstrapParams = {
    channelId?: string;
    channelType?: ChannelType;
};

export const useMessagesBootstrap = ({
    channelId: activeChannelId,
    channelType: activeChannelType,
}: UseMessagesBootstrapParams = {}) => {
    const { socket } = useSocket();
    const { user } = useUser();
    const pathname = usePathname();

    useEffect(() => {
        if (!socket || !user) return;

        const {
            addMessage,
            replaceOptimisticMessage,
            updateMessage,
            removeMessage,
        } = useMessagesStore.getState();

        const dmStore = useDMChannelsStore.getState();

        const addOrReplaceOptimistic = (channelId: string, message: MessageData) => {
            // Check if message has optimisticId (from server response)
            const optimisticId = (message as any).optimisticId;

            if (optimisticId) {
                // Replace optimistic message with real one
                replaceOptimisticMessage(channelId, optimisticId, message);
            } else {
                addMessage(channelId, message);
            }
        };

        const handleMessageCreated: ServerToClientEvents[typeof MESSAGE_EVENTS.CREATED] =
            (message) => {
                const { channelId, channelType } = message;

                // Keep messages store updated for all channels
                addOrReplaceOptimistic(channelId, message);

                if (channelType === "dm") {
                    // ==========================
                    // DM-specific side effects
                    // ==========================
                    const channel = dmStore.dmChannels[channelId];

                    // Update last message timestamp for sorting (always)
                    const timestamp = new Date(message.createdAt).getTime();
                    dmStore.updateLastMessageTimestamp(channelId, timestamp);

                    // If channel exists in store, update unread count
                    if (channel) {
                        const isViewingChannel =
                            pathname.startsWith(`/channels/@me/${channelId}`)

                        if (message.authorId !== user.id && !isViewingChannel) {
                            dmStore.incrementUnreadCount(channelId, message.authorId);
                        }
                    }
                }
            };

        const handleMessageEdited: ServerToClientEvents[typeof MESSAGE_EVENTS.EDITED] =
            (message) => {
                const { channelId } = message;
                updateMessage(channelId, message.id, message);
            };

        const handleMessageDeleted: ServerToClientEvents[typeof MESSAGE_EVENTS.DELETED] =
            (data) => {
                const { channelId, messageId } = data;
                removeMessage(channelId, messageId);
            };

        socket.on(MESSAGE_EVENTS.CREATED, handleMessageCreated);
        socket.on(MESSAGE_EVENTS.EDITED, handleMessageEdited);
        socket.on(MESSAGE_EVENTS.DELETED, handleMessageDeleted);

        return () => {
            socket.off(MESSAGE_EVENTS.CREATED, handleMessageCreated);
            socket.off(MESSAGE_EVENTS.EDITED, handleMessageEdited);
            socket.off(MESSAGE_EVENTS.DELETED, handleMessageDeleted);
        };
    }, [socket, user, pathname, activeChannelId, activeChannelType]);
};

