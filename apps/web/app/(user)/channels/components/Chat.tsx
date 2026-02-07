import MessagePreview from "@/app/(user)/channels/components/MessagePreview";
import { fetchMessages } from "@/services/messagesService";
import { ChannelType, MessageData } from "@shared/schemas/messages";
import { useCallback, useMemo, useState } from "react";
import { Virtuoso } from 'react-virtuoso';

interface ChatProps {
    channelId: string;
    channelType: ChannelType;
    messages: MessageData[];
}

function toISOString(value: Date | string): string {
    return value instanceof Date
        ? value.toISOString()
        : new Date(value).toISOString();
}

const PAGE_SIZE = 50;
const INITIAL_FIRST_ITEM_INDEX = 100_000;

const Chat = ({ channelId, channelType, messages }: ChatProps) => {
    const [isLoadingOlder, setIsLoadingOlder] = useState(false);
    const [hasMoreOlder, setHasMoreOlder] = useState(true);
    const [firstItemIndex, setFirstItemIndex] = useState(INITIAL_FIRST_ITEM_INDEX);

    const messagesMap = useMemo(() => {
        const map = new Map<string, MessageData>();
        messages.forEach((message) => map.set(message.id, message));
        return map;
    }, [messages])

    const loadOlder = useCallback(async () => {
        if (isLoadingOlder) return;
        if (messages.length === 0 || !hasMoreOlder) return;
        console.log('Loading older messages', messages.length)
        const oldest = messages[0];
        const before = toISOString(oldest.createdAt);

        setIsLoadingOlder(true);

        try {
            const result = await fetchMessages(
                { channelId, channelType, limit: PAGE_SIZE, before },
                { prepend: true },
            );
            console.log('Loading older messages', { before, resultLength: result.length })
            setHasMoreOlder(result.length >= PAGE_SIZE);
            setFirstItemIndex(prev => prev - result.length);
        }
        finally {
            setIsLoadingOlder(false);
        }

    }, [channelId, channelType, messages, hasMoreOlder, isLoadingOlder]);

    const enrichedMessages = useMemo(() => {
        return messages.map((message, index) => {
            const lastMessage = index > 0 ? messages[index - 1] : null;
            const repliedToMessage = message.replyToMessageId ? messagesMap.get(message.replyToMessageId) || null : null;
            return {
                ...message,
                lastMessage,
                repliedToMessage,
            }
        })
    }, [messages])

    return (
        <Virtuoso
        data={enrichedMessages}
            // style={{ height: '100%', width: '100%' }}
            totalCount={messages.length}
            startReached={loadOlder}
            atTopThreshold={10}
            followOutput="smooth"
            firstItemIndex={firstItemIndex}
            alignToBottom
            // endReached={loadNewer}
            initialTopMostItemIndex={messages.length - 1}
            overscan={10}
            className="flex justify-end"
            itemContent={(index, message) => {
                return <MessagePreview key={message.id} message={message} />
            }} />
    )
}

export default Chat