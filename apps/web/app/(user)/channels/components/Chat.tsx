import MessagePreview from "@/features/messages/components/MessagePreview";
import { VirtualList } from "@/features/posts/components/VirtualList";
import { MessageData } from "@shared/schemas/messages";
import { Virtualizer } from "@tanstack/react-virtual";
import { useMemo } from "react";

interface ChatProps {
    virtualizer: Virtualizer<HTMLElement, Element>;
    messages: MessageData[];
}

const Chat = ({ virtualizer, messages }: ChatProps) => {

    const messagesMap = useMemo(() => {
        const map = new Map<string, MessageData>();
        messages.forEach((message) => map.set(message.id, message));
        return map;
    }, [messages])


    return (
        <VirtualList
            itemSpacing={1}
            virtualizer={virtualizer}
            items={messages}
            renderItem={(message, index) => {
                const lastMessage = index > 0 ? messages[index - 1] : null;
                const repliedToMessage = message.replyToMessageId ? messagesMap.get(message.replyToMessageId) || null : null;

                return <MessagePreview key={message.id} message={message} lastMessage={lastMessage} repliedToMessage={repliedToMessage} />
            }} />
    )
}

export default Chat