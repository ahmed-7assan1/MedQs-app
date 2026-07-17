import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

type ChatRequestBody = { messages?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response("Missing LOVABLE_API_KEY", { status: 500 });
        }

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3.5-flash"),
          system:
            "You are Grok, a helpful, witty, and truthful AI assistant. Respond in the same language the user uses. Be concise but thorough. Use markdown when helpful.\n\nInteractive widgets: when the user asks for a quiz, questions form, MCQ, test, or flashcards, respond with a fenced code block using one of these languages:\n\n1) Quiz / questions form — language `quiz` with JSON:\n```quiz\n{\n  \"title\": \"Optional title\",\n  \"questions\": [\n    { \"q\": \"Question text\", \"choices\": [\"A\", \"B\", \"C\", \"D\"], \"answer\": 0, \"explanation\": \"why (optional)\" }\n  ]\n}\n```\n`answer` is the zero-based index of the correct choice.\n\n2) Flashcards — language `flashcards` with JSON:\n```flashcards\n{\n  \"title\": \"Optional title\",\n  \"cards\": [ { \"front\": \"term\", \"back\": \"definition\" } ]\n}\n```\n\nOnly emit these blocks when the user actually asks for a quiz or flashcards. The JSON must be valid. You may add a short intro sentence before the block.",
          messages: convertToModelMessages(messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
        });
      },
    },
  },
});