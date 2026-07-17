import { createFileRoute } from "@tanstack/react-router";
import { ChatView } from "@/components/chat-view";

export const Route = createFileRoute("/")({
  component: NewChat,
});

function NewChat() {
  return <ChatView key="new" threadId={null} />;
}