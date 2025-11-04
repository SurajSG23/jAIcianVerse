import { cn } from "../../../lib/utils";
import Sidebar from "./Navbar";
import { useState, useRef, useEffect } from "react";
import {
  Search,
  MessageSquarePlus,
  Users,
  Settings,
  Moon,
  Sun,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Paperclip,
  Send,
  Check,
  CheckCheck,
  Menu,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface User {
  id: string;
  name: string;
  avatar: string;
  status: "online" | "offline" | "away";
  lastSeen?: string;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  status: "sent" | "delivered" | "read";
}

interface Chat {
  id: string;
  user: User;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isTyping?: boolean;
  isGroup?: boolean;
  groupMembers?: User[];
}

const currentUser: User = {
  id: "user-0",
  name: "You",
  avatar:
    "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150",
  status: "online",
};

const users: User[] = [
  {
    id: "user-1",
    name: "Sarah Chen",
    avatar:
      "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150",
    status: "online",
  },
  {
    id: "user-2",
    name: "Marcus Rodriguez",
    avatar:
      "https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=150",
    status: "online",
  },
  {
    id: "user-3",
    name: "Emma Watson",
    avatar:
      "https://images.pexels.com/photos/1858175/pexels-photo-1858175.jpeg?auto=compress&cs=tinysrgb&w=150",
    status: "away",
  },
  {
    id: "user-4",
    name: "James Park",
    avatar:
      "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150",
    status: "offline",
    lastSeen: "2h ago",
  },
  {
    id: "user-5",
    name: "Olivia Martinez",
    avatar:
      "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=150",
    status: "online",
  },
];

const initialChats: Chat[] = [
  {
    id: "chat-1",
    user: users[0],
    lastMessage: "Hey! Did you finish the project proposal?",
    timestamp: "2m ago",
    unreadCount: 3,
    isTyping: true,
  },
  {
    id: "chat-2",
    user: users[1],
    lastMessage: "Sounds good! See you tomorrow 👍",
    timestamp: "15m ago",
    unreadCount: 0,
  },
  {
    id: "chat-3",
    user: users[2],
    lastMessage: "Can you send me the files?",
    timestamp: "1h ago",
    unreadCount: 1,
  },
  {
    id: "chat-4",
    user: users[3],
    lastMessage: "Thanks for your help!",
    timestamp: "3h ago",
    unreadCount: 0,
  },
  {
    id: "chat-5",
    user: users[4],
    lastMessage: "The meeting is at 3 PM",
    timestamp: "Yesterday",
    unreadCount: 0,
  },
];

const initialMessages: Record<string, Message[]> = {
  "chat-1": [
    {
      id: "msg-1",
      senderId: "user-0",
      content: "Hi Sarah! How are you doing?",
      timestamp: new Date(Date.now() - 3600000),
      status: "read",
    },
    {
      id: "msg-2",
      senderId: "user-1",
      content: "Hey! I am doing great, thanks for asking 😊",
      timestamp: new Date(Date.now() - 3500000),
      status: "read",
    },
    {
      id: "msg-3",
      senderId: "user-1",
      content: "Just finished working on the design mockups",
      timestamp: new Date(Date.now() - 3400000),
      status: "read",
    },
    {
      id: "msg-4",
      senderId: "user-0",
      content: "That is awesome! Can not wait to see them",
      timestamp: new Date(Date.now() - 3000000),
      status: "read",
    },
    {
      id: "msg-5",
      senderId: "user-1",
      content: "Hey! Did you finish the project proposal?",
      timestamp: new Date(Date.now() - 120000),
      status: "delivered",
    },
  ],
};

const MessagePage = () => {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState(initialMessages);
  const [chats, setChats] = useState(initialChats);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageInput, setMessageInput] = useState("");

  const selectedChat = chats.find((chat) => chat.id === selectedChatId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!selectedChatId || !messageInput.trim()) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      content: messageInput,
      timestamp: new Date(),
      status: "sent",
    };

    setMessages((prev) => ({
      ...prev,
      [selectedChatId]: [...(prev[selectedChatId] || []), newMessage],
    }));

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === selectedChatId
          ? {
              ...chat,
              lastMessage: messageInput,
              timestamp: "Just now",
              isTyping: false,
            }
          : chat
      )
    );

    setMessageInput("");

    setTimeout(() => {
      setMessages((prev) => ({
        ...prev,
        [selectedChatId]: prev[selectedChatId].map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: "delivered" } : msg
        ),
      }));
    }, 1000);

    setTimeout(() => {
      setMessages((prev) => ({
        ...prev,
        [selectedChatId]: prev[selectedChatId].map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: "read" } : msg
        ),
      }));
    }, 2000);
  };

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    setIsMobileChatOpen(true);
    setIsSidebarOpen(false);

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, unreadCount: 0, isTyping: false } : chat
      )
    );
  };

  const handleBackToList = () => {
    setIsMobileChatOpen(false);
    setSelectedChatId(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const MessageStatusIcon = ({ status }: { status: Message["status"] }) => {
    if (status === "sent") {
      return <Check className="w-3.5 h-3.5 text-gray-400" />;
    }
    if (status === "delivered") {
      return <CheckCheck className="w-3.5 h-3.5 text-gray-400" />;
    }
    return <CheckCheck className="w-3.5 h-3.5 text-orange-400" />;
  };

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

      <div
        className={`${
          isDarkMode ? "dark" : ""
        } h-screen w-full overflow-hidden`}
      >
        <div className="flex flex-col h-full bg-black">
          <div className="lg:hidden bg-neutral-900 border-b border-neutral-800 p-4 flex items-center justify-between">
            {isMobileChatOpen ? (
              <button
                onClick={handleBackToList}
                className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
            ) : (
              <></>
            )}

            <div className="w-10"></div>
          </div>

          <div className="flex flex-1 overflow-hidden relative">
            <div
              className={`${
                isMobileChatOpen ? "hidden" : "flex"
              } lg:flex flex-shrink-0 w-96 bg-black border-r border-neutral-800 flex-col`}
            >
              <div className="p-4 border-b border-neutral-800">
                <h2 className="text-white text-xl font-bold">Messages</h2>
              </div>
              <div className="p-2 flex gap-2">
                <button className="flex-1 bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20">
                  <MessageSquarePlus className="w-4 h-4" />
                  New Chat
                </button>
                <button className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white p-2 rounded-xl font-medium transition-all flex items-center justify-center gap-2">
                  <Users className="w-4 h-4" />
                  Group
                </button>
              </div>
              <div className="relative flex justify-center items-center">
                <input
                  type="text"
                  placeholder="Search Users..."
                  className="w-[90%] bg-neutral-800 text-white pl-2 py-2 my-1 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                <AnimatePresence>
                  {chats.map((chat, index) => (
                    <motion.div
                      key={chat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleSelectChat(chat.id)}
                      className={`flex items-start gap-3 p-4 cursor-pointer transition-all border-l-4 ${
                        selectedChatId === chat.id
                          ? "bg-neutral-900 border-orange-500"
                          : "border-transparent hover:bg-neutral-900/50"
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={chat.user.avatar}
                          alt={chat.user.name}
                          className="w-14 h-14 rounded-full object-cover"
                        />
                        {chat.user.status === "online" && (
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-black"></div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-white font-semibold text-sm truncate">
                            {chat.user.name}
                          </h3>
                          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                            {chat.timestamp}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            {chat.isTyping ? (
                              <div className="flex items-center gap-1">
                                <motion.div
                                  className="flex gap-1"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                >
                                  {[0, 1, 2].map((i) => (
                                    <motion.div
                                      key={i}
                                      className="w-1.5 h-1.5 bg-orange-400 rounded-full"
                                      animate={{ y: [0, -4, 0] }}
                                      transition={{
                                        duration: 0.6,
                                        repeat: Infinity,
                                        delay: i * 0.1,
                                      }}
                                    />
                                  ))}
                                </motion.div>
                                <span className="text-xs text-orange-400 ml-2">
                                  typing...
                                </span>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400 truncate">
                                {chat.lastMessage}
                              </p>
                            )}
                          </div>

                          {chat.unreadCount > 0 && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="flex-shrink-0 ml-2 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                            >
                              {chat.unreadCount}
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <div
              className={`${
                isMobileChatOpen ? "flex" : "hidden"
              } lg:flex flex-1 min-w-0 flex-col bg-black`}
            >
              {selectedChat ? (
                <>
                  <div className="bg-neutral-900 border-b border-neutral-800 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={selectedChat.user.avatar}
                          alt={selectedChat.user.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        {selectedChat.user.status === "online" && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-neutral-900"></div>
                        )}
                      </div>
                      <div>
                        <h2 className="text-white font-semibold">
                          {selectedChat.user.name}
                        </h2>
                        <p className="text-xs text-gray-400">
                          {selectedChat.isTyping ? (
                            <span className="text-orange-400">typing...</span>
                          ) : selectedChat.user.status === "online" ? (
                            "Active now"
                          ) : (
                            `Last seen ${
                              selectedChat.user.lastSeen || "2h ago"
                            }`
                          )}
                        </p>
                      </div>
                    </div>
                      </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <AnimatePresence>
                      {(messages[selectedChatId] || []).map(
                        (message, index) => {
                          const isCurrentUser =
                            message.senderId === currentUser.id;
                          const showAvatar =
                            index === 0 ||
                            messages[selectedChatId][index - 1].senderId !==
                              message.senderId;

                          return (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={`flex items-end gap-2 ${
                                isCurrentUser ? "flex-row-reverse" : "flex-row"
                              }`}
                            >
                              {!isCurrentUser && (
                                <div className="w-8 h-8 flex-shrink-0">
                                  {showAvatar && (
                                    <img
                                      src={selectedChat.user.avatar}
                                      alt={selectedChat.user.name}
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  )}
                                </div>
                              )}

                              <div
                                className={`max-w-md ${
                                  isCurrentUser ? "items-end" : "items-start"
                                } flex flex-col`}
                              >
                                <motion.div
                                  whileHover={{ scale: 1.02 }}
                                  className={`px-4 py-2.5 rounded-2xl ${
                                    isCurrentUser
                                      ? "bg-orange-600 text-white rounded-br-md"
                                      : "bg-neutral-800 text-white rounded-bl-md"
                                  }`}
                                >
                                  <p className="text-sm leading-relaxed">
                                    {message.content}
                                  </p>
                                </motion.div>

                                <div
                                  className={`flex items-center gap-1.5 mt-1 text-xs text-gray-500 ${
                                    isCurrentUser
                                      ? "flex-row-reverse"
                                      : "flex-row"
                                  }`}
                                >
                                  <span>{formatTime(message.timestamp)}</span>
                                  {isCurrentUser && (
                                    <MessageStatusIcon
                                      status={message.status}
                                    />
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        }
                      )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="bg-neutral-900 border-t border-neutral-800 p-4">
                    <div className="flex items-end gap-3">
                      <button className="p-2.5 hover:bg-neutral-800 rounded-xl transition-colors flex-shrink-0">
                        <Paperclip className="w-5 h-5 text-gray-400" />
                      </button>

                      <div className="flex-1 bg-neutral-800 rounded-2xl px-4 py-2.5 flex items-center gap-2">
                        <textarea
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Type a message..."
                          rows={1}
                          className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none resize-none max-h-32"
                        />
                        <button className="hover:scale-110 transition-transform flex-shrink-0">
                          <Smile className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSendMessage}
                        className="p-2.5 bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors flex-shrink-0 shadow-lg shadow-orange-500/20"
                      >
                        <Send className="w-5 h-5 text-white" />
                      </motion.button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
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
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:hidden">
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="fixed bottom-6 right-6 w-14 h-14 bg-orange-600 hover:bg-orange-700 rounded-full shadow-2xl shadow-orange-500/30 flex items-center justify-center z-50 transition-colors"
            >
              <MessageSquarePlus className="w-6 h-6 text-white" />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagePage;
