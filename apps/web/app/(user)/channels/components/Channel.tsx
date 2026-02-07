'use client'

import { getPostChannel } from "@/services/channelService";
import { getDMChannel } from "@/services/dmChannelsService";
import { fetchMessages } from "@/services/messagesService";
import { ChannelType } from "@shared/schemas/messages";
import type { Channel, ChannelWithUsers } from "@shared/types/responses";
import { useCallback, useEffect, useState, useRef } from "react";
import { useMessagesStore } from "@/stores/messagesStore";
import { useShallow } from "zustand/react/shallow";
import { useVirtualizer } from "@tanstack/react-virtual";
import Chat from "./Chat";
import { MessageInput, MessageInputRef } from "@/app/(user)/channels/components/MessageInput";
import { useConversationPreview } from "@/contexts/conversationPreviewContext";
import { cn } from "@/lib/utils";


interface ChannelProps {
    channelType: ChannelType;
    channelId: string;
    postId: string;
}

const Channel = ({ channelType, channelId }: ChannelProps) => {
    const messageInputRef = useRef<MessageInputRef>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const { state: { isOpen } } = useConversationPreview()
    const [channel, setChannel] = useState<Channel | ChannelWithUsers | null>(
        null
    );
    const messages = useMessagesStore(useShallow(state => state.messagesByChannel[channelId] || []));

    const fetchChannelData = useCallback(async () => {
        const fetchChannel = channelType === "dm" ? getDMChannel : getPostChannel;
        fetchChannel(channelId).then((ch: Channel | ChannelWithUsers) =>
            setChannel(ch)
        );
    }, [channelType, channelId]);

    const fetchMessagesData = useCallback(async () => {
        fetchMessages({ channelId, channelType, limit: 50 });
    }, [channelId, channelType]);

    useEffect(() => {
        fetchChannelData();
        fetchMessagesData();
    }, [fetchChannelData, fetchMessagesData, channelId]);

    const virtualizer = useVirtualizer<HTMLElement, Element>({
        count: messages.length,
        getScrollElement: () => messagesContainerRef.current,
        estimateSize: () => 80,
        overscan: 20,
        enabled: messages.length > 0,
        measureElement:
            typeof window !== "undefined" &&
                navigator.userAgent.indexOf("Firefox") === -1
                ? (element: Element | null) =>
                    element?.getBoundingClientRect().height ?? 80
                : undefined,
    });

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const active = document.activeElement as HTMLElement | null;
            if (active?.closest("textarea") || active?.closest("input")

            ) {
                return;
            }
            if (e.key.length !== 1 || ["Enter", "Escape", "Tab"].includes(e.key)) return;
            e.preventDefault();
            messageInputRef.current?.focus();
            messageInputRef.current?.appendText(e.key);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    return (
        <main className="h-full min-h-0 flex flex-col">
            <header className="p-3 border-b">
                <h1>{channelId}</h1>
            </header>

            <div className={cn("grid flex-1 min-h-0", isOpen ? "grid-cols-[1fr_0px]" : "max-lg:grid-cols-1 grid-cols-[1fr_360px]")}>
                <div className="flex flex-col w-full h-full min-h-0">
                    <div className="flex-1 min-h-0" />
                    <div ref={messagesContainerRef} className="overflow-y-auto min-h-0">
                        <Chat virtualizer={virtualizer} messages={messages} />
                    </div>
                    <div className="p-2 shrink-0">
                        <MessageInput ref={messageInputRef} channelId={channelId} channelType={channelType} />
                    </div>
                </div>
            </div>
        </main>);
};

export default Channel;
