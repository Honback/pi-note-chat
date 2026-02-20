import { create } from 'zustand';
import type { OllamaStatus, OllamaModel, DeviceStats } from '../types';
import * as api from '../api/ollama';

interface SettingsState {
  // Ollama
  ollamaStatus: OllamaStatus | null;
  models: OllamaModel[];
  // Device
  deviceStats: DeviceStats | null;
  // UI
  settingsOpen: boolean;
  pullProgress: string;
  isPulling: boolean;

  // Actions
  fetchStatus: () => Promise<void>;
  fetchModels: () => Promise<void>;
  fetchDeviceStats: () => Promise<void>;
  deleteModel: (name: string) => Promise<void>;
  pullModel: (name: string) => void;
  setSettingsOpen: (open: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ollamaStatus: null,
  models: [],
  deviceStats: null,
  settingsOpen: false,
  pullProgress: '',
  isPulling: false,

  fetchStatus: async () => {
    try {
      const status = await api.getOllamaStatus();
      set({ ollamaStatus: status });
    } catch {
      set({
        ollamaStatus: { connected: false, currentModel: '', runningModels: [] },
      });
    }
  },

  fetchModels: async () => {
    try {
      const data = await api.getOllamaModels();
      set({ models: data.models || [] });
    } catch {
      set({ models: [] });
    }
  },

  fetchDeviceStats: async () => {
    try {
      const stats = await api.getDeviceStats();
      set({ deviceStats: stats });
    } catch {
      set({
        deviceStats: {
          online: false,
          hasDeviceStats: false,
          cpu: -1,
          temperature: -1,
          memoryUsed: -1,
          memoryTotal: -1,
        },
      });
    }
  },

  deleteModel: async (name: string) => {
    try {
      await api.deleteOllamaModel(name);
      await get().fetchModels();
    } catch (e) {
      console.error('Failed to delete model:', e);
    }
  },

  pullModel: (name: string) => {
    set({ isPulling: true, pullProgress: 'Starting download...' });
    const eventSource = new EventSource(
      `/api/ollama/models/pull?model=${encodeURIComponent(name)}`
    );

    // SSE via POST isn't standard for EventSource, use fetch instead
    fetch('/api/ollama/models/pull', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: name }),
    })
      .then(async (res) => {
        const reader = res.body?.getReader();
        if (!reader) return;
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data:')) {
              const data = line.slice(5).trim();
              try {
                const parsed = JSON.parse(data);
                if (parsed.status) {
                  const pct = parsed.completed && parsed.total
                    ? ` (${Math.round((parsed.completed / parsed.total) * 100)}%)`
                    : '';
                  set({ pullProgress: parsed.status + pct });
                }
              } catch {
                // raw ndjson from ollama
                try {
                  // Try parsing each sub-line
                  for (const subline of data.split('\n')) {
                    if (!subline.trim()) continue;
                    const p = JSON.parse(subline);
                    if (p.status) {
                      const pct = p.completed && p.total
                        ? ` (${Math.round((p.completed / p.total) * 100)}%)`
                        : '';
                      set({ pullProgress: p.status + pct });
                    }
                  }
                } catch { /* ignore */ }
              }
            }
          }
        }
      })
      .catch((e) => {
        set({ pullProgress: `Error: ${e.message}` });
      })
      .finally(() => {
        set({ isPulling: false });
        eventSource.close();
        get().fetchModels();
      });
  },

  setSettingsOpen: (open: boolean) => set({ settingsOpen: open }),
}));
