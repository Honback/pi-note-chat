import { useState, useCallback } from 'react';
import { useChatStore } from '../../store/chatStore';
import styles from './SearchBar.module.css';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const searchConversations = useChatStore(s => s.searchConversations);
  const loadConversations = useChatStore(s => s.loadConversations);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (val.trim()) {
      searchConversations(val);
    } else {
      loadConversations();
    }
  }, [searchConversations, loadConversations]);

  return (
    <div className={styles.container}>
      <svg className={styles.icon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        className={styles.input}
        type="text"
        placeholder="Search conversations..."
        value={query}
        onChange={handleChange}
      />
    </div>
  );
}
