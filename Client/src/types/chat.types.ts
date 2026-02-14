// ── Shared TypeScript types for the chat feature ───────────────────

export interface IUser {
  _id: string;
  name: string;
  email: string;
  profileImage: string;
  role?: string;
  branch?: string;
  semester?: number;
}

export interface IChat {
  _id: string;
  chatName: string;
  isGroupChat: boolean;
  users: IUser[];
  latestMessage?: IMessage;
  groupAdmin?: IUser;
  groupAvatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IMessage {
  _id: string;
  sender: IUser;
  chat: IChat | string;
  content: string;
  type: "text" | "image";
  imageUrl?: string;
  readBy: string[];
  isEdited: boolean;
  isDeleted: boolean;
  replyTo?: IMessage;
  forwardedFrom?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedMessages {
  messages: IMessage[];
  page: number;
  totalPages: number;
  total: number;
}

export interface TypingInfo {
  chatId: string;
  userId: string;
}
