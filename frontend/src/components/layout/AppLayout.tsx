import { useChatStore } from '../../store/chatStore';
import { Sidebar } from './Sidebar';
import { ChatView } from '../chat/ChatView';
import { StatusBar } from '../status/StatusBar';
import { SettingsModal } from '../settings/SettingsModal';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const sidebarOpen = useChatStore(s => s.sidebarOpen);
  const toggleSidebar = useChatStore(s => s.toggleSidebar);

  return (
    <div className={styles.layout}>
      <StatusBar />
      <div className={styles.body}>
        <div className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
          <Sidebar />
        </div>
        {sidebarOpen && <div className={styles.overlay} onClick={toggleSidebar} />}
        <main className={styles.main}>
          <ChatView />
        </main>
      </div>
      <SettingsModal />
    </div>
  );
}
