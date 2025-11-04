import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface Answer {
  text: string;
  answeredBy: string;
  upvotes: number;
  isBestAnswer: boolean;
  timestamp: string;
}

interface Question {
  id: number;
  question: string;
  questionType: string;
  postedBy: string;
  profilePic: string;
  subject: string;
  unit: string;
  semester: number;
  postedAt: string;
  tags: string[];
  views: number;
  bookmarked: boolean;
  answers: Answer[];
}

interface Props {
  setIsTrendingPageVisible: (visible: boolean) => void;
}

const TrendingPage: React.FC<Props> = ({ setIsTrendingPageVisible }) => {
  const [loading, setLoading] = useState(true);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [discussions, setDiscussions] = useState<Question[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [selectedDiscussionIndex, setSelectedDiscussionIndex] = useState(null);
  const [answerText, setAnswerText] = useState("");

  useEffect(() => {
    const sampleQuestions: Question[] = [
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
      {
        id: 2,
        question:
          "What's the difference between supervised and unsupervised learning?",
        questionType: "text",
        postedBy: "James Wilson",
        profilePic: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
        subject: "Machine Learning",
        unit: "Unit 1",
        semester: 6,
        postedAt: "5 hours ago",
        tags: ["ML", "AI", "Classification"],
        views: 567,
        bookmarked: false,
        answers: [
          {
            text: "Supervised learning uses labeled data to train models, while unsupervised learning finds patterns in unlabeled data. Think classification vs clustering.",
            answeredBy: "Dr. Emily Park",
            upvotes: 24,
            isBestAnswer: true,
            timestamp: "4 hours ago",
          },
        ],
      },
      {
        id: 3,
        question: "Can someone explain the concept of closures in JavaScript?",
        questionType: "text",
        postedBy: "Priya Sharma",
        profilePic: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
        subject: "Web Development",
        unit: "Unit 2",
        semester: 6,
        postedAt: "1 day ago",
        tags: ["JavaScript", "Closures", "Functions"],
        views: 892,
        bookmarked: false,
        answers: [],
      },
    ];

    setTimeout(() => {
      setDiscussions(sampleQuestions);
      setLoading(false);
    }, 1200);
  }, []);

  const toggleAnswers = (index: number) =>
    setExpandedIndex(expandedIndex === index ? null : index);

  const toggleBookmark = (index: number) => {
    const updated = [...discussions];
    updated[index].bookmarked = !updated[index].bookmarked;
    setDiscussions(updated);
  };

  const handleUpvote = (discIndex: number, ansIndex: number) => {
    const key = `${discIndex}-${ansIndex}`;
    setVotes((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + 1,
    }));
  };

  const openAnswerModal = (index) => {
    setSelectedDiscussionIndex(index);
    setShowAnswerModal(true);
    setAnswerText("");
  };

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
            discussions.map((disc, index) => (
              <div
                key={disc.id}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mb-6 hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={disc.profilePic}
                    alt={disc.postedBy}
                    className="w-12 h-12 rounded-full bg-neutral-800"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-medium">
                          {disc.postedBy}
                        </h3>
                        <p className="text-sm text-neutral-500">
                          {disc.postedAt} &bull; {disc.semester} Sem &bull;{" "}
                          {disc.subject} / {disc.unit}
                        </p>
                      </div>

                      <button
                        onClick={() => toggleBookmark(index)}
                        className="text-neutral-500 hover:text-white transition-colors"
                      >
                        <svg
                          className={`w-6 h-6 ${
                            disc.bookmarked ? "fill-white" : "fill-none"
                          }`}
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="ml-16">
                  <h2 className="text-xl text-white font-medium mb-3">
                    {disc.question}
                  </h2>

                  {disc.tags.length > 0 && (
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

                  <div className="flex items-center gap-4 text-sm text-neutral-500 mb-4">
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      <span>{disc.views} views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <span>{disc.answers.length} answers</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => toggleAnswers(index)}
                      className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white bg-neutral-950 border border-neutral-800 rounded-lg hover:border-neutral-700 transition-colors cursor-pointer"
                    >
                      {expandedIndex === index
                        ? "Hide Answers"
                        : `View Answers (${disc.answers.length})`}
                    </button>
                    <button
                      onClick={() => openAnswerModal(index)}
                      className="px-4 py-2 text-sm font-medium text-white bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 transition-colors cursor-pointer"
                    >
                      Add Answer
                    </button>
                  </div>

                  {expandedIndex === index && (
                    <div className="mt-6 space-y-3">
                      {disc.answers.length === 0 && (
                        <p className="text-neutral-600 text-sm py-4">
                          No answers yet. Be the first to answer.
                        </p>
                      )}

                      {disc.answers.map((ans, j) => {
                        const voteKey = `${index}-${j}`;
                        const totalUpvotes =
                          ans.upvotes + (votes[voteKey] || 0);

                        return (
                          <div
                            key={j}
                            className={`p-4 rounded-lg bg-black ${
                              ans.isBestAnswer
                                ? "border border-emerald-900"
                                : "border border-neutral-800"
                            }`}
                          >
                            <p className="text-neutral-200 leading-relaxed mb-3">
                              {ans.text}
                            </p>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-3">
                                <span className="text-neutral-500">
                                  by{" "}
                                  <span className="text-neutral-400">
                                    {ans.answeredBy}
                                  </span>
                                </span>
                                <span className="text-neutral-600">·</span>
                                <span className="text-neutral-600">
                                  {ans.timestamp}
                                </span>
                              </div>
                              <div className="flex items-center gap-4">
                                {ans.isBestAnswer && (
                                  <span className="flex items-center gap-1 text-emerald-500 text-xs font-medium">
                                    <svg
                                      className="w-4 h-4"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    Best Answer
                                  </span>
                                )}
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleUpvote(index, j)}
                                    className="px-3 py-1 text-xs font-medium text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 rounded hover:border-neutral-700 transition-colors"
                                  >
                                    Upvote
                                  </button>
                                  <span className="text-neutral-500">
                                    {totalUpvotes}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))
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
              className="fixed inset-0 backdrop-blur-md bg-black/60 z-90"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl z-90"
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
                  // onClick={postAnswer}
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
