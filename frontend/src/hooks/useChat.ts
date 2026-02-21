import { useCallback, useRef } from 'react';
import { sendChatMessage } from '../api/chat';
import { useChatStore } from '../store/chatStore';
import type { Message } from '../types';

const STREAM_TIMEOUT_MS = 60_000; // 60s safety timeout

/** Generate UUID v4 — works in insecure HTTP contexts (e.g. http://192.168.x.x) */
function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const h = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}

export function useChat() {
  const abortRef = useRef<AbortController | null>(null);
  const streamingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const {
    currentConversation,
    isStreaming,
    addMessage,
    setStreamingContent,
    appendStreamingToken,
    setIsStreaming,
    updateConversationTitle,
    loadConversations,
    createConversation,
  } = useChatStore();

  const cleanup = useCallback(() => {
    setIsStreaming(false);
    streamingRef.current = false;
    abortRef.current = null;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [setIsStreaming]);

  const send = useCallback(async (content: string) => {
    // Prevent double sends using ref (avoids stale closure issues)
    if (streamingRef.current) return;

    let conversation = currentConversation;

    // Auto-create conversation if none exists
    if (!conversation) {
      try {
        conversation = await createConversation();
      } catch (e) {
        const errorMsg: Message = {
          id: uuid(),
          conversationId: 'error',
          role: 'assistant',
          content: `Failed to create conversation: ${(e as Error).message}`,
          createdAt: new Date().toISOString(),
        };
        addMessage(errorMsg);
        return;
      }
    }

    // Add user message to UI immediately
    const userMsg: Message = {
      id: uuid(),
      conversationId: conversation.id,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    addMessage(userMsg);
    setStreamingContent('');
    setIsStreaming(true);
    streamingRef.current = true;

    const abort = new AbortController();
    abortRef.current = abort;

    // Safety timeout: auto-abort if stream takes too long
    timeoutRef.current = setTimeout(() => {
      if (streamingRef.current) {
        abort.abort();
        const timeoutMsg: Message = {
          id: uuid(),
          conversationId: conversation!.id,
          role: 'assistant',
          content: 'Error: Response timeout. Ollama server may be unreachable or the model is taking too long.',
          createdAt: new Date().toISOString(),
        };
        addMessage(timeoutMsg);
        setStreamingContent('');
        cleanup();
      }
    }, STREAM_TIMEOUT_MS);

    let assistantMsgId = '';

    try {
      await sendChatMessage(conversation.id, content, {
        onStart: (event) => {
          assistantMsgId = event.messageId;
        },
        onToken: (event) => {
          // Reset safety timeout on each token (model is responding)
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
              if (streamingRef.current) {
                abort.abort();
                cleanup();
              }
            }, STREAM_TIMEOUT_MS);
          }
          appendStreamingToken(event.content);
        },
        onEnd: (event) => {
          // Finalize: move streaming content to messages
          const fullContent = useChatStore.getState().streamingContent;
          const assistantMsg: Message = {
            id: event.messageId || assistantMsgId,
            conversationId: conversation!.id,
            role: 'assistant',
            content: fullContent,
            createdAt: new Date().toISOString(),
          };
          addMessage(assistantMsg);
          setStreamingContent('');

          if (event.title) {
            updateConversationTitle(conversation!.id, event.title);
          }
          loadConversations();
        },
        onError: (event) => {
          console.error('Chat error:', event);
          const errorMsg: Message = {
            id: uuid(),
            conversationId: conversation!.id,
            role: 'assistant',
            content: `Error: ${event.message || event.code || 'Unknown error'}`,
            createdAt: new Date().toISOString(),
          };
          addMessage(errorMsg);
          setStreamingContent('');
        },
      }, abort.signal);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        console.error('Chat failed:', e);
        const errorMsg: Message = {
          id: uuid(),
          conversationId: conversation.id,
          role: 'assistant',
          content: `Connection error: ${(e as Error).message || 'Failed to reach server'}`,
          createdAt: new Date().toISOString(),
        };
        addMessage(errorMsg);
        setStreamingContent('');
      }
    } finally {
      cleanup();
    }
  }, [currentConversation, addMessage, setStreamingContent, appendStreamingToken, setIsStreaming, updateConversationTitle, loadConversations, createConversation, cleanup]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { send, stop, isStreaming };
}
