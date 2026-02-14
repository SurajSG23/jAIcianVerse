import { useChatStore } from "../../store/chatStore";
import type { IChat, IUser } from "../../types/chat.types";
import { motion, AnimatePresence } from "framer-motion";
import SearchBar from "./SearchBar";
import {
  MessageSquarePlus,
  Users,
  MessageSquare,
} from "lucide-react";

interface ChatSidebarProps {
  currentUser: IUser;
  onSelectChat: (chat: IChat) => void;
  onCreateGroup: () => void;
  selectedChatId: string | null;
}

const ChatSidebar = ({
  currentUser,
  onSelectChat,
  onCreateGroup,
  selectedChatId,
}: ChatSidebarProps) => {
  const { chats, isLoadingChats, onlineUsers, typingUsers, unreadCounts } =
    useChatStore();

  const getChatName = (chat: IChat): string => {
    if (chat.isGroupChat) return chat.chatName;
    const other = chat.users.find((u) => u._id !== currentUser._id);
    return other?.name || "Unknown";
  };

  const getChatAvatar = (chat: IChat): string => {
    if (chat.isGroupChat)
      return (
        chat.groupAvatar ||
        "https://cdn-icons-png.flaticon.com/512/681/681494.png"
      );
    const other = chat.users.find((u) => u._id !== currentUser._id);
    return (
      other?.profileImage ||
      "https://cdn-icons-png.freepik.com/512/8608/8608769.png"
    );
  };

  const isOnline = (chat: IChat): boolean => {
    if (chat.isGroupChat) return false;
    const other = chat.users.find((u) => u._id !== currentUser._id);
    return other ? onlineUsers.includes(other._id) : false;
  };

  const getLastMessagePreview = (chat: IChat): string => {
    if (!chat.latestMessage) return "No messages yet";
    const prefix =
      chat.latestMessage.sender._id === currentUser._id
        ? "You: "
        : chat.isGroupChat
        ? `${chat.latestMessage.sender.name}: `
        : "";
    return prefix + chat.latestMessage.content;
  };

  const getTimestamp = (chat: IChat): string => {
    const dateStr = chat.latestMessage?.createdAt || chat.updatedAt;
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const chatTyping = (chatId: string): boolean => {
    const users = typingUsers[chatId] || [];
    return users.filter((u) => u !== currentUser._id).length > 0;
  };

  return (
    <div className="flex flex-col h-full bg-black border-r border-neutral-800 w-full lg:w-96 shrink-0">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center gap-3">
        <img
          src={currentUser.profileImage}
          alt={currentUser.name}
          className="w-9 h-9 rounded-full object-cover"
        />
        <div className="flex-1 min-w-0">
          <h2 className="text-white text-lg font-bold truncate">Messages</h2>
        </div>
      </div>

      {/* Actions */}
      <div className="px-3 py-2 flex gap-2">
        <button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 text-sm">
          <MessageSquarePlus className="w-4 h-4" />
          New Chat
        </button>
        <button
          onClick={onCreateGroup}
          className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white p-2 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm"
        >
          <Users className="w-4 h-4" />
          Group
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-1">
        <SearchBar
          mode="users"
          onUserChatOpened={() => {
            /* sidebar stays visible on desktop */
          }}
        />
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingChats && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoadingChats && chats.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <MessageSquare className="w-12 h-12 text-neutral-600 mb-3" />
            <p className="text-gray-400 text-sm">No conversations yet</p>
            <p className="text-gray-500 text-xs mt-1">
              Search for users above to start chatting
            </p>
          </div>
        )}

        <AnimatePresence>
          {chats.map((chat, index) => {
            const unread = unreadCounts[chat._id] || 0;
            return (
              <motion.div
                key={chat._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => onSelectChat(chat)}
                className={`flex items-start gap-3 p-3 cursor-pointer transition-all border-l-4 ${
                  selectedChatId === chat._id
                    ? "bg-neutral-900 border-orange-500"
                    : "border-transparent hover:bg-neutral-900/50"
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={getChatAvatar(chat)}
                    alt={getChatName(chat)}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {isOnline(chat) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black" />
                  )}
                  {chat.isGroupChat && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-neutral-800 rounded-full flex items-center justify-center border border-neutral-700">
                      <Users className="w-2.5 h-2.5 text-orange-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className="text-white font-semibold text-sm truncate">
                      {getChatName(chat)}
                    </h3>
                    <span className="text-[10px] text-gray-500 shrink-0 ml-2">
                      {getTimestamp(chat)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      {chatTyping(chat._id) ? (
                        <div className="flex items-center gap-1">
                          <motion.div className="flex gap-0.5">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-1.5 h-1.5 bg-orange-400 rounded-full"
                                animate={{ y: [0, -3, 0] }}
                                transition={{
                                  duration: 0.6,
                                  repeat: Infinity,
                                  delay: i * 0.1,
                                }}
                              />
                            ))}
                          </motion.div>
                          <span className="text-xs text-orange-400 ml-1">
                            typing...
                          </span>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 truncate">
                          {getLastMessagePreview(chat)}
                        </p>
                      )}
                    </div>
                    {unread > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="shrink-0 ml-2 bg-orange-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center"
                      >
                        {unread > 9 ? "9+" : unread}
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatSidebar;
