import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  CheckCheck,
  Reply,
  Pencil,
  Trash2,
  Forward,
  MoreVertical,
} from "lucide-react";
import type { IMessage, IUser } from "../../types/chat.types";
import { useChatStore } from "../../store/chatStore";

interface MessageBubbleProps {
  message: IMessage;
  currentUser: IUser;
  isGroupChat: boolean;
}

const MessageBubble = ({ message, currentUser, isGroupChat }: MessageBubbleProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { setReplyingTo, setEditingMessage, setForwardingMessage } = useChatStore();

  const isOwn = message.sender._id === currentUser._id;

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const readStatus = () => {
    if (!isOwn) return null;
    if (message.readBy.length > 1) {
      return <CheckCheck className="w-3.5 h-3.5 text-orange-400" />;
    }
    return <Check className="w-3.5 h-3.5 text-gray-400" />;
  };

  if (message.isDeleted) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}>
        <div className="px-4 py-2 rounded-2xl bg-neutral-800/50 italic text-gray-500 text-sm">
          This message was deleted
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2 group`}
    >
      <div className={`flex items-end gap-2 max-w-[70%] ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar (non-own, group) */}
        {!isOwn && (
          <img
            src={message.sender.profileImage}
            alt={message.sender.name}
            className="w-7 h-7 rounded-full object-cover shrink-0"
          />
        )}

        <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
          {/* Sender name in group */}
          {!isOwn && isGroupChat && (
            <span className="text-xs text-orange-400 mb-0.5 ml-1">
              {message.sender.name}
            </span>
          )}

          {/* Reply context */}
          {message.replyTo && (
            <div
              className={`text-xs mb-1 px-3 py-1.5 rounded-lg border-l-2 border-orange-500 ${
                isOwn ? "bg-orange-700/20" : "bg-neutral-700/50"
              } max-w-full truncate`}
            >
              <span className="text-orange-400 font-medium">
                {message.replyTo.sender?.name || "User"}
              </span>
              <p className="text-gray-300 truncate">{message.replyTo.content}</p>
            </div>
          )}

          {/* Forwarded label */}
          {message.forwardedFrom && (
            <div className="text-xs text-gray-500 italic mb-0.5 flex items-center gap-1">
              <Forward className="w-3 h-3" /> Forwarded
            </div>
          )}

          {/* Bubble */}
          <div className="relative">
            <div
              className={`px-4 py-2.5 rounded-2xl ${
                isOwn
                  ? "bg-orange-600 text-white rounded-br-md"
                  : "bg-neutral-800 text-white rounded-bl-md"
              }`}
            >
              {message.type === "image" && message.imageUrl && (
                <div className="mb-2 rounded-lg overflow-hidden">
                  <img
                    src={message.imageUrl}
                    alt="shared"
                    className="max-w-[280px] max-h-[280px] object-cover rounded-lg"
                  />
                </div>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-all">
                {message.content}
              </p>
              {message.isEdited && (
                <span className="text-[10px] text-gray-300/60 ml-1">(edited)</span>
              )}
            </div>

            {/* Context menu trigger */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`absolute top-1 ${isOwn ? "-left-6" : "-right-6"} opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-neutral-700 rounded`}
            >
              <MoreVertical className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {/* Context menu */}
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  ref={menuRef}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`absolute z-50 top-0 ${
                    isOwn ? "-left-36" : "-right-36"
                  } bg-neutral-900 border border-neutral-700 rounded-xl shadow-xl overflow-hidden min-w-[130px]`}
                >
                  <button
                    onClick={() => {
                      setReplyingTo(message);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-800 text-sm text-white transition-colors"
                  >
                    <Reply className="w-3.5 h-3.5" /> Reply
                  </button>
                  <button
                    onClick={() => {
                      setForwardingMessage(message);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-800 text-sm text-white transition-colors"
                  >
                    <Forward className="w-3.5 h-3.5" /> Forward
                  </button>
                  {isOwn && (
                    <>
                      <button
                        onClick={() => {
                          setEditingMessage(message);
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-neutral-800 text-sm text-white transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-900/30 text-sm text-red-400 transition-colors"
                        data-action="delete"
                        data-message-id={message._id}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Timestamp + read status */}
          <div
            className={`flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-500 ${
              isOwn ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <span>{formatTime(message.createdAt)}</span>
            {readStatus()}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
