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

const extractUnitNumber = (unitLabel: string) => {
  const match = unitLabel.match(/\d+/);
  return match ? match[0] : "1";
};

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
  const unitNumber = extractUnitNumber(selectedUnit);

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
  const [lastQuestion, setLastQuestion] = useState("");
  const [activeFollowUpFor, setActiveFollowUpFor] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessageToRAG = async (
    userMessage: string,
    modelOverride?: "jaicianverse" | "gemini",
  ): Promise<string> => {
    const response = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/api/user/call-ai-model`,
      {
        params: {
          query: userMessage,
          model: modelOverride || selectedModel,
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
    setLastQuestion(userInput);
    setActiveFollowUpFor(null);
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
      setActiveFollowUpFor(botMessage.id);
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

  const getAlternativeModel = () =>
    selectedModel === "gemini" ? "jaicianverse" : "gemini";

  const handleHelpfulFeedback = () => {
    const acknowledgement: Message = {
      id: Date.now() + 2,
      sender: "bot",
      text: "Great! Ask your next doubt anytime.",
    };
    setMessages((prev) => [...prev, acknowledgement]);
    setActiveFollowUpFor(null);
  };

  const handleTryOtherModel = async () => {
    if (!lastQuestion || isTyping) return;

    const alternativeModel = getAlternativeModel();
    setSelectedModel(alternativeModel);
    setIsTyping(true);
    setActiveFollowUpFor(null);

    try {
      const botResponse = await sendMessageToRAG(lastQuestion, alternativeModel);
      const cleanedResponse = cleanLLMResponse(botResponse);
      const botMessage: Message = {
        id: Date.now() + 3,
        sender: "bot",
        text:
          (cleanedResponse || "Sorry, I couldn't generate a response.") +
          ` (Answered using ${
            alternativeModel === "gemini" ? "Gemini" : "jAIcian"
          })`,
      };
      setMessages((prev) => [...prev, botMessage]);
      setActiveFollowUpFor(botMessage.id);
    } catch (error) {
      console.error("Error retrying with other model:", error);
      const errorMessage: Message = {
        id: Date.now() + 4,
        sender: "bot",
        text: "Couldn't retry with the other model right now. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
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
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] md:w-[90vw] lg:w-[85vw] h-[92vh] md:h-[95vh] bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl flex flex-col z-80"
        >
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 md:px-6 py-3 md:py-4 border-b border-neutral-700">
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
                className="text-xs font-medium rounded-lg px-2 md:px-3 py-1.5 border outline-none cursor-pointer transition-colors bg-neutral-800 text-orange-400 border-orange-500/40"
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
          <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4 space-y-4">
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
                  className={`max-w-[85%] md:max-w-[70%] p-3 rounded-2xl text-sm ${
                    msg.sender === "user"
                      ? "bg-orange-600 text-white rounded-br-none"
                      : "bg-neutral-800 text-gray-200 rounded-bl-none"
                  }`}
                >
                  {msg.text}

                  {msg.sender === "bot" && activeFollowUpFor === msg.id && (
                    <div className="mt-2">
                      <p className="text-[11px] text-neutral-400">
                        Was this helpful?
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleHelpfulFeedback}
                          className="rounded-full border border-neutral-600 px-2.5 py-1 text-[11px] text-neutral-200 hover:border-neutral-400 hover:text-white"
                        >
                          Helpful
                        </button>
                        <button
                          type="button"
                          onClick={handleTryOtherModel}
                          className="rounded-full border border-neutral-600 px-2.5 py-1 text-[11px] text-neutral-200 hover:border-neutral-400 hover:text-white"
                        >
                          Try with {getAlternativeModel() === "gemini" ? "Gemini" : "jAIcian"}
                        </button>
                      </div>
                    </div>
                  )}
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
          <div className="border-t border-neutral-700 p-3 md:p-4 flex items-center gap-2 md:gap-3">
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
              className="group/btn relative flex h-10 w-auto items-center justify-center gap-3 rounded-md bg-linear-to-br from-black to-neutral-600 p-3 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:from-zinc-900 dark:to-zinc-900 dark:bg-zinc-800 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
