import type { MessageStartEvent, TokenEvent, MessageEndEvent, ErrorEvent } from '../types';

export type SSECallback = {
  onStart: (event: MessageStartEvent) => void;
  onToken: (event: TokenEvent) => void;
  onEnd: (event: MessageEndEvent) => void;
  onError: (event: ErrorEvent) => void;
};

/**
 * Send a chat message and stream the response via SSE using fetch + ReadableStream.
 * We use fetch instead of EventSource because we need to send a POST body.
 */
export async function sendChatMessage(
  conversationId: string,
  content: string,
  callbacks: SSECallback,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(`/api/conversations/${conversationId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
    signal,
  });

  if (!res.ok) {
    callbacks.onError({ code: 'HTTP_ERROR', message: `${res.status} ${res.statusText}` });
    return;
  }

  const reader = res.body?.getReader();
  if (!reader) {
    callbacks.onError({ code: 'NO_BODY', message: 'Response body is empty' });
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let currentEvent = '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          currentEvent = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          const data = line.slice(5).trim();
          if (!data || !currentEvent) continue;

          try {
            const parsed = JSON.parse(data);
            switch (currentEvent) {
              case 'message-start':
                callbacks.onStart(parsed);
                break;
              case 'token':
                callbacks.onToken(parsed);
                break;
              case 'message-end':
                callbacks.onEnd(parsed);
                break;
              case 'error':
                callbacks.onError(parsed);
                break;
            }
          } catch {
            // Skip unparseable data lines
          }
          currentEvent = '';
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
