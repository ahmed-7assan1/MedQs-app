"use client";

import { CheckCircle } from "@phosphor-icons/react";

interface Props {
  id: string;
  senderId: string;
  senderName: string;
  senderImage?: string;
  text: string;
  createdAt: Date;
  isOwn: boolean;
}

export default function ChatMessage({ senderName, senderImage, text, createdAt, isOwn }: Props) {
  return (
    <div className={`flex gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
      {senderImage ? (
        <img src={senderImage} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-1" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground flex-shrink-0 mt-1">
          {senderName.charAt(0).toUpperCase()}
        </div>
      )}
      <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex flex-col`}>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-medium text-muted-foreground">{senderName}</span>
          <span className="text-[10px] text-muted-foreground">
            {createdAt ? new Date(createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
          </span>
        </div>
        <div
          className={`px-3 py-2 rounded-2xl text-sm ${
            isOwn
              ? "bg-blue-600 text-white rounded-tr-sm"
              : "bg-muted text-foreground rounded-tl-sm"
          }`}
        >
          {text}
        </div>
      </div>
    </div>
  );
}
