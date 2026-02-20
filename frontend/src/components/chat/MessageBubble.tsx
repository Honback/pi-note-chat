import ReactMarkdown from 'react-markdown';
import styles from './MessageBubble.module.css';

interface Props {
  role: string;
  content: string;
  streaming?: boolean;
}

export function MessageBubble({ role, content, streaming }: Props) {
  const isUser = role === 'user';

  return (
    <div className={`${styles.bubble} ${isUser ? styles.user : styles.assistant}`}>
      <div className={styles.label}>{isUser ? 'You' : 'AI'}</div>
      <div className={styles.content}>
        {isUser ? (
          <p>{content}</p>
        ) : (
          <ReactMarkdown>{content}</ReactMarkdown>
        )}
        {streaming && <span className={styles.cursor} />}
      </div>
    </div>
  );
}
