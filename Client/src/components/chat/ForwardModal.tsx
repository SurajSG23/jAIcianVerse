import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Forward } from "lucide-react";
import { useChatStore } from "../../store/chatStore";
import { useSocket } from "../../context/SocketContext";
import type { IUser } from "../../types/chat.types";

interface ForwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: IUser;
}

const ForwardModal = ({ isOpen, onClose, currentUser }: ForwardModalProps) => {
  const { socket } = useSocket();
  const { chats, forwardingMessage, setForwardingMessage } = useChatStore();
  const [filter, setFilter] = useState("");

  const filteredChats = chats.filter((chat) => {
    const name = chat.isGroupChat
      ? chat.chatName
      : chat.users.find((u) => u._id !== currentUser._id)?.name || "";
    return name.toLowerCase().includes(filter.toLowerCase());
  });

  const handleForward = (chatId: string) => {
    if (!forwardingMessage) return;

    socket?.emit("send_message", {
      chatId,
      content: forwardingMessage.content,
      type: forwardingMessage.type,
      imageUrl: forwardingMessage.imageUrl,
      forwardedFrom: forwardingMessage._id,
    });

    setForwardingMessage(null);
    onClose();
  };

  const handleClose = () => {
    setForwardingMessage(null);
    setFilter("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && forwardingMessage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <h2 className="text-white font-semibold">Forward Message</h2>
              <button onClick={handleClose} className="p-1.5 hover:bg-neutral-800 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Preview */}
            <div className="px-4 py-3 bg-neutral-800/50 border-b border-neutral-800">
              <p className="text-xs text-gray-400 mb-1">Message to forward:</p>
              <p className="text-sm text-white truncate">{forwardingMessage.content}</p>
            </div>

            {/* Filter */}
            <div className="p-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full bg-neutral-800 text-white pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>
            </div>

            {/* Chat list */}
            <div className="max-h-60 overflow-y-auto px-3 pb-3 space-y-1">
              {filteredChats.map((chat) => {
                const otherUser = chat.isGroupChat
                  ? null
                  : chat.users.find((u) => u._id !== currentUser._id);

                return (
                  <div
                    key={chat._id}
                    onClick={() => handleForward(chat._id)}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-800 cursor-pointer transition-colors"
                  >
                    <img
                      src={
                        chat.isGroupChat
                          ? chat.groupAvatar || "https://cdn-icons-png.flaticon.com/512/681/681494.png"
                          : otherUser?.profileImage || ""
                      }
                      alt=""
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <span className="text-sm text-white flex-1 truncate">
                      {chat.isGroupChat ? chat.chatName : otherUser?.name}
                    </span>
                    <Forward className="w-4 h-4 text-orange-500" />
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ForwardModal;
