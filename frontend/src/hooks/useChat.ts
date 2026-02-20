import { useCallback, useRef } from 'react';
import { sendChatMessage } from '../api/chat';
import { useChatStore } from '../store/chatStore';
import type { Message } from '../types';

export function useChat() {
  const abortRef = useRef<AbortController | null>(null);
  const streamingRef = useRef(false);
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
          id: crypto.randomUUID(),
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
      id: crypto.randomUUID(),
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

    let assistantMsgId = '';

    try {
      await sendChatMessage(conversation.id, content, {
        onStart: (event) => {
          assistantMsgId = event.messageId;
        },
        onToken: (event) => {
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
            id: crypto.randomUUID(),
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
        // Show error to user instead of silently failing
        const errorMsg: Message = {
          id: crypto.randomUUID(),
          conversationId: conversation.id,
          role: 'assistant',
          content: `Connection error: ${(e as Error).message || 'Failed to reach server'}`,
          createdAt: new Date().toISOString(),
        };
        addMessage(errorMsg);
        setStreamingContent('');
      }
    } finally {
      setIsStreaming(false);
      streamingRef.current = false;
      abortRef.current = null;
    }
  }, [currentConversation, addMessage, setStreamingContent, appendStreamingToken, setIsStreaming, updateConversationTitle, loadConversations, createConversation]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { send, stop, isStreaming };
}
