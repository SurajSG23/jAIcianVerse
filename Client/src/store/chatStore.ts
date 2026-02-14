import { create } from "zustand";
import type { IChat, IMessage, IUser } from "../types/chat.types";
import * as chatApi from "../services/chatApi";

interface ChatStore {
  // ── Data ───────────────────────────────────────────────────────
  currentUser: IUser | null;
  chats: IChat[];
  activeChat: IChat | null;
  messages: IMessage[];
  onlineUsers: string[];
  typingUsers: Record<string, string[]>; // chatId → userId[]
  searchResults: IUser[];
  messageSearchResults: IMessage[];
  unreadCounts: Record<string, number>; // chatId → count

  // ── UI state ───────────────────────────────────────────────────
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
  isSendingMessage: boolean;
  currentPage: number;
  totalPages: number;
  replyingTo: IMessage | null;
  editingMessage: IMessage | null;
  forwardingMessage: IMessage | null;

  // ── Actions ────────────────────────────────────────────────────
  setCurrentUser: (user: IUser | null) => void;
  loadChats: () => Promise<void>;
  setActiveChat: (chat: IChat | null) => void;
  loadMessages: (chatId: string, page?: number) => Promise<void>;
  loadOlderMessages: (chatId: string) => Promise<void>;

  addMessage: (message: IMessage) => void;
  updateMessage: (message: IMessage) => void;
  removeMessage: (messageId: string) => void;

  setOnlineUsers: (userIds: string[]) => void;
  addTypingUser: (chatId: string, userId: string) => void;
  removeTypingUser: (chatId: string, userId: string) => void;

  markMessagesRead: (chatId: string, messageIds: string[], readBy: string) => void;

  setSearchResults: (users: IUser[]) => void;
  setMessageSearchResults: (msgs: IMessage[]) => void;
  incrementUnread: (chatId: string) => void;
  clearUnread: (chatId: string) => void;

  setReplyingTo: (msg: IMessage | null) => void;
  setEditingMessage: (msg: IMessage | null) => void;
  setForwardingMessage: (msg: IMessage | null) => void;

  updateChat: (chat: IChat) => void;
  addChat: (chat: IChat) => void;
  removeChatFromList: (chatId: string) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  currentUser: null,
  chats: [],
  activeChat: null,
  messages: [],
  onlineUsers: [],
  typingUsers: {},
  searchResults: [],
  messageSearchResults: [],
  unreadCounts: {},

  isLoadingChats: false,
  isLoadingMessages: false,
  isSendingMessage: false,
  currentPage: 1,
  totalPages: 1,
  replyingTo: null,
  editingMessage: null,
  forwardingMessage: null,

  // ── Setters ────────────────────────────────────────────────────
  setCurrentUser: (user) => set({ currentUser: user }),

  loadChats: async () => {
    set({ isLoadingChats: true });
    try {
      const chats = await chatApi.fetchChats();
      set({ chats, isLoadingChats: false });
    } catch {
      set({ isLoadingChats: false });
    }
  },

  setActiveChat: (chat) => {
    set({
      activeChat: chat,
      messages: [],
      currentPage: 1,
      totalPages: 1,
      replyingTo: null,
      editingMessage: null,
      messageSearchResults: [],
    });
    if (chat) {
      get().clearUnread(chat._id);
    }
  },

  loadMessages: async (chatId, page = 1) => {
    set({ isLoadingMessages: true });
    try {
      const data = await chatApi.getMessages(chatId, page);
      set({
        messages: data.messages,
        currentPage: data.page,
        totalPages: data.totalPages,
        isLoadingMessages: false,
      });
    } catch {
      set({ isLoadingMessages: false });
    }
  },

  loadOlderMessages: async (chatId) => {
    const { currentPage, totalPages } = get();
    if (currentPage >= totalPages) return;

    const nextPage = currentPage + 1;
    try {
      const data = await chatApi.getMessages(chatId, nextPage);
      set((state) => ({
        messages: [...data.messages, ...state.messages],
        currentPage: data.page,
        totalPages: data.totalPages,
      }));
    } catch {
      /* swallow */
    }
  },

  addMessage: (message) =>
    set((state) => {
      // Duplicate guard
      if (state.messages.find((m) => m._id === message._id)) return state;

      // Update chat list
      const chatId =
        typeof message.chat === "string" ? message.chat : message.chat._id;

      const updatedChats = state.chats.map((c) =>
        c._id === chatId ? { ...c, latestMessage: message, updatedAt: message.createdAt } : c
      );
      // Move updated chat to top
      updatedChats.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      return { messages: [...state.messages, message], chats: updatedChats };
    }),

  updateMessage: (message) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === message._id ? message : m
      ),
    })),

  removeMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === messageId
          ? { ...m, isDeleted: true, content: "This message was deleted" }
          : m
      ),
    })),

  setOnlineUsers: (userIds) => set({ onlineUsers: userIds }),

  addTypingUser: (chatId, userId) =>
    set((state) => {
      const current = state.typingUsers[chatId] || [];
      if (current.includes(userId)) return state;
      return {
        typingUsers: { ...state.typingUsers, [chatId]: [...current, userId] },
      };
    }),

  removeTypingUser: (chatId, userId) =>
    set((state) => {
      const current = state.typingUsers[chatId] || [];
      return {
        typingUsers: {
          ...state.typingUsers,
          [chatId]: current.filter((id) => id !== userId),
        },
      };
    }),

  markMessagesRead: (_chatId, messageIds, readBy) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        messageIds.includes(m._id) && !m.readBy.includes(readBy)
          ? { ...m, readBy: [...m.readBy, readBy] }
          : m
      ),
    })),

  setSearchResults: (users) => set({ searchResults: users }),
  setMessageSearchResults: (msgs) => set({ messageSearchResults: msgs }),

  incrementUnread: (chatId) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [chatId]: (state.unreadCounts[chatId] || 0) + 1,
      },
    })),

  clearUnread: (chatId) =>
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [chatId]: 0 },
    })),

  setReplyingTo: (msg) => set({ replyingTo: msg }),
  setEditingMessage: (msg) => set({ editingMessage: msg }),
  setForwardingMessage: (msg) => set({ forwardingMessage: msg }),

  updateChat: (chat) =>
    set((state) => ({
      chats: state.chats.map((c) => (c._id === chat._id ? chat : c)),
      activeChat:
        state.activeChat?._id === chat._id ? chat : state.activeChat,
    })),

  addChat: (chat) =>
    set((state) => {
      if (state.chats.find((c) => c._id === chat._id)) return state;
      return { chats: [chat, ...state.chats] };
    }),

  removeChatFromList: (chatId) =>
    set((state) => ({
      chats: state.chats.filter((c) => c._id !== chatId),
      activeChat: state.activeChat?._id === chatId ? null : state.activeChat,
    })),
}));
