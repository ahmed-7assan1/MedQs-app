"use client";

import { useEffect, useRef, useState } from "react";
import { subscribeToRoomChat, sendChatMessage, RoomChatMessage } from "@/lib/firebase/room-realtime";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";

interface Props {
  roomId: string;
  userId: string;
  userName: string;
  userImage?: string;
}

export default function RoomChatBox({ roomId, userId, userName, userImage }: Props) {
  const [messages, setMessages] = useState<RoomChatMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeToRoomChat(roomId, (msgs) => {
      setMessages(msgs);
    });
    return unsub;
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text: string) => {
    try {
      await sendChatMessage(roomId, userId, userName, userImage, text);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-8">No messages yet. Start the conversation!</p>
        )}
        {messages.map((msg) => (
          <ChatMessage
            key={msg.id}
            id={msg.id}
            senderId={msg.senderId}
            senderName={msg.senderName}
            senderImage={msg.senderImage}
            text={msg.text}
            createdAt={msg.createdAt}
            isOwn={msg.senderId === userId}
          />
        ))}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={handleSend} />
    </div>
  );
}
