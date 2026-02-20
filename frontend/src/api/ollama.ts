import { apiFetch } from './client';
import type { OllamaStatus, OllamaModelsResponse, DeviceStats } from '../types';

export function getOllamaStatus(): Promise<OllamaStatus> {
  return apiFetch('/ollama/status');
}

export function getOllamaModels(): Promise<OllamaModelsResponse> {
  return apiFetch('/ollama/models');
}

export function deleteOllamaModel(name: string): Promise<{ success: boolean }> {
  return apiFetch(`/ollama/models/${encodeURIComponent(name)}`, { method: 'DELETE' });
}

export function getDeviceStats(): Promise<DeviceStats> {
  return apiFetch('/device/stats');
}
