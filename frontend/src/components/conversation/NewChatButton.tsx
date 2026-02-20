import { useChatStore } from '../../store/chatStore';
import styles from './NewChatButton.module.css';

export function NewChatButton() {
  const createConversation = useChatStore(s => s.createConversation);

  return (
    <button className={styles.btn} onClick={() => createConversation()} title="New Chat">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </button>
  );
}
