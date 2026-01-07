import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { AnimatedTestimonials } from "../../components/ui/animated-testimonials";
import axios from "axios";

const Dashboard = () => {
  const announcements = [
    {
      quote:
        "Reminder to all students: the midterm exams will begin next Monday. Please make sure you’ve reviewed the syllabus and submitted all pending assignments by Friday.",
      name: "Mrs. Anita Verma",
      designation: "Head of Academics",
      src: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3",
    },
    {
      quote:
        "We’re excited to announce that the annual science fair will take place on November 15th. Participants are encouraged to register their projects by the end of this month.",
      name: "Mr. Rajesh Nair",
      designation: "Science Department Coordinator",
      src: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3",
    },
    {
      quote:
        "The library will be open for extended hours during exam week. Take advantage of the quiet study environment and additional reference materials available.",
      name: "Ms. Priya Desai",
      designation: "Librarian",
      src: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3",
    },
    {
      quote:
        "All students participating in the cultural fest must attend the practice session on Saturday. Attendance will be recorded, so please be on time.",
      name: "Mr. Arvind Singh",
      designation: "Cultural Coordinator",
      src: "https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3",
    },
    {
      quote:
        "Congratulations to the debate team for winning the inter-school championship! Your hard work and preparation truly paid off, and we’re proud of your achievement.",
      name: "Mrs. Neha Kapoor",
      designation: "English Department Head",
      src: "https://images.unsplash.com/photo-1603052875659-8f88c5ea2309?q=80&w=2592&auto=format&fit=crop&ixlib=rb-4.0.3",
    },
  ];

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
  ]);

  const [expandedIndex, setExpandedIndex] = useState(null);
  const [votes, setVotes] = useState({});
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [selectedDiscussionIndex, setSelectedDiscussionIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Recent");
  const [answerText, setAnswerText] = useState("");

  const [questionForm, setQuestionForm] = useState({
    question: "",
    subject: "",
    unit: "",
    tags: "",
    image: null,
  });

  const filters = ["All", "Unanswered", "Answered", "Bookmarked"];
  const sortOptions = ["Recent", "Most Viewed", "Most Answered"];

  const uploadDiscussion = async () => {
    const userDetails = JSON.parse(localStorage.getItem("userInfo") || "{}");

    const payload = {
      question: questionForm.question,
      subject: questionForm.subject,
      unit: questionForm.unit,
      tags: questionForm.tags
        ? questionForm.tags.split(",").map((t) => t.trim())
        : [],
      imageURL: questionForm.image || "", 
    };

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/discussions/upload-discussion`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${userDetails.token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      console.log("Discussion uploaded:", response.data);
    } catch (error) {
      console.error(
        "Error uploading discussion:",
        error.response?.data || error.message
      );
    }
  };

  const toggleAnswers = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
    // Increment view count
    const updatedDiscussions = [...discussions];
    updatedDiscussions[index].views += 1;
    setDiscussions(updatedDiscussions);
  };

  const handleUpvote = (discIndex, ansIndex) => {
    const key = `${discIndex}-${ansIndex}`;
    setVotes((prev) => ({
      ...prev,
      [key]: (prev[key] || 0) + 1,
    }));
  };

  const toggleBookmark = (index) => {
    const updatedDiscussions = [...discussions];
    updatedDiscussions[index].bookmarked =
      !updatedDiscussions[index].bookmarked;
    setDiscussions(updatedDiscussions);
  };

  // const handleImageUpload = (e) => {
  //   const file = e.target.files[0];
  //   if (file) {
  //     const reader = new FileReader();
  //     reader.onloadend = () => {
  //       setQuestionForm((prev) => ({ ...prev, image: reader.result }));
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // };

  const postQuestion = () => {
    if (!questionForm.question.trim()) return;

    const newQuestion = {
      id: discussions.length + 1,
      question: questionForm.question,
      questionType: questionForm.image ? "image" : "text",
      mediaUrl: questionForm.image || null,
      postedBy: "Current User",
      profilePic: "https://api.dicebear.com/7.x/avataaars/svg?seed=User",
      subject: questionForm.subject || "General",
      unit: questionForm.unit || "N/A",
      tags: questionForm.tags
        ? questionForm.tags.split(",").map((t) => t.trim())
        : [],
      postedAt: "Just now",
      views: 0,
      bookmarked: false,
      answers: [],
    };

    setDiscussions([newQuestion, ...discussions]);
    setQuestionForm({
      question: "",
      subject: "",
      unit: "",
      tags: "",
      image: null,
    });
    setShowQuestionModal(false);
  };

  const openAnswerModal = (index) => {
    setSelectedDiscussionIndex(index);
    setShowAnswerModal(true);
    setAnswerText("");
  };

  const postAnswer = () => {
    if (!answerText.trim() || selectedDiscussionIndex === null) return;

    const newAnswer = {
      text: answerText,
      answeredBy: "Current User",
      upvotes: 0,
      isBestAnswer: false,
      timestamp: "Just now",
    };

    const updatedDiscussions = [...discussions];
    updatedDiscussions[selectedDiscussionIndex].answers.push(newAnswer);
    setDiscussions(updatedDiscussions);

    setShowAnswerModal(false);
    setAnswerText("");
    setSelectedDiscussionIndex(null);
  };

  const filteredAndSortedDiscussions = discussions
    .filter((disc) => {
      const matchesSearch =
        disc.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        disc.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );
      const matchesFilter =
        selectedFilter === "All"
          ? true
          : selectedFilter === "Unanswered"
          ? disc.answers.length === 0
          : selectedFilter === "Answered"
          ? disc.answers.length > 0
          : selectedFilter === "Bookmarked"
          ? disc.bookmarked
          : true;

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === "Most Viewed") return b.views - a.views;
      if (sortBy === "Most Answered")
        return b.answers.length - a.answers.length;
      return 0; // Recent is default order
    });

  return (
    <div className="flex h-screen w-full flex-1 flex-col overflow-y-auto rounded-l-2xl border border-neutral-800 bg-black p-6 md:p-10">
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Discussion Forum</h1>
        <button
          onClick={() => setShowQuestionModal(true)}
          className="px-6 py-2.5 text-sm font-medium text-white bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 transition-colors"
        >
          Ask Question
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search discussions or tags..."
            className="w-full px-4 py-3 pl-10 bg-neutral-900 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
          />
          <svg
            className="absolute left-3 top-3.5 w-5 h-5 text-neutral-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectedFilter === filter
                    ? "text-white bg-neutral-800 border border-neutral-700"
                    : "text-neutral-400 bg-neutral-900 border border-neutral-800 hover:text-white hover:border-neutral-700"
                }`}
              >
                {filter}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-neutral-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 border border-neutral-800 rounded-lg focus:outline-none focus:border-neutral-700"
              >
                {sortOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex">
        {filteredAndSortedDiscussions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-500">
              No discussions found matching your criteria.
            </p>
          </div>
        )}
        <div className="flex flex-col space-y-4 w-[70%]">
          {filteredAndSortedDiscussions.map((disc, i) => (
            <div
              key={disc.id}
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition-colors"
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
                      onClick={() => toggleBookmark(discussions.indexOf(disc))}
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

              <div className="ml-16 ">
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

                {disc.questionType === "image" && disc.mediaUrl && (
                  <img
                    src={disc.mediaUrl}
                    alt="discussion-media"
                    className="w-full rounded-lg mb-4 border border-neutral-800 max-h-96 object-cover"
                  />
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
                    onClick={() => toggleAnswers(discussions.indexOf(disc))}
                    className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white bg-neutral-950 border border-neutral-800 rounded-lg hover:border-neutral-700 transition-colors cursor-pointer"
                  >
                    {expandedIndex === discussions.indexOf(disc)
                      ? "Hide Answers"
                      : `View Answers (${disc.answers.length})`}
                  </button>
                  <button
                    onClick={() => openAnswerModal(discussions.indexOf(disc))}
                    className="px-4 py-2 text-sm font-medium text-white bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 transition-colors cursor-pointer"
                  >
                    Add Answer
                  </button>
                </div>

                {expandedIndex === discussions.indexOf(disc) && (
                  <div className="mt-6 space-y-3">
                    {disc.answers.length === 0 && (
                      <p className="text-neutral-600 text-sm py-4">
                        No answers yet. Be the first to answer.
                      </p>
                    )}

                    {disc.answers.map((ans, j) => {
                      const voteKey = `${discussions.indexOf(disc)}-${j}`;
                      const totalUpvotes = ans.upvotes + (votes[voteKey] || 0);

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
                                  onClick={() =>
                                    handleUpvote(discussions.indexOf(disc), j)
                                  }
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
          ))}
        </div>

        <div className="w-[30%] flex flex-col items-center">
          <h1 className="text-2xl text-white">Announcements</h1>
          <AnimatedTestimonials testimonials={announcements} />
        </div>
      </div>

      {showQuestionModal && (
        <AnimatePresence>
          {showQuestionModal && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setShowQuestionModal(false);
                  setQuestionForm({
                    question: "",
                    subject: "",
                    unit: "",
                    tags: "",
                    image: null,
                  });
                }}
                className="fixed inset-0 bg-black/60 backdrop-blur-xl z-40"
              />

              {/* Modal Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 flex items-center justify-center z-50 p-4"
              >
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">
                      Ask a Question
                    </h2>
                    <button
                      onClick={() => {
                        setShowQuestionModal(false);
                        setQuestionForm({
                          question: "",
                          subject: "",
                          unit: "",
                          tags: "",
                          image: null,
                        });
                      }}
                      className="text-neutral-400 hover:text-white transition-colors p-1 rounded-md hover:bg-neutral-800 cursor-pointer"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Form Content */}
                  <div className="space-y-4">
                    {/* Question */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-2">
                        Question
                      </label>
                      <textarea
                        value={questionForm.question}
                        onChange={(e) =>
                          setQuestionForm((prev) => ({
                            ...prev,
                            question: e.target.value,
                          }))
                        }
                        placeholder="What would you like to know?"
                        className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700 resize-none"
                        rows={4}
                      />
                    </div>

                    {/* Subject + Unit */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-2">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={questionForm.subject}
                          onChange={(e) =>
                            setQuestionForm((prev) => ({
                              ...prev,
                              subject: e.target.value,
                            }))
                          }
                          placeholder="e.g., Data Structures"
                          className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-2">
                          Unit
                        </label>
                        <input
                          type="text"
                          value={questionForm.unit}
                          onChange={(e) =>
                            setQuestionForm((prev) => ({
                              ...prev,
                              unit: e.target.value,
                            }))
                          }
                          placeholder="e.g., Unit 3"
                          className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
                        />
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-2">
                        Tags (comma separated)
                      </label>
                      <input
                        type="text"
                        value={questionForm.tags}
                        onChange={(e) =>
                          setQuestionForm((prev) => ({
                            ...prev,
                            tags: e.target.value,
                          }))
                        }
                        placeholder="e.g., Python, BST, Algorithms"
                        className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
                      />
                    </div>

                    {/* Image Upload */}
                    {/* <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-2">
                        Attach Image (Optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-neutral-800 file:text-white hover:file:bg-neutral-700 file:cursor-pointer"
                      />
                      {questionForm.image && (
                        <img
                          src={questionForm.image}
                          alt="Preview"
                          className="mt-3 w-full rounded-lg border border-neutral-800 max-h-48 object-cover"
                        />
                      )}
                    </div> */}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={uploadDiscussion}
                      className="flex-1 px-6 py-2.5 text-sm font-medium text-white bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 transition-colors"
                    >
                      Post Question
                    </button>
                    <button
                      onClick={() => {
                        setShowQuestionModal(false);
                        setQuestionForm({
                          question: "",
                          subject: "",
                          unit: "",
                          tags: "",
                          image: null,
                        });
                      }}
                      className="px-6 py-2.5 text-sm font-medium text-neutral-400 bg-neutral-950 border border-neutral-800 rounded-lg hover:border-neutral-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}

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
              className="fixed inset-0 backdrop-blur-md bg-black/60 z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-xl"
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
    </div>
  );
};

export default Dashboard;
