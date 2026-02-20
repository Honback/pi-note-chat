import { apiFetch, apiDelete } from './client';
import type { Conversation, ConversationWithMessages, Message } from '../types';

export function listConversations(page = 0, size = 20): Promise<Conversation[]> {
  return apiFetch(`/conversations?page=${page}&size=${size}`);
}

export function createConversation(title?: string): Promise<Conversation> {
  return apiFetch('/conversations', {
    method: 'POST',
    body: JSON.stringify(title ? { title } : {}),
  });
}

export function getConversation(id: string): Promise<ConversationWithMessages> {
  return apiFetch(`/conversations/${id}`);
}

export function updateConversationTitle(id: string, title: string): Promise<Conversation> {
  return apiFetch(`/conversations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  });
}

export function deleteConversation(id: string): Promise<void> {
  return apiDelete(`/conversations/${id}`);
}

export function searchConversations(q: string): Promise<Conversation[]> {
  return apiFetch(`/conversations/search?q=${encodeURIComponent(q)}`);
}

export function getMessages(id: string, page = 0, size = 50): Promise<Message[]> {
  return apiFetch(`/conversations/${id}/messages?page=${page}&size=${size}`);
}
