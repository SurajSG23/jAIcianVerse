import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, UserPlus, Check } from "lucide-react";
import { searchUsers } from "../../services/chatApi";
import { useSocket } from "../../context/SocketContext";
import type { IUser } from "../../types/chat.types";

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: IUser;
}

const GroupModal = ({ isOpen, onClose, currentUser }: GroupModalProps) => {
  const { socket } = useSocket();
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<IUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<IUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const users = await searchUsers(query);
      setSearchResults(
        users.filter(
          (u) =>
            u._id !== currentUser._id &&
            !selectedUsers.find((s) => s._id === u._id)
        )
      );
    } catch {
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  const toggleUser = (user: IUser) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u._id === user._id);
      if (exists) return prev.filter((u) => u._id !== user._id);
      return [...prev, user];
    });
  };

  const handleCreate = () => {
    if (!groupName.trim() || selectedUsers.length < 2) return;

    setIsCreating(true);
    socket?.emit("create_group", {
      name: groupName.trim(),
      userIds: selectedUsers.map((u) => u._id),
    });

    // Reset and close after a short delay
    setTimeout(() => {
      setGroupName("");
      setSelectedUsers([]);
      setSearchQuery("");
      setSearchResults([]);
      setIsCreating(false);
      onClose();
    }, 500);
  };

  const handleClose = () => {
    setGroupName("");
    setSelectedUsers([]);
    setSearchQuery("");
    setSearchResults([]);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-800">
              <h2 className="text-white font-semibold text-lg">Create Group</h2>
              <button
                onClick={handleClose}
                className="p-1.5 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Group Name */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  className="w-full bg-neutral-800 text-white px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                />
              </div>

              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center gap-1.5 bg-orange-600/20 border border-orange-500/30 px-2 py-1 rounded-full"
                    >
                      <img
                        src={user.profileImage}
                        alt={user.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span className="text-xs text-orange-300">
                        {user.name}
                      </span>
                      <button
                        onClick={() => toggleUser(user)}
                        className="ml-0.5"
                      >
                        <X className="w-3 h-3 text-orange-400 hover:text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Search Users */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">
                  Add Members (min. 2)
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search users..."
                    className="w-full bg-neutral-800 text-white pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  />
                </div>
              </div>

              {/* Search Results */}
              <div className="max-h-40 overflow-y-auto space-y-1">
                {isSearching && (
                  <div className="flex items-center justify-center py-3">
                    <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {searchResults.map((user) => {
                  const isSelected = selectedUsers.find(
                    (u) => u._id === user._id
                  );
                  return (
                    <div
                      key={user._id}
                      onClick={() => toggleUser(user)}
                      className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-orange-600/20 border border-orange-500/30"
                          : "hover:bg-neutral-800"
                      }`}
                    >
                      <img
                        src={user.profileImage}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-orange-500 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-800">
              <button
                onClick={handleCreate}
                disabled={
                  !groupName.trim() || selectedUsers.length < 2 || isCreating
                }
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Create Group ({selectedUsers.length} members)
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GroupModal;
