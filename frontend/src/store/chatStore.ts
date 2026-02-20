import { create } from 'zustand';
import type { Conversation, Message } from '../types';
import * as api from '../api/conversations';

interface ChatState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  streamingContent: string;
  isStreaming: boolean;
  sidebarOpen: boolean;

  // Actions
  loadConversations: () => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  createConversation: () => Promise<Conversation>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  searchConversations: (q: string) => Promise<void>;
  addMessage: (msg: Message) => void;
  setStreamingContent: (content: string) => void;
  appendStreamingToken: (token: string) => void;
  setIsStreaming: (streaming: boolean) => void;
  updateConversationTitle: (id: string, title: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  streamingContent: '',
  isStreaming: false,
  sidebarOpen: false,

  loadConversations: async () => {
    const conversations = await api.listConversations();
    set({ conversations });
  },

  selectConversation: async (id: string) => {
    const data = await api.getConversation(id);
    set({
      currentConversation: data.conversation,
      messages: data.messages,
      streamingContent: '',
      sidebarOpen: false,
    });
  },

  createConversation: async () => {
    const conv = await api.createConversation();
    set(state => ({
      conversations: [conv, ...state.conversations],
      currentConversation: conv,
      messages: [],
      streamingContent: '',
      sidebarOpen: false,
    }));
    return conv;
  },

  deleteConversation: async (id: string) => {
    await api.deleteConversation(id);
    const { currentConversation } = get();
    set(state => ({
      conversations: state.conversations.filter(c => c.id !== id),
      currentConversation: currentConversation?.id === id ? null : currentConversation,
      messages: currentConversation?.id === id ? [] : state.messages,
    }));
  },

  renameConversation: async (id: string, title: string) => {
    const updated = await api.updateConversationTitle(id, title);
    set(state => ({
      conversations: state.conversations.map(c => c.id === id ? updated : c),
      currentConversation: state.currentConversation?.id === id ? updated : state.currentConversation,
    }));
  },

  searchConversations: async (q: string) => {
    if (!q.trim()) {
      return get().loadConversations();
    }
    const conversations = await api.searchConversations(q);
    set({ conversations });
  },

  addMessage: (msg: Message) => {
    set(state => ({ messages: [...state.messages, msg] }));
  },

  setStreamingContent: (content: string) => {
    set({ streamingContent: content });
  },

  appendStreamingToken: (token: string) => {
    set(state => ({ streamingContent: state.streamingContent + token }));
  },

  setIsStreaming: (streaming: boolean) => {
    set({ isStreaming: streaming });
  },

  updateConversationTitle: (id: string, title: string) => {
    set(state => ({
      conversations: state.conversations.map(c =>
        c.id === id ? { ...c, title } : c
      ),
      currentConversation: state.currentConversation?.id === id
        ? { ...state.currentConversation, title }
        : state.currentConversation,
    }));
  },

  toggleSidebar: () => {
    set(state => ({ sidebarOpen: !state.sidebarOpen }));
  },

  setSidebarOpen: (open: boolean) => {
    set({ sidebarOpen: open });
  },
}));
