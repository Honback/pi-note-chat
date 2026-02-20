import { useCallback, useRef } from 'react';
import { sendChatMessage } from '../api/chat';
import { useChatStore } from '../store/chatStore';
import type { Message } from '../types';

export function useChat() {
  const abortRef = useRef<AbortController | null>(null);
  const {
    currentConversation,
    isStreaming,
    addMessage,
    setStreamingContent,
    appendStreamingToken,
    setIsStreaming,
    updateConversationTitle,
    loadConversations,
  } = useChatStore();

  const send = useCallback(async (content: string) => {
    if (!currentConversation || isStreaming) return;

    // Add user message to UI immediately
    const userMsg: Message = {
      id: crypto.randomUUID(),
      conversationId: currentConversation.id,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    addMessage(userMsg);
    setStreamingContent('');
    setIsStreaming(true);

    const abort = new AbortController();
    abortRef.current = abort;

    let assistantMsgId = '';

    try {
      await sendChatMessage(currentConversation.id, content, {
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
            conversationId: currentConversation.id,
            role: 'assistant',
            content: fullContent,
            createdAt: new Date().toISOString(),
          };
          addMessage(assistantMsg);
          setStreamingContent('');

          if (event.title) {
            updateConversationTitle(currentConversation.id, event.title);
          }
          loadConversations();
        },
        onError: (event) => {
          console.error('Chat error:', event);
          const errorMsg: Message = {
            id: crypto.randomUUID(),
            conversationId: currentConversation.id,
            role: 'assistant',
            content: `Error: ${event.message}`,
            createdAt: new Date().toISOString(),
          };
          addMessage(errorMsg);
          setStreamingContent('');
        },
      }, abort.signal);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        console.error('Chat failed:', e);
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [currentConversation, isStreaming, addMessage, setStreamingContent, appendStreamingToken, setIsStreaming, updateConversationTitle, loadConversations]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { send, stop, isStreaming };
}
