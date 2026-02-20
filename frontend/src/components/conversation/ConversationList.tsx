import { useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import styles from './ConversationList.module.css';

export function ConversationList() {
  const conversations = useChatStore(s => s.conversations);
  const currentConversation = useChatStore(s => s.currentConversation);
  const selectConversation = useChatStore(s => s.selectConversation);
  const deleteConversation = useChatStore(s => s.deleteConversation);
  const renameConversation = useChatStore(s => s.renameConversation);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleRename = (id: string) => {
    if (editTitle.trim()) {
      renameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const startEditing = (id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
  };

  return (
    <div className={styles.list}>
      {conversations.map(conv => (
        <div
          key={conv.id}
          className={`${styles.item} ${conv.id === currentConversation?.id ? styles.active : ''}`}
          onClick={() => selectConversation(conv.id)}
        >
          {editingId === conv.id ? (
            <input
              className={styles.editInput}
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onBlur={() => handleRename(conv.id)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleRename(conv.id);
                if (e.key === 'Escape') setEditingId(null);
              }}
              onClick={e => e.stopPropagation()}
              autoFocus
            />
          ) : (
            <span className={styles.title}>{conv.title}</span>
          )}
          <div className={styles.actions} onClick={e => e.stopPropagation()}>
            <button
              className={styles.actionBtn}
              onClick={() => startEditing(conv.id, conv.title)}
              title="Rename"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              className={styles.actionBtn}
              onClick={() => {
                if (confirm('Delete this conversation?')) {
                  deleteConversation(conv.id);
                }
              }}
              title="Delete"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>
      ))}
      {conversations.length === 0 && (
        <div className={styles.empty}>No conversations yet</div>
      )}
    </div>
  );
}
