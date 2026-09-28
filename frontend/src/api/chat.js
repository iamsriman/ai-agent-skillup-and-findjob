import { apiRequest } from "./client.js";

export function sendChatMessage(message, conversationId) {
  const body = { message };
  if (conversationId) body.conversation_id = conversationId;

  return apiRequest("/api/chat", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
