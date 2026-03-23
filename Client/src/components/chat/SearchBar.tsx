import { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { searchUsers, searchMessages, accessChat } from "../../services/chatApi";
import { useChatStore } from "../../store/chatStore";
import type { IUser, IMessage } from "../../types/chat.types";

interface SearchBarProps {
  mode: "users" | "messages";
  chatId?: string;
  onUserChatOpened?: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

const SearchBar = ({ mode, chatId, onUserChatOpened, inputRef }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IUser[] | IMessage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { setActiveChat, loadMessages, loadChats, setMessageSearchResults } =
    useChatStore();

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      if (mode === "messages") setMessageSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        if (mode === "users") {
          const users = await searchUsers(query);
          setResults(users);
        } else if (mode === "messages" && chatId) {
          const msgs = await searchMessages(chatId, query);
          setResults(msgs);
          setMessageSearchResults(msgs);
        }
      } catch {
        setResults([]);
      }
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(timeout);
  }, [query, mode, chatId, setMessageSearchResults]);

  const handleUserClick = useCallback(
    async (user: IUser) => {
      try {
        const chat = await accessChat(user._id);
        await loadChats();
        setActiveChat(chat);
        await loadMessages(chat._id);
        setQuery("");
        setResults([]);
        onUserChatOpened?.();
      } catch (err) {
        console.error("Failed to open chat:", err);
      }
    },
    [setActiveChat, loadMessages, loadChats, onUserChatOpened]
  );

  const highlightMatch = (text: string) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="bg-orange-500/30 text-orange-300 rounded px-0.5">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-gray-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={mode === "users" ? "Search users..." : "Search messages..."}
          className="w-full bg-neutral-800 text-white pl-9 pr-8 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              if (mode === "messages") setMessageSearchResults([]);
            }}
            className="absolute right-2"
          >
            <X className="w-4 h-4 text-gray-500 hover:text-white" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute z-50 top-full mt-1 w-full bg-neutral-900 border border-neutral-700 rounded-xl max-h-60 overflow-y-auto shadow-xl"
          >
            {mode === "users"
              ? (results as IUser[]).map((user) => (
                  <div
                    key={user._id}
                    onClick={() => handleUserClick(user)}
                    className="flex items-center gap-3 p-3 hover:bg-neutral-800 cursor-pointer transition-colors"
                  >
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">
                        {highlightMatch(user.name)}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {highlightMatch(user.email)}
                      </p>
                    </div>
                  </div>
                ))
              : (results as IMessage[]).map((msg) => (
                  <div
                    key={msg._id}
                    className="p-3 hover:bg-neutral-800 cursor-pointer transition-colors border-b border-neutral-800 last:border-0"
                  >
                    <p className="text-xs text-gray-400 mb-1">
                      {msg.sender.name} •{" "}
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-white">
                      {highlightMatch(msg.content)}
                    </p>
                  </div>
                ))}
          </motion.div>
        )}
      </AnimatePresence>

      {isSearching && (
        <div className="absolute z-50 top-full mt-1 w-full bg-neutral-900 border border-neutral-700 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-400">Searching...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
