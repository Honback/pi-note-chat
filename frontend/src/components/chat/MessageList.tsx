import { useEffect, useRef } from 'react';
import { useChatStore } from '../../store/chatStore';
import { MessageBubble } from './MessageBubble';
import styles from './MessageList.module.css';

export function MessageList() {
  const messages = useChatStore(s => s.messages);
  const streamingContent = useChatStore(s => s.streamingContent);
  const isStreaming = useChatStore(s => s.isStreaming);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  return (
    <div className={styles.list}>
      {messages.map(msg => (
        <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
      ))}
      {isStreaming && streamingContent && (
        <MessageBubble role="assistant" content={streamingContent} streaming />
      )}
      <div ref={endRef} />
    </div>
  );
}
