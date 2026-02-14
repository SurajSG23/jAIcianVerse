import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Paperclip,
  Smile,
  X,
  ArrowDown,
  Search,
} from "lucide-react";
import { useChatStore } from "../../store/chatStore";
import { useSocket } from "../../context/SocketContext";
import MessageBubble from "./MessageBubble";
import SearchBar from "./SearchBar";
import type { IChat, IUser } from "../../types/chat.types";

interface ChatWindowProps {
  chat: IChat;
  currentUser: IUser;
  onBack?: () => void;
}

const ChatWindow = ({ chat, currentUser, onBack }: ChatWindowProps) => {
  const { socket } = useSocket();
  const {
    messages,
    loadMessages,
    loadOlderMessages,
    isLoadingMessages,
    currentPage,
    totalPages,
    replyingTo,
    editingMessage,
    forwardingMessage,
    setReplyingTo,
    setEditingMessage,
    setForwardingMessage,
    typingUsers,
    onlineUsers,
  } = useChatStore();

  const [input, setInput] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load messages when chat changes
  useEffect(() => {
    if (chat._id) {
      loadMessages(chat._id);
      socket?.emit("join_chat", chat._id);
    }
  }, [chat._id, socket, loadMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (!showScrollBtn) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, showScrollBtn]);

  // Populate edit input
  useEffect(() => {
    if (editingMessage) {
      setInput(editingMessage.content);
    }
  }, [editingMessage]);

  // Detect scroll position for "scroll to bottom" button
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollBtn(distanceFromBottom > 200);

    // Infinite scroll: load older when scrolled to top
    if (container.scrollTop < 50 && currentPage < totalPages && !isLoadingMessages) {
      const prevScrollHeight = container.scrollHeight;
      loadOlderMessages(chat._id).then(() => {
        // Maintain scroll position
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight - prevScrollHeight;
        });
      });
    }
  }, [currentPage, totalPages, isLoadingMessages, chat._id, loadOlderMessages]);

  // Typing indicator logic
  const handleInputChange = (value: string) => {
    setInput(value);

    if (!isTyping) {
      setIsTyping(true);
      socket?.emit("typing", { chatId: chat._id });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit("stop_typing", { chatId: chat._id });
    }, 2000);
  };

  // Send / edit message
  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed && !imagePreview) return;

    // Stop typing
    if (isTyping) {
      setIsTyping(false);
      socket?.emit("stop_typing", { chatId: chat._id });
    }

    if (editingMessage) {
      // Edit existing message
      socket?.emit("edit_message", {
        messageId: editingMessage._id,
        chatId: chat._id,
        content: trimmed,
      });
      setEditingMessage(null);
      setInput("");
      return;
    }

    // Send new message
    socket?.emit("send_message", {
      chatId: chat._id,
      content: trimmed,
      type: imagePreview ? "image" : "text",
      imageUrl: imagePreview || undefined,
      replyTo: replyingTo?._id,
      forwardedFrom: forwardingMessage?._id,
    });

    setInput("");
    setReplyingTo(null);
    setForwardingMessage(null);
    setImagePreview(null);
  };

  // Delete message
  const handleDelete = useCallback(
    (messageId: string) => {
      socket?.emit("delete_message", { messageId, chatId: chat._id });
    },
    [socket, chat._id]
  );

  // Global click handler for delete buttons
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest("[data-action='delete']");
      if (btn) {
        const msgId = btn.getAttribute("data-message-id");
        if (msgId) handleDelete(msgId);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [handleDelete]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape") {
      setReplyingTo(null);
      setEditingMessage(null);
      setForwardingMessage(null);
      setInput("");
    }
  };

  // Image upload
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Mark messages as read
  useEffect(() => {
    if (!chat._id || !messages.length) return;

    const unreadIds = messages
      .filter(
        (m) =>
          m.sender._id !== currentUser._id &&
          !m.readBy.includes(currentUser._id)
      )
      .map((m) => m._id);

    if (unreadIds.length) {
      socket?.emit("read_message", { chatId: chat._id, messageIds: unreadIds });
    }
  }, [messages, chat._id, currentUser._id, socket]);

  // Get other user for 1-on-1 chat
  const otherUser = chat.isGroupChat
    ? null
    : chat.users.find((u) => u._id !== currentUser._id);

  const isOtherOnline = otherUser ? onlineUsers.includes(otherUser._id) : false;

  const chatTypingUsers = typingUsers[chat._id] || [];
  const typingNames = chatTypingUsers
    .filter((uid) => uid !== currentUser._id)
    .map((uid) => {
      const user = chat.users.find((u) => u._id === uid);
      return user?.name || "Someone";
    });

  return (
    <div className="flex flex-col h-full bg-black">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="lg:hidden p-1 hover:bg-neutral-800 rounded-lg transition-colors mr-1"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div className="relative">
            <img
              src={
                chat.isGroupChat
                  ? chat.groupAvatar || "https://cdn-icons-png.flaticon.com/512/681/681494.png"
                  : otherUser?.profileImage
              }
              alt={chat.chatName}
              className="w-10 h-10 rounded-full object-cover"
            />
            {!chat.isGroupChat && isOtherOnline && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-neutral-900" />
            )}
          </div>
          <div>
            <h2 className="text-white font-semibold text-sm">
              {chat.isGroupChat
                ? chat.chatName
                : otherUser?.name || "Chat"}
            </h2>
            <p className="text-xs text-gray-400">
              {typingNames.length > 0 ? (
                <span className="text-orange-400">
                  {typingNames.join(", ")} typing...
                </span>
              ) : chat.isGroupChat ? (
                `${chat.users.length} members`
              ) : isOtherOnline ? (
                "Online"
              ) : (
                "Offline"
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
        >
          <Search className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* ── Message search ──────────────────────────────────────── */}
      {showSearch && (
        <div className="bg-neutral-900 border-b border-neutral-800 px-4 py-2">
          <SearchBar mode="messages" chatId={chat._id} />
        </div>
      )}

      {/* ── Messages ────────────────────────────────────────────── */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {isLoadingMessages && currentPage === 1 && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {currentPage < totalPages && (
          <div className="text-center py-2">
            <button
              onClick={() => loadOlderMessages(chat._id)}
              className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
            >
              Load older messages
            </button>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg._id}
            message={msg}
            currentUser={currentUser}
            isGroupChat={chat.isGroupChat}
          />
        ))}

        {/* Typing animation */}
        {typingNames.length > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex gap-1 bg-neutral-800 px-4 py-2.5 rounded-2xl rounded-bl-md">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-orange-400 rounded-full"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll-to-bottom button */}
      {showScrollBtn && (
        <button
          onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="absolute bottom-24 right-8 p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full shadow-lg transition-colors z-10"
        >
          <ArrowDown className="w-4 h-4 text-white" />
        </button>
      )}

      {/* ── Reply / Edit / Forward bar ──────────────────────────── */}
      {(replyingTo || editingMessage || forwardingMessage) && (
        <div className="bg-neutral-900 border-t border-neutral-800 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-1 h-8 bg-orange-500 rounded-full shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-orange-400 font-medium">
                {editingMessage
                  ? "Editing message"
                  : forwardingMessage
                  ? "Forwarding message"
                  : `Replying to ${replyingTo?.sender.name}`}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {(editingMessage || forwardingMessage || replyingTo)?.content}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setReplyingTo(null);
              setEditingMessage(null);
              setForwardingMessage(null);
              if (editingMessage) setInput("");
            }}
            className="p-1 hover:bg-neutral-800 rounded"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      )}

      {/* Image preview */}
      {imagePreview && (
        <div className="bg-neutral-900 border-t border-neutral-800 px-4 py-2">
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="preview"
              className="h-20 rounded-lg object-cover"
            />
            <button
              onClick={() => setImagePreview(null)}
              className="absolute -top-1 -right-1 p-0.5 bg-red-600 rounded-full"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* ── Input ───────────────────────────────────────────────── */}
      <div className="bg-neutral-900 border-t border-neutral-800 p-3 shrink-0">
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-neutral-800 rounded-xl transition-colors shrink-0"
          >
            <Paperclip className="w-5 h-5 text-gray-400" />
          </button>

          <div className="flex-1 bg-neutral-800 rounded-2xl px-4 py-2.5 flex items-center gap-2">
            <textarea
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none max-h-32 text-sm"
            />
            <button className="hover:scale-110 transition-transform shrink-0">
              <Smile className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!input.trim() && !imagePreview}
            className="p-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shrink-0 shadow-lg shadow-orange-500/20"
          >
            <Send className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
