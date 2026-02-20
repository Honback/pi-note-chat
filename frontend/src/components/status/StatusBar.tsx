import { useEffect } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import styles from './StatusBar.module.css';

export function StatusBar() {
  const deviceStats = useSettingsStore(s => s.deviceStats);
  const ollamaStatus = useSettingsStore(s => s.ollamaStatus);
  const fetchDeviceStats = useSettingsStore(s => s.fetchDeviceStats);
  const fetchStatus = useSettingsStore(s => s.fetchStatus);
  const setSettingsOpen = useSettingsStore(s => s.setSettingsOpen);

  useEffect(() => {
    fetchDeviceStats();
    fetchStatus();
    const interval = setInterval(() => {
      fetchDeviceStats();
      fetchStatus();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchDeviceStats, fetchStatus]);

  const online = deviceStats?.online ?? false;
  const hasCpu = deviceStats?.hasDeviceStats && deviceStats.cpu >= 0;
  const hasTemp = deviceStats?.hasDeviceStats && deviceStats.temperature >= 0;

  const getTempColor = (temp: number) => {
    if (temp < 40) return 'var(--status-ok)';
    if (temp < 55) return 'var(--status-warn)';
    return 'var(--status-error)';
  };

  const getCpuColor = (cpu: number) => {
    if (cpu < 60) return 'var(--status-ok)';
    if (cpu < 85) return 'var(--status-warn)';
    return 'var(--status-error)';
  };

  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        <span className={`${styles.dot} ${online ? styles.online : styles.offline}`} />
        <span className={styles.label}>
          Note 10 {online ? '' : '(Offline)'}
        </span>
        {hasCpu && (
          <span className={styles.stat} style={{ color: getCpuColor(deviceStats!.cpu) }}>
            CPU {deviceStats!.cpu}%
          </span>
        )}
        {hasTemp && (
          <span className={styles.stat} style={{ color: getTempColor(deviceStats!.temperature) }}>
            {deviceStats!.temperature}°C
          </span>
        )}
        {online && !deviceStats?.hasDeviceStats && (
          <span className={styles.statMuted}>Ollama connected</span>
        )}
      </div>
      <div className={styles.right}>
        {ollamaStatus?.currentModel && (
          <span className={styles.model}>{ollamaStatus.currentModel}</span>
        )}
        <button className={styles.settingsBtn} onClick={() => setSettingsOpen(true)} title="Settings">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </button>
      </div>
    </div>
  );
}
