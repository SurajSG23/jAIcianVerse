import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCcw, X } from "lucide-react";
import { AnimatedTestimonials } from "../../components/ui/animated-testimonials";
import axios from "axios";
import { toast } from "react-toastify";
import semestersData from "../../data/semesters.ts";

const Dashboard = () => {
  const [announcements, setAnnouncements] = useState([
    {
      quote:
        "Reminder to all students: the midterm exams will begin next Monday. Please make sure you’ve reviewed the syllabus and submitted all pending assignments by Friday.",
      name: "Mrs. Anita Verma",
      designation: "Head of Academics",
      src: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3",
    },
  ]);

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

  const [votes, setVotes] = useState({});
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [selectedDiscussionIndex, setSelectedDiscussionIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Recent");
  const [answerText, setAnswerText] = useState("");
  const [announcementText, setAnnouncementText] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [selectedDiscussionId, setSelectedDiscussionId] = useState(null);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

  const [questionForm, setQuestionForm] = useState({
    question: "",
    subject: "",
    unit: "",
    tags: "",
    image: null,
  });

  const filters = ["All", "Unanswered", "Answered"];
  const sortOptions = ["Recent", "Most Answered"];

  const uploadDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionForm.question || !questionForm.subject || !questionForm.unit) {
      toast.error("Please fill all the fields");
      return;
    }
    if (Number(questionForm?.unit) < 1 || Number(questionForm?.unit) > 5) {
      toast.error("Unit must be between 1 and 5.");
      return;
    }
    if (!availableSubjects.includes(questionForm?.subject)) {
      toast.error("Please select from the suggested subjects.");
      return;
    }
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
      toast.success("Question uploaded successfully!");
      console.log("Discussion uploaded:", response.data);
      fetchDiscussions();
    } catch (error) {
      console.error(
        "Error uploading discussion:",
        error.response?.data || error.message
      );
    } finally {
      setShowQuestionModal(false);
      setQuestionForm({
        question: "",
        subject: "",
        unit: "",
        tags: "",
        image: null,
      });
    }
  };

  const fetchDiscussions = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/discussions/fetch-discussion`
      );

      setDiscussions(response.data.discussions);
    } catch (error) {
      console.error(
        "Error fetching discussions:",
        error.response?.data || error.message
      );
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/api/discussions/fetch-announcements`
      );

      setAnnouncements(response.data.announcements);
    } catch (error) {
      console.error(
        "Error fetching discussions:",
        error.response?.data || error.message
      );
    }
  };
  const fetchSubjects = async () => {
    const userDetails = JSON.parse(localStorage.getItem("userInfo") || "{}");
    const userSem = userDetails?.semester;
    const userBranch = userDetails?.branch;
    setAvailableSubjects(
      Object.keys(semestersData[userBranch]["Semester " + userSem])
    );
  };
  useEffect(() => {
    fetchDiscussions();
    fetchAnnouncements();
    fetchSubjects();
  }, []);

  const toggleAnswers = (discussionId) => {
    setExpandedId((prev) => (prev === discussionId ? null : discussionId));

    setDiscussions((prevDiscussions) =>
      prevDiscussions.map((disc) =>
        disc._id === discussionId ? { ...disc, views: disc.views + 1 } : disc
      )
    );
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

  const postAnnouncement = async () => {
    if (!announcementText.trim()) {
      toast.error("Announcement cannot be empty.");
      return;
    }

    try {
      const userDetails = JSON.parse(localStorage.getItem("userInfo") || "{}");

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/discussions/announcements`,
        {
          quote: announcementText,
          src: userDetails.profileImage || "",
        },
        {
          headers: {
            Authorization: `Bearer ${userDetails.token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      const savedAnnouncement = response.data.announcement;

      // Optional: update local state list
      setAnnouncements((prev) => [savedAnnouncement, ...prev]);
      setShowAnnouncementModal(false);
      setAnnouncementText("");
      fetchAnnouncements();
      toast.success("Announcement posted successfully!");
    } catch (error) {
      console.error(
        "Error posting answer:",
        error.response?.data || error.message
      );
    }
  };

  const filteredAndSortedDiscussions = discussions
    .filter((disc) => {
      const search = searchQuery.toLowerCase();

      const matchesSearch =
        disc.question.toLowerCase().includes(search) ||
        (disc.tags || []).some((tag) => tag.toLowerCase().includes(search));

      const matchesFilter =
        selectedFilter === "All"
          ? true
          : selectedFilter === "Unanswered"
          ? disc.answers.length === 0
          : selectedFilter === "Answered"
          ? disc.answers.length > 0
          : true;

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === "Most Viewed") return b.views - a.views;
      if (sortBy === "Most Answered")
        return b.answers.length - a.answers.length;
      return 0;
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
      {JSON.parse(localStorage.getItem("userInfo") || "{}").role ===
      "student" ? (
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Discussion Forum</h1>
          <button
            onClick={() => setShowQuestionModal(true)}
            className="px-6 py-2.5 text-sm font-medium text-white bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 transition-colors"
          >
            Ask Question
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">Discussion Forum</h1>
          <button
            onClick={() => setShowAnnouncementModal(true)}
            className="px-6 py-2.5 text-sm font-medium text-white bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-700 transition-colors"
          >
            Make Announcement
          </button>
        </div>
      )}
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
            <div
              className="ml-auto flex items-center gap-2 cursor-pointer"
              onClick={() => {
                fetchDiscussions();
                fetchAnnouncements();
              }}
              title="Refresh"
            >
              <RefreshCcw className="text-gray-600 hover:text-gray-700" />
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
          {filteredAndSortedDiscussions.map((disc) => (
            <div
              key={disc._id}
              className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 hover:border-neutral-700 transition-colors"
            >
              <div className="flex items-start gap-4 mb-4">
                <img
                  src={disc.postedBy?.profileImage || "/default-avatar.png"}
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
                        {new Date(disc.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}{" "}
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

        <div className="w-[30%] flex flex-col items-center sticky top-6 self-start">
          <h1 className="text-2xl text-white mb-4">Announcements</h1>
          <AnimatedTestimonials testimonials={announcements} />
        </div>
      </div>

      {showQuestionModal && (
        <AnimatePresence>
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
              <form
                onSubmit={uploadDiscussion}
                className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative"
              >
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
                      required
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
                        list="branches"
                        value={questionForm.subject}
                        onChange={(e) =>
                          setQuestionForm((prev) => ({
                            ...prev,
                            subject: e.target.value,
                          }))
                        }
                        placeholder="e.g., Data Structures"
                        className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
                        required
                      />
                      <datalist id="branches">
                        {availableSubjects.map((subject, index) => (
                          <option key={index} value={subject} />
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-400 mb-2">
                        Unit
                      </label>
                      <input
                        type="number"
                        list="units"
                        min={1}
                        max={5}
                        value={questionForm.unit}
                        onChange={(e) =>
                          setQuestionForm((prev) => ({
                            ...prev,
                            unit: e.target.value,
                          }))
                        }
                        placeholder="e.g., Unit 3"
                        className="w-full px-4 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700"
                        required
                      />
                      <datalist id="units">
                        {[1, 2, 3, 4, 5].map((unit) => (
                          <option key={unit} value={unit} />
                        ))}
                      </datalist>
                      <></>
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
                      required
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
                    type="submit"
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
              </form>
            </motion.div>
          </>
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
      {showAnnouncementModal && (
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
                Announcement Form
              </h2>

              {/* Textarea */}
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-2">
                  Your Announcement
                </label>
                <textarea
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="Type here..."
                  className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-lg text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-700 resize-none"
                  rows={6}
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={postAnnouncement}
                  className="flex-1 px-6 py-2.5 text-sm font-medium text-white bg-neutral-800 border border-neutral-700 rounded-lg hover:bg-neutral-900 transition-colors cursor-pointer"
                >
                  Post Announcement
                </button>
                <button
                  onClick={() => {
                    setShowAnnouncementModal(false);
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
