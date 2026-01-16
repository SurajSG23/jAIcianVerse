import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

interface Answer {
  text: string;
  answeredBy: string;
  upvotes: number;
  isBestAnswer: boolean;
  timestamp: string;
}

interface Props {
  setIsTrendingPageVisible: (visible: boolean) => void;
  selectedUnit: string | null;
  selectedSubject: string | null;
}

const TrendingPage: React.FC<Props> = ({
  setIsTrendingPageVisible,
  selectedUnit,
  selectedSubject,
}) => {
  const [loading, setLoading] = useState(false);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [selectedDiscussionIndex, setSelectedDiscussionIndex] = useState(null);
  const [answerText, setAnswerText] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [selectedDiscussionId, setSelectedDiscussionId] = useState(null);

  const [discussions, setDiscussions] = useState([
    {
      id: 1,
      question: "How do I implement a binary search tree in Python?",
      questionType: "text",
      postedBy: "Sarah Chen",
      profilePic: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      subject: "Data Structures",
      unit: "Unit 3",
      semester: 6,
      postedAt: "2 hours ago",
      tags: ["Python", "BST", "Algorithms"],
      views: 234,
      bookmarked: false,
      answers: [
        {
          text: "You can start by creating a Node class with left, right, and value attributes. Then create a BST class with insert, search, and traversal methods.",
          answeredBy: "Alex Kumar",
          upvotes: 12,
          isBestAnswer: true,
          timestamp: "1 hour ago",
        },
        {
          text: "Check out the Python documentation on classes. The key is understanding recursion for insertion and search operations.",
          answeredBy: "Maria Rodriguez",
          upvotes: 7,
          isBestAnswer: false,
          timestamp: "45 mins ago",
        },
      ],
    },
  ]);
  const toggleAnswers = (discussionId) => {
    setExpandedId((prev) => (prev === discussionId ? null : discussionId));

    setDiscussions((prevDiscussions) =>
      prevDiscussions.map((disc) =>
        disc._id === discussionId ? { ...disc, views: disc.views + 1 } : disc
      )
    );
  };

  const openAnswerModal = (discussionId) => {
    setSelectedDiscussionId(discussionId);
    setShowAnswerModal(true);
    setAnswerText("");
  };

  const incrementPoints = async (point: number) => {
    try {
      const userDetails = JSON.parse(localStorage.getItem("userInfo") || "{}");
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/user/increment-points`,
        { point: point },
        {
          headers: {
            Authorization: `Bearer ${userDetails.token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
    } catch (error) {
      console.log(error);
    }
  };

  const postAnswer = async () => {
    if (!answerText.trim() || !selectedDiscussionId) {
      toast.error("Answer cannot be empty.");
      return;
    }

    try {
      const userDetails = JSON.parse(localStorage.getItem("userInfo") || "{}");

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/discussions/answers`,
        {
          text: answerText,
          discussionId: selectedDiscussionId,
        },
        {
          headers: {
            Authorization: `Bearer ${userDetails.token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      const savedAnswer = response.data.answer;

      setDiscussions((prev) =>
        prev.map((disc) =>
          disc._id === selectedDiscussionId
            ? { ...disc, answers: [...disc.answers, savedAnswer] }
            : disc
        )
      );

      setShowAnswerModal(false);
      setAnswerText("");
      setSelectedDiscussionId(null);
      toast.success("Answer posted successfully!");
      incrementPoints(1);
    } catch (error) {
      console.error(
        "Error posting answer:",
        error.response?.data || error.message
      );
    }
  };
  const fetchDiscussions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/discussions/fetch-discussions-by-name`,
        {
          params: {
            subjectName: selectedSubject,
            unitName: selectedUnit,
          },
          withCredentials: true,
        }
      );

      setDiscussions(response.data.discussions);
    } catch (error) {
      console.error(
        "Error fetching discussions:",
        error.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchDiscussions();
  }, []);

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 backdrop-blur-sm"
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] h-[95vh] overflow-y-auto bg-neutral-950 border border-neutral-800 rounded-lg shadow-xl p-8 flex flex-col z-80"
        >
          <button
            onClick={() => setIsTrendingPageVisible(false)}
            className="ml-4 absolute right-1 top-1 text-neutral-400 hover:text-white transition-colors p-1 rounded-md hover:bg-neutral-800 cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>

          <h1 className="text-white text-3xl text-center mb-2">
            Discussion Forum
          </h1>
          <h2 className="text-md font-medium text-neutral-500 text-center mb-4">
            View trending questions and answer them
          </h2>

          {loading ? (
            <div className="space-y-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 animate-pulse"
                >
                  <div className="h-5 bg-neutral-800 w-3/4 rounded mb-3" />
                  <div className="h-4 bg-neutral-800 w-1/2 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full flex">
              {discussions.length === 0 && (
                <div className="text-center py-12 w-full mx-auto">
                  <p className="text-neutral-500">
                    No discussions found matching your criteria.
                  </p>
                </div>
              )}
              <div className="flex flex-col space-y-4 w-full">
                {discussions.map((disc, index) => (
                  <div
                    key={index}
                    className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <img
                        src={
                          disc.postedBy?.profileImage || "/default-avatar.png"
                        }
                        alt={disc.postedBy?.name || "User"}
                        className="w-12 h-12 rounded-full bg-neutral-800 object-cover"
                      />

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-white font-medium">
                              {disc.postedBy?.name || "Unknown User"}
                            </h3>
                            <p className="text-sm text-neutral-500">
                              {new Date(disc.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}{" "}
                              • {disc.subject}
                              {disc.unit ? ` / Unit ${disc.unit}` : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ===== BODY ===== */}
                    <div className="ml-16">
                      <h2 className="text-xl text-white font-medium mb-3">
                        {disc.question}
                      </h2>

                      {/* ===== TAGS ===== */}
                      {disc.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {disc.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 text-xs font-medium text-neutral-400 bg-neutral-950 border border-neutral-800 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* ===== IMAGE ===== */}
                      {disc.imageURL && (
                        <img
                          src={disc.imageURL}
                          alt="discussion"
                          className="w-full rounded-lg mb-4 border border-neutral-800 max-h-96 object-cover"
                        />
                      )}

                      {/* ===== ACTIONS ===== */}
                      <div className="flex gap-3 items-center">
                        <button
                          onClick={() => toggleAnswers(disc._id)}
                          className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white bg-neutral-950 border border-neutral-800 rounded-lg hover:border-neutral-700 transition-colors"
                        >
                          {expandedId === disc._id
                            ? "Hide Answers"
                            : `View Answers (${disc.answers.length})`}
                        </button>

                        <button
                          onClick={() => openAnswerModal(disc._id)}
                          className="px-4 py-2 text-sm font-medium text-white bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 transition-colors"
                        >
                          Add Answer
                        </button>
                      </div>

                      {/* ===== ANSWERS ===== */}
                      {expandedId === disc._id && (
                        <div className="mt-6 space-y-3">
                          {disc.answers.length === 0 && (
                            <p className="text-neutral-600 text-sm py-4">
                              No answers yet. Be the first to answer.
                            </p>
                          )}

                          {disc.answers.map((ans) => (
                            <div
                              key={ans._id}
                              className="p-4 rounded-lg bg-black border border-neutral-800"
                            >
                              {/* Answer text */}
                              <p className="text-neutral-200 leading-relaxed mb-3">
                                {ans.text}
                              </p>

                              {/* Answer footer */}
                              <div className="flex items-center gap-3 text-xs text-neutral-500">
                                <img
                                  src={
                                    ans.answeredBy?.profileImage ||
                                    "/default-avatar.png"
                                  }
                                  alt={ans.answeredBy?.name || "User"}
                                  className="w-6 h-6 rounded-full object-cover bg-neutral-800"
                                />

                                <span className="text-neutral-400">
                                  {ans.answeredBy?.name || "Anonymous"}
                                </span>

                                <span className="text-neutral-600">•</span>

                                <span>
                                  {new Date(ans.createdAt).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <style>
            {`
              ::-webkit-scrollbar { width: 10px; }
              ::-webkit-scrollbar-track { background-color: black; }
              ::-webkit-scrollbar-thumb {
                background-color: rgba(63, 63, 63, 0.6);
                border-radius: 4px;
              }
              ::-webkit-scrollbar-thumb:hover {
                background-color: rgba(100, 100, 100, 0.8);
              }
            `}
          </style>
        </motion.div>
      </>
      {showAnswerModal && (
        <AnimatePresence>
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowAnswerModal(false);
                setAnswerText("");
                setSelectedDiscussionIndex(null);
              }}
              className="fixed inset-0 backdrop-blur-md bg-black/60 z-120"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-120 w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl"
            >
              {/* Header */}
              <h2 className="text-2xl font-bold text-white mb-6">
                Add Your Answer
              </h2>

              {/* Textarea */}
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  Your Answer
                </label>
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Share your knowledge..."
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700 resize-none"
                  rows={6}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={postAnswer}
                  className="flex-1 px-6 py-2.5 text-sm font-medium text-white bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-900 transition-colors cursor-pointer"
                >
                  Post Answer
                </button>
                <button
                  onClick={() => {
                    setShowAnswerModal(false);
                    setAnswerText("");
                    setSelectedDiscussionIndex(null);
                  }}
                  className="px-6 py-2.5 text-sm font-medium text-neutral-400 bg-neutral-950 border border-neutral-800 rounded-lg hover:border-neutral-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        </AnimatePresence>
      )}
    </AnimatePresence>
  );
};

export default TrendingPage;
