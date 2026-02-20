import { ConversationList } from '../conversation/ConversationList';
import { SearchBar } from '../conversation/SearchBar';
import { NewChatButton } from '../conversation/NewChatButton';
import styles from './Sidebar.module.css';

export function Sidebar() {
  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <h2 className={styles.title}>Pi-Note Chat</h2>
        <NewChatButton />
      </div>
      <SearchBar />
      <ConversationList />
    </div>
  );
}
