"use client";

import { MessageInput, MessageInputRef } from "@/app/(user)/channels/components/MessageInput";
import { Skeleton } from "@/components/ui/skeleton";
import { useConversationPreview } from "@/contexts/conversationPreviewContext";
import { cn } from "@/lib/utils";
import { fetchMessages } from "@/services/messagesService";
import { useMessagesStore } from "@/stores/messagesStore";
import { ChannelType } from "@shared/schemas/messages";
import type { Channel } from "@shared/types/responses";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useRef, useState, useLayoutEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import Chat from "./Chat";

const PAGE_SIZE = 50;
const LOAD_MORE_THRESHOLD = 3;


interface ChannelProps {
    channelType: ChannelType;
    channelId: string;
    postId: string;
}

const LoadingSkeleton = ({ className, skeletonCount = 10 }: { className?: string, skeletonCount: number }) => {
    return <div
        className={`flex flex-col space-y-3 ${className}`}
    >
        {Array.from({ length: skeletonCount }).map((_, index) => (
            <div key={"message-skeleton-" + index} className="flex items-start gap-4 px-4 space-y-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        ))}
    </div>
}

const Channel = ({ channelType, channelId }: ChannelProps) => {
    const messageInputRef = useRef<MessageInputRef>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    const { state: { isOpen } } = useConversationPreview();
    const messages = useMessagesStore(useShallow((state) => state.messagesByChannel[channelId] || []));
    const [hasMoreOlder, setHasMoreOlder] = useState(true);
    const [isLoadingOlder, setIsLoadingOlder] = useState(false);
    const [initialLoadDone, setInitialLoadDone] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const fetchMessagesData = useCallback(async () => {
        setIsInitialLoading(true);
        try {
            await fetchMessages({ channelId, channelType, limit: PAGE_SIZE });
        } finally {
            setInitialLoadDone(true);
            setIsInitialLoading(false);
        }
    }, [channelId, channelType]);

    useEffect(() => {
        fetchMessagesData();
    }, [fetchMessagesData, channelId]);

    const prependedCountRef = useRef<number | null>(null);
    const prevFirstIndexRef = useRef<number | null>(null);


    // const virtualizer = useVirtualizer<HTMLElement, Element>({
    //     count: messages.length,
    //     getScrollElement: () => messagesContainerRef.current,
    //     estimateSize: () => 40,
    //     overscan: 5,
    //     enabled: messages.length > 0,
    //     measureElement:
    //         typeof window !== "undefined" &&
    //             navigator.userAgent.indexOf("Firefox") === -1
    //             ? (element: Element | null) =>
    //                 element?.getBoundingClientRect().height ?? 80
    //             : undefined,
    // });

    // const virtualItems = virtualizer.getVirtualItems();
    // const firstIndex = virtualItems[0]?.index ?? 0;

    // // Load more when user scrolls near the top (virtualizer-driven infinite scroll)
    // useEffect(() => {
    //     if (!initialLoadDone || messages.length === 0 || !hasMoreOlder || isLoadingOlder) return;
    //     const prev = prevFirstIndexRef.current;
    //     prevFirstIndexRef.current = firstIndex;
    //     if (firstIndex > LOAD_MORE_THRESHOLD) return;
    //     if (prev !== null && prev <= LOAD_MORE_THRESHOLD) return;
    //     loadOlder();
    // }, [firstIndex, initialLoadDone, messages.length, hasMoreOlder, isLoadingOlder, loadOlder]);

    // Focus on input on key down
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const active = document.activeElement as HTMLElement | null;
            if (active?.closest("textarea") || active?.closest("input")) {
                return;
            }
            if (e.key.length !== 1 || ["Enter", "Escape", "Tab"].includes(e.key))
                return;
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

            <div
                className={cn(
                    "grid flex-1 min-h-0",
                    isOpen
                        ? "grid-cols-[1fr_0px]"
                        : "max-lg:grid-cols-1 grid-cols-[1fr_360px]",
                )}
            >
                <div className="flex flex-col w-full h-full min-h-0">
                    {isLoadingOlder && (
                        <div className="shrink-0 flex items-center justify-center py-1.5 text-xs text-muted-foreground border-b">
                            Loading older messages…
                        </div>
                    )}
                    <div
                        ref={messagesContainerRef}
                        className="min-h-0 h-full overflow-y-auto mb-4"
                    >
                        {isInitialLoading && messages.length === 0 ? (
                            <LoadingSkeleton className="min-h-[200px] flex-1" skeletonCount={10} />
                        ) : (
                            <Chat channelId={channelId} channelType={channelType} messages={messages} />
                        )}
                    </div>
                    <div className="p-2 shrink-0">
                        <MessageInput
                            ref={messageInputRef}
                            channelId={channelId}
                            channelType={channelType}
                        />
                    </div>
                </div>
            </div>
        </main>
    );
};

export default Channel;
