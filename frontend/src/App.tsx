import { useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { useChatStore } from './store/chatStore';

export default function App() {
  const loadConversations = useChatStore(s => s.loadConversations);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return <AppLayout />;
}
