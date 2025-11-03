import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send } from "lucide-react";
import BottomGradient from "../ui/buttonGradient";
interface Props {
  setIsSChatBotVisible: (visible: boolean) => void;
}

interface Message {
  id: number;
  sender: "user" | "bot";
  text: string;
}

const ChatBot: React.FC<Props> = ({ setIsSChatBotVisible }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "bot",
      text: "Hi there! I'm your AI Study Assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: "user",
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: Date.now() + 1,
        sender: "bot",
        text: `You said: "${userMessage.text}". That’s interesting!`,
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsSChatBotVisible(false)}
          className="fixed inset-0 backdrop-blur-sm"
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] h-[95vh] bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl flex flex-col z-80"
        >
          {/* Close button */}
          <button
            onClick={() => setIsSChatBotVisible(false)}
            className="absolute right-3 top-3 text-neutral-400 hover:text-white transition-colors p-1 rounded-md hover:bg-neutral-800 cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>

          <h2 className="text-2xl font-semibold text-white mb-4 text-center mt-6">
            AI Study Assistant
          </h2>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`max-w-[70%] p-3 rounded-2xl text-sm ${
                    msg.sender === "user"
                      ? "bg-orange-600 text-white rounded-br-none"
                      : "bg-neutral-800 text-gray-200 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </motion.div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-neutral-700 p-4 flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your question..."
              className="flex-1 bg-neutral-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-900"
            />
            <button
              className="group/btn relative block h-10 w-auto p-3 flex justify-center items-center gap-3 rounded-md bg-gradient-to-br from-black to-neutral-600  font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] my-4 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                <BottomGradient />
              </span>
            </button>
          </div>

          {/* Scrollbar styling */}
          <style>
            {`
              ::-webkit-scrollbar {
                width: 8px;
              }
              ::-webkit-scrollbar-thumb {
                background-color: rgba(80,80,80,0.7);
                border-radius: 4px;
              }
              ::-webkit-scrollbar-thumb:hover {
                background-color: rgba(120,120,120,0.9);
              }
            `}
          </style>
        </motion.div>
      </>
    </AnimatePresence>
  );
};

export default ChatBot;
