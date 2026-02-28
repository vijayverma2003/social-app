import MessagePreview from "@/app/(user)/channels/components/MessagePreview";
import { useChannelView } from "@/app/(user)/channels/contexts/ChannelViewContext";
import { fetchMessages } from "@/services/messagesService";
import { ChannelType, MessageData } from "@shared/schemas/messages";
import { format } from "date-fns";
import { useCallback, useMemo, useState } from "react";
import { Virtuoso } from "react-virtuoso";
import ChatSkeleton from "./ChatSkeleton";
import DMChannelBeginning from "./DMChannelChatBeginning";
import PostDiscussionBeginning from "./PostDiscussionBeginning";

interface ChatProps {
  postId?: string;
  channelId: string;
  channelType: ChannelType;
  initialLoadingComplete: boolean;
  messages: MessageData[];
}

function toISOString(value: Date | string): string {
  return value instanceof Date
    ? value.toISOString()
    : new Date(value).toISOString();
}

const PAGE_SIZE = 50;
const INITIAL_FIRST_ITEM_INDEX = 100_000;

const Chat = ({
  postId,
  channelId,
  channelType,
  initialLoadingComplete,
  messages,
}: ChatProps) => {
  const channelView = useChannelView();
  const aroundMessageId = channelView?.aroundMessageId ?? null;

  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [isLoadingNewer, setIsLoadingNewer] = useState(false);
  const [hasMoreNewer, setHasMoreNewer] = useState(true);
  const [firstItemIndex, setFirstItemIndex] = useState(
    INITIAL_FIRST_ITEM_INDEX,
  );

  const messagesMap = useMemo(() => {
    const map = new Map<string, MessageData>();
    messages.forEach((message) => map.set(message.id, message));
    return map;
  }, [messages]);

  const loadOlder = useCallback(async () => {
    if (isLoadingOlder) return;
    if (messages.length === 0 || !hasMoreOlder) return;
    console.log("Loading older messages", messages.length);
    const oldest = messages[0];
    const before = toISOString(oldest.createdAt);

    setIsLoadingOlder(true);

    try {
      const result = await fetchMessages(
        { channelId, channelType, limit: PAGE_SIZE, before },
        { prepend: true },
      );
      console.log("Loading older messages", {
        before,
        resultLength: result.length,
      });
      setHasMoreOlder(result.length >= PAGE_SIZE);
      setFirstItemIndex((prev) => prev - result.length);
    } finally {
      setIsLoadingOlder(false);
    }
  }, [channelId, channelType, messages, hasMoreOlder, isLoadingOlder]);

  const loadNewer = useCallback(async () => {
    if (!aroundMessageId) return;
    if (isLoadingNewer) return;
    if (messages.length === 0 || !hasMoreNewer) return;

    const newest = messages[messages.length - 1];
    const after = toISOString(newest.createdAt);

    setIsLoadingNewer(true);

    try {
      const result = await fetchMessages(
        { channelId, channelType, limit: PAGE_SIZE, after },
        { append: true },
      );
      setHasMoreNewer(result.length >= PAGE_SIZE);
    } finally {
      setIsLoadingNewer(false);
    }
  }, [
    aroundMessageId,
    channelId,
    channelType,
    messages,
    hasMoreNewer,
    isLoadingNewer,
  ]);

  const enrichedMessages = useMemo(() => {
    return messages.map((message, index) => {
      const lastMessage = index > 0 ? messages[index - 1] : null;
      const repliedToMessage = message.replyToMessageId
        ? messagesMap.get(message.replyToMessageId) || null
        : null;
      return {
        ...message,
        lastMessage,
        repliedToMessage,
        type: index === 0 ? "discussion-beginning" : "message",
        dateBanner:
          lastMessage?.createdAt && message.createdAt
            ? new Date(lastMessage.createdAt).toDateString() !==
              new Date(message.createdAt).toDateString()
            : index === 0
              ? true
              : false,
      };
    });
  }, [messages]);

  const initialScrollIndex = useMemo(() => {
    if (!aroundMessageId || messages.length === 0) return messages.length - 1;
    const idx = messages.findIndex((m) => m.id === aroundMessageId);
    return idx >= 0 ? idx : messages.length - 1;
  }, [aroundMessageId, messages]);

  return (
    <Virtuoso
      marginHeight={10}
      data={enrichedMessages}
      totalCount={messages.length}
      startReached={loadOlder}
      computeItemKey={(index, message) => message.id}
      endReached={aroundMessageId ? loadNewer : undefined}
      atTopThreshold={400}
      atBottomThreshold={400}
      followOutput={aroundMessageId ? false : "smooth"}
      firstItemIndex={firstItemIndex}
      alignToBottom={!aroundMessageId}
      initialTopMostItemIndex={initialScrollIndex}
      increaseViewportBy={{ top: 500, bottom: 500 }}
      components={{
        EmptyPlaceholder: () =>
          !initialLoadingComplete ? (
            <ChatSkeleton />
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center py-8">
              <p className="text-muted-foreground text-xs">
                No messages yet. Start a conversation!
              </p>
            </div>
          ) : null,
      }}
      overscan={200}
      defaultItemHeight={36}
      itemContent={(index, message) => {
        return (
          <>
            {!hasMoreOlder && message.type === "discussion-beginning" && (
              <div className="min-h-[200px]">
                {channelType === "post" && (
                  <PostDiscussionBeginning postId={postId} />
                )}
                {channelType === "dm" && (
                  <DMChannelBeginning channelId={channelId} />
                )}
              </div>
            )}
            {message.dateBanner && (
              <div
                className="h-[64px] text-xs text-muted-foreground relative mx-3 py-8 select-none"
                role="separator"
              >
                <p className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-background px-2">
                  {format(new Date(message.createdAt), "eeee, d MMMM yyyy")}
                </p>
              </div>
            )}
            <MessagePreview key={message.id} message={message} />
          </>
        );
      }}
    />
  );
};

export default Chat;
