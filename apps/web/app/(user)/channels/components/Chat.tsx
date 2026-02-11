import MessagePreview from "@/app/(user)/channels/components/MessagePreview";
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
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
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

  console.log(enrichedMessages);

  return (
    <Virtuoso
      marginHeight={10}
      data={enrichedMessages}
      totalCount={messages.length}
      startReached={loadOlder}
      atTopThreshold={10}
      followOutput="smooth"
      firstItemIndex={firstItemIndex}
      alignToBottom
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
      initialTopMostItemIndex={messages.length - 1}
      overscan={10}
      className="flex justify-end"
      itemContent={(index, message) => {
        return (
          <>
            {!hasMoreOlder && message.type === "discussion-beginning" && (
              <div>
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
                className="text-xs text-muted-foreground relative mx-3 py-8 select-none"
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
