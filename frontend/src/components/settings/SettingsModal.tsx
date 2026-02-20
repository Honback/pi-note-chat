import { useEffect, useState } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import styles from './SettingsModal.module.css';

export function SettingsModal() {
  const settingsOpen = useSettingsStore(s => s.settingsOpen);
  const setSettingsOpen = useSettingsStore(s => s.setSettingsOpen);
  const ollamaStatus = useSettingsStore(s => s.ollamaStatus);
  const models = useSettingsStore(s => s.models);
  const deviceStats = useSettingsStore(s => s.deviceStats);
  const fetchModels = useSettingsStore(s => s.fetchModels);
  const fetchStatus = useSettingsStore(s => s.fetchStatus);
  const fetchDeviceStats = useSettingsStore(s => s.fetchDeviceStats);
  const deleteModel = useSettingsStore(s => s.deleteModel);
  const pullModel = useSettingsStore(s => s.pullModel);
  const isPulling = useSettingsStore(s => s.isPulling);
  const pullProgress = useSettingsStore(s => s.pullProgress);

  const [newModel, setNewModel] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (settingsOpen) {
      fetchStatus();
      fetchModels();
      fetchDeviceStats();
    }
  }, [settingsOpen, fetchStatus, fetchModels, fetchDeviceStats]);

  if (!settingsOpen) return null;

  const formatSize = (bytes: number) => {
    if (bytes <= 0) return '-';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
  };

  const handlePull = () => {
    const name = newModel.trim();
    if (!name || isPulling) return;
    pullModel(name);
    setNewModel('');
  };

  const handleDelete = (name: string) => {
    if (confirmDelete === name) {
      deleteModel(name);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(name);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <div className={styles.overlay} onClick={() => setSettingsOpen(false)}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Settings</h2>
          <button className={styles.closeBtn} onClick={() => setSettingsOpen(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={styles.content}>
          {/* Connection Status */}
          <section className={styles.section}>
            <h3>Connection Status</h3>
            <div className={styles.statusGrid}>
              <div className={styles.statusItem}>
                <span className={`${styles.statusDot} ${ollamaStatus?.connected ? styles.ok : styles.error}`} />
                <div>
                  <div className={styles.statusLabel}>Ollama Server</div>
                  <div className={styles.statusValue}>
                    {ollamaStatus?.connected ? 'Connected' : 'Disconnected'}
                  </div>
                </div>
              </div>
              <div className={styles.statusItem}>
                <span className={`${styles.statusDot} ${deviceStats?.online ? styles.ok : styles.error}`} />
                <div>
                  <div className={styles.statusLabel}>Galaxy Note 10</div>
                  <div className={styles.statusValue}>
                    {deviceStats?.online ? 'Online' : 'Offline'}
                  </div>
                </div>
              </div>
            </div>
            {ollamaStatus?.currentModel && (
              <div className={styles.currentModel}>
                Active model: <strong>{ollamaStatus.currentModel}</strong>
              </div>
            )}
          </section>

          {/* Device Stats */}
          {deviceStats?.hasDeviceStats && (
            <section className={styles.section}>
              <h3>Device Monitor</h3>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>CPU</div>
                  <div className={styles.statValue}>{deviceStats.cpu}%</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>Temperature</div>
                  <div className={styles.statValue}>{deviceStats.temperature}°C</div>
                </div>
                {deviceStats.memoryTotal > 0 && (
                  <div className={styles.statCard}>
                    <div className={styles.statLabel}>Memory</div>
                    <div className={styles.statValue}>
                      {formatSize(deviceStats.memoryUsed)} / {formatSize(deviceStats.memoryTotal)}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Models */}
          <section className={styles.section}>
            <h3>Models</h3>
            {models.length === 0 ? (
              <div className={styles.empty}>
                {ollamaStatus?.connected
                  ? 'No models found'
                  : 'Connect to Ollama to manage models'}
              </div>
            ) : (
              <div className={styles.modelList}>
                {models.map(model => (
                  <div key={model.name} className={styles.modelItem}>
                    <div className={styles.modelInfo}>
                      <div className={styles.modelName}>{model.name}</div>
                      <div className={styles.modelMeta}>
                        {formatSize(model.size)}
                        {model.details?.parameter_size && ` · ${model.details.parameter_size}`}
                        {model.details?.quantization_level && ` · ${model.details.quantization_level}`}
                      </div>
                    </div>
                    <button
                      className={`${styles.deleteBtn} ${confirmDelete === model.name ? styles.confirm : ''}`}
                      onClick={() => handleDelete(model.name)}
                    >
                      {confirmDelete === model.name ? 'Confirm?' : 'Delete'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Pull Model */}
          <section className={styles.section}>
            <h3>Add Model</h3>
            <div className={styles.pullRow}>
              <input
                className={styles.pullInput}
                type="text"
                placeholder="e.g. qwen2.5:0.5b, gemma3:4b"
                value={newModel}
                onChange={e => setNewModel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePull()}
                disabled={isPulling || !ollamaStatus?.connected}
              />
              <button
                className={styles.pullBtn}
                onClick={handlePull}
                disabled={isPulling || !newModel.trim() || !ollamaStatus?.connected}
              >
                {isPulling ? 'Pulling...' : 'Pull'}
              </button>
            </div>
            {isPulling && (
              <div className={styles.progressBar}>
                <div className={styles.progressText}>{pullProgress}</div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
