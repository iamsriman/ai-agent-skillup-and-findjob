import { apiRequest } from "./client.js";

export function listConversations() {
  return apiRequest("/api/conversations");
}

export function getConversationMessages(conversationId) {
  return apiRequest(
    `/api/conversations/${encodeURIComponent(conversationId)}/messages`,
  );
}

export function deleteConversation(conversationId) {
  return apiRequest(`/api/conversations/${encodeURIComponent(conversationId)}`, {
    method: "DELETE",
  });
}
