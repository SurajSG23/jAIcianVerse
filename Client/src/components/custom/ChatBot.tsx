import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send } from "lucide-react";
import axios from "axios";
import BottomGradient from "../ui/buttonGradient";

interface Props {
  setIsSChatBotVisible: (visible: boolean) => void;
  selectedSubject: string;
  selectedUnit: string;
}

interface Message {
  id: number;
  sender: "user" | "bot";
  text: string;
}

function cleanLLMResponse(text: string) {
  if (!text) return "";
  text = text.replace(/```[\s\S]*?```/g, "");
  text = text.replace(/[#+]+/g, "");
  text = text.replace(/\s+/g, " ").trim();
  const sentences = text.match(/[^.!?]+[.!?]/g);
  if (sentences) {
    text = sentences.slice(0, 3).join(" ");
  }
  return text;
}

const ChatBot: React.FC<Props> = ({
  setIsSChatBotVisible,
  selectedSubject,
  selectedUnit,
}) => {
  const unitNumber = selectedUnit.split(" ")[1] || "1";

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "bot",
      text: `Hi! I'm your AI Study Assistant for ${selectedSubject} - ${selectedUnit}. Ask me anything about the uploaded notes!`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState<"jaicianverse" | "gemini">(
    "gemini",
  );
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessageToRAG = async (userMessage: string): Promise<string> => {
    const response = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/api/user/call-ai-model`,
      {
        params: {
          query: userMessage,
          model: selectedModel,
          subjectName: selectedSubject,
          unitNumber: unitNumber,
        },
        withCredentials: true,
      },
    );
    return response.data.data;
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: "user",
      text: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    const userInput = input;
    setInput("");
    setIsTyping(true);

    try {
      const botResponse = await sendMessageToRAG(userInput);
      const cleanedResponse = cleanLLMResponse(botResponse);
      const botMessage: Message = {
        id: Date.now() + 1,
        sender: "bot",
        text: cleanedResponse || "Sorry, I couldn't generate a response.",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: "bot",
        text: "Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
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
          className="fixed inset-0 backdrop-blur-sm z-70"
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] h-[95vh] bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl flex flex-col z-80"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700">
            <div>
              <h2 className="text-xl font-semibold text-white">
                AI Study Assistant
              </h2>
              <p className="text-sm text-neutral-400 mt-0.5">
                {selectedSubject} &middot; {selectedUnit}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Model Selector */}
              <select
                value={selectedModel}
                onChange={(e) =>
                  setSelectedModel(
                    e.target.value as "jaicianverse" | "gemini",
                  )
                }
                className="text-xs font-medium rounded-lg px-3 py-1.5 border outline-none cursor-pointer transition-colors bg-neutral-800 text-orange-400 border-orange-500/40"
              >
                <option value="gemini">Gemini</option>
                <option value="jaicianverse">jAIcian (Local)</option>
              </select>

              {/* Close button */}
              <button
                onClick={() => setIsSChatBotVisible(false)}
                className="text-neutral-400 hover:text-white transition-colors p-1.5 rounded-md hover:bg-neutral-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

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

            {isTyping && (
              <div className="flex justify-start">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-neutral-800 text-gray-200 rounded-2xl rounded-bl-none p-3"
                >
                  <div className="flex gap-1">
                    <div
                      className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-neutral-500 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </motion.div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-neutral-700 p-4 flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about your notes..."
              disabled={isTyping}
              className="flex-1 bg-neutral-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-900 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="group/btn relative block h-10 w-auto p-3 flex justify-center items-center gap-3 rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
