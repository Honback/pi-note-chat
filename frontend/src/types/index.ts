export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface ConversationWithMessages {
  conversation: Conversation;
  messages: Message[];
}

// SSE events from backend
export interface MessageStartEvent {
  messageId: string;
  conversationId: string;
}

export interface TokenEvent {
  content: string;
}

export interface MessageEndEvent {
  messageId: string;
  title: string | null;
}

export interface ErrorEvent {
  code: string;
  message: string;
}

// Ollama management
export interface OllamaStatus {
  connected: boolean;
  currentModel: string;
  runningModels: OllamaRunningModel[];
}

export interface OllamaRunningModel {
  name: string;
  model: string;
  size: number;
}

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaModelsResponse {
  models: OllamaModel[];
}

// Device monitoring
export interface DeviceStats {
  online: boolean;
  hasDeviceStats: boolean;
  cpu: number;
  temperature: number;
  memoryUsed: number;
  memoryTotal: number;
}
