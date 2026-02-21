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

export function switchOllamaModel(model: string): Promise<{ success: boolean; model: string }> {
  return apiFetch('/ollama/model', {
    method: 'PUT',
    body: JSON.stringify({ model }),
  });
}

export function getDeviceStats(): Promise<DeviceStats> {
  return apiFetch('/device/stats');
}

export function testOllamaConnection(prompt?: string): Promise<{
  success: boolean;
  model: string;
  response?: string;
  elapsed_ms?: number;
  error?: string;
}> {
  return apiFetch('/ollama/test', {
    method: 'POST',
    body: JSON.stringify(prompt ? { prompt } : {}),
  });
}
