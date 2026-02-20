import { useChatStore } from '../../store/chatStore';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import styles from './ChatView.module.css';

export function ChatView() {
  const currentConversation = useChatStore(s => s.currentConversation);
  const toggleSidebar = useChatStore(s => s.toggleSidebar);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.menuBtn} onClick={toggleSidebar}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>
        <h3 className={styles.title}>
          {currentConversation?.title || 'Pi-Note Chat'}
        </h3>
      </header>

      {currentConversation ? (
        <>
          <MessageList />
          <ChatInput />
        </>
      ) : (
        <div className={styles.empty}>
          <div className={styles.emptyContent}>
            <h2>Pi-Note Chat</h2>
            <p>Local AI powered by your Galaxy Note 10</p>
            <p className={styles.hint}>Create a new conversation to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
}
