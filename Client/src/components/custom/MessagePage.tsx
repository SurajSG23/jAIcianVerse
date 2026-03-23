import { cn } from "../../../lib/utils";
import Sidebar from "./Navbar";
import { useState, useEffect, useCallback } from "react";
import { MessageSquare, MessageSquarePlus } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { useChatStore } from "../../store/chatStore";
import ChatSidebar from "../chat/ChatSidebar";
import ChatWindow from "../chat/ChatWindow";
import GroupModal from "../chat/GroupModal";
import ForwardModal from "../chat/ForwardModal";
import type { IChat } from "../../types/chat.types";

const MessagePage = () => {
  const { checkUser } = useAuth();
  const { socket, isConnected } = useSocket();
  const {
    currentUser,
    setCurrentUser,
    activeChat,
    setActiveChat,
    loadChats,
    loadMessages,
    addMessage,
    updateMessage,
    removeMessage,
    setOnlineUsers,
    addTypingUser,
    removeTypingUser,
    markMessagesRead,
    incrementUnread,
    updateChat,
    addChat,
    removeChatFromList,
    forwardingMessage,
    clearUnread,
  } = useChatStore();

  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [newChatTrigger, setNewChatTrigger] = useState(0);

  // ── Auth guard ───────────────────────────────────────────────────
  useEffect(() => {
    checkUser("messages");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load current user from localStorage ──────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("userInfo");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCurrentUser({
          _id: parsed.id,
          name: parsed.name,
          email: parsed.email,
          profileImage:
            parsed.profileImage ||
            "https://cdn-icons-png.freepik.com/512/8608/8608769.png",
        });
      } catch {
        /* ignore */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load chats on mount ──────────────────────────────────────────
  useEffect(() => {
    if (currentUser) {
      loadChats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // ── Socket event listeners ───────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleReceiveMessage = (message: any) => {
      const chatId =
        typeof message.chat === "string" ? message.chat : message.chat._id;

      addMessage(message);

      // If the message is not for the active chat, increment unread
      if (activeChat?._id !== chatId) {
        incrementUnread(chatId);

        // Browser notification
        if (
          typeof window !== "undefined" &&
          "Notification" in window &&
          Notification.permission === "granted"
        ) {
          new Notification(message.sender.name, {
            body: message.content,
            icon: message.sender.profileImage,
          });
        }

        // Sound notification
        try {
          const audio = new Audio(
            "data:audio/wav;base64,UklGRl9vT19teleQBtAAAA"
          );
          audio.volume = 0.3;
          audio.play().catch(() => {});
        } catch {
          /* ignore audio errors */
        }
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMessageSent = (message: any) => {
      addMessage(message);
    };

    const handleOnlineUsers = (userIds: string[]) => {
      setOnlineUsers(userIds);
    };

    const handleTyping = ({ chatId, userId }: { chatId: string; userId: string }) => {
      addTypingUser(chatId, userId);
    };

    const handleStopTyping = ({ chatId, userId }: { chatId: string; userId: string }) => {
      removeTypingUser(chatId, userId);
    };

    const handleMessagesRead = ({
      chatId,
      messageIds,
      readBy,
    }: {
      chatId: string;
      messageIds: string[];
      readBy: string;
    }) => {
      markMessagesRead(chatId, messageIds, readBy);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMessageEdited = (message: any) => {
      updateMessage(message);
    };

    const handleMessageDeleted = ({ messageId }: { messageId: string }) => {
      removeMessage(messageId);
    };

    const handleGroupCreated = (chat: IChat) => {
      addChat(chat);
      socket.emit("join_chat", chat._id);
    };

    const handleGroupUpdated = (chat: IChat) => {
      updateChat(chat);
    };

    const handleLeftGroup = ({ chatId }: { chatId: string }) => {
      removeChatFromList(chatId);
    };

    const handleRemovedFromGroup = ({ chatId }: { chatId: string }) => {
      removeChatFromList(chatId);
    };

    // Register listeners
    socket.on("receive_message", handleReceiveMessage);
    socket.on("message_sent", handleMessageSent);
    socket.on("online_users", handleOnlineUsers);
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);
    socket.on("messages_read", handleMessagesRead);
    socket.on("message_edited", handleMessageEdited);
    socket.on("message_deleted", handleMessageDeleted);
    socket.on("group_created", handleGroupCreated);
    socket.on("group_updated", handleGroupUpdated);
    socket.on("left_group", handleLeftGroup);
    socket.on("removed_from_group", handleRemovedFromGroup);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("message_sent", handleMessageSent);
      socket.off("online_users", handleOnlineUsers);
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
      socket.off("messages_read", handleMessagesRead);
      socket.off("message_edited", handleMessageEdited);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("group_created", handleGroupCreated);
      socket.off("group_updated", handleGroupUpdated);
      socket.off("left_group", handleLeftGroup);
      socket.off("removed_from_group", handleRemovedFromGroup);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, activeChat?._id]);

  // ── Request browser notification permission ──────────────────────
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      Notification.requestPermission();
    }
  }, []);

  // ── Open forward modal when forwardingMessage is set ─────────────
  useEffect(() => {
    if (forwardingMessage) setShowForwardModal(true);
  }, [forwardingMessage]);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleSelectChat = useCallback(
    (chat: IChat) => {
      setActiveChat(chat);
      loadMessages(chat._id);
      clearUnread(chat._id);
      setIsMobileChatOpen(true);
      socket?.emit("join_chat", chat._id);
    },
    [setActiveChat, loadMessages, clearUnread, socket]
  );

  const handleBack = useCallback(() => {
    setIsMobileChatOpen(false);
    setActiveChat(null);
  }, [setActiveChat]);

  const handleStartNewChat = useCallback(() => {
    setIsMobileChatOpen(false);
    setActiveChat(null);
    setNewChatTrigger((prev) => prev + 1);
  }, [setActiveChat]);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mx-auto fixed flex w-full flex-1 flex-col border border-neutral-200 bg-gray-100 md:flex-row dark:border-neutral-700 dark:bg-black h-screen text-white"
      )}
    >
      <style>
        {`
          ::-webkit-scrollbar {
            width: 10px;
          }
          ::-webkit-scrollbar-track {
            background-color: black;
          }
          ::-webkit-scrollbar-thumb {
            background-color: rgba(63, 63, 63, 0.604);
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            transition: all 0.3s ease;
            background-color: rgba(54, 54, 54, 0.8);
            cursor: pointer;
          }
        `}
      </style>
      <Sidebar />

      <div className="dark h-screen w-full overflow-hidden">
        <div className="flex h-full bg-black">
          {/* ── Chat Sidebar ─────────────────────────────────────── */}
          <div
            className={`${
              isMobileChatOpen ? "hidden" : "flex"
            } lg:flex shrink-0`}
          >            <ChatSidebar
              currentUser={currentUser}
              onSelectChat={handleSelectChat}
              onCreateGroup={() => setShowGroupModal(true)}
              selectedChatId={activeChat?._id || null}
              newChatTrigger={newChatTrigger}
            />
          </div>

          {/* ── Chat Window ──────────────────────────────────────── */}
          <div
            className={`${
              isMobileChatOpen ? "flex" : "hidden"
            } lg:flex flex-1 min-w-0 flex-col relative`}
          >
            {activeChat ? (
              <ChatWindow
                chat={activeChat}
                currentUser={currentUser}
                onBack={handleBack}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-black">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-neutral-900 rounded-full mb-4">
                    <MessageSquare className="w-10 h-10 text-orange-500" />
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Choose a chat from the list to start messaging
                  </p>
                  {!isConnected && (
                    <p className="text-red-400 text-xs mt-3 flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      Reconnecting...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile FAB */}
        <div className="lg:hidden">
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleStartNewChat}
            className="fixed bottom-6 right-6 w-14 h-14 bg-orange-600 hover:bg-orange-700 rounded-full shadow-2xl shadow-orange-500/30 flex items-center justify-center z-50 transition-colors"
          >
            <MessageSquarePlus className="w-6 h-6 text-white" />
          </motion.button>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────── */}
      <GroupModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        currentUser={currentUser}
      />
      <ForwardModal
        isOpen={showForwardModal}
        onClose={() => setShowForwardModal(false)}
        currentUser={currentUser}
      />
    </div>
  );
};

export default MessagePage;
