import axios from "axios";
import type { IChat, IMessage, IUser, PaginatedMessages } from "../types/chat.types";

const API = axios.create({ baseURL: "http://localhost:3000/api" });

// Attach token to every request
API.interceptors.request.use((config) => {
  const stored = localStorage.getItem("userInfo");
  if (stored) {
    try {
      const { token } = JSON.parse(stored);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {
      /* ignore parse errors */
    }
  }
  return config;
});

// ── Chat endpoints ──────────────────────────────────────────────────
export const fetchChats = (): Promise<IChat[]> =>
  API.get("/chat").then((r) => r.data);

export const accessChat = (userId: string): Promise<IChat> =>
  API.post("/chat", { userId }).then((r) => r.data);

export const createGroupChat = (name: string, users: string[]): Promise<IChat> =>
  API.post("/chat/group", { name, users }).then((r) => r.data);

export const renameGroup = (chatId: string, chatName: string): Promise<IChat> =>
  API.put("/chat/group/rename", { chatId, chatName }).then((r) => r.data);

export const addToGroup = (chatId: string, userId: string): Promise<IChat> =>
  API.put("/chat/group/add", { chatId, userId }).then((r) => r.data);

export const removeFromGroup = (chatId: string, userId: string): Promise<IChat> =>
  API.put("/chat/group/remove", { chatId, userId }).then((r) => r.data);

export const searchUsers = (search: string): Promise<IUser[]> =>
  API.get(`/chat/search-users?search=${encodeURIComponent(search)}`).then(
    (r) => r.data
  );

// ── Message endpoints ───────────────────────────────────────────────
export const getMessages = (
  chatId: string,
  page = 1,
  limit = 50
): Promise<PaginatedMessages> =>
  API.get(`/message/${chatId}?page=${page}&limit=${limit}`).then((r) => r.data);

export const searchMessages = (
  chatId: string,
  query: string
): Promise<IMessage[]> =>
  API.get(
    `/message/${chatId}/search?q=${encodeURIComponent(query)}`
  ).then((r) => r.data);

export default API;
