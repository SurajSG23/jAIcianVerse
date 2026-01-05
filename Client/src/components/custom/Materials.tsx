import { cn } from "../../../lib/utils";
import Sidebar from "./Navbar";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { unitOptions } from "../../data/unitOptions";
import { motion, AnimatePresence } from "framer-motion";
import AIAvatar from "./AiAvatar";
import VisualVault from "./VisualVault";
import StudyHub from "./StudyHub";
import ChatBot from "./ChatBot";
import TrendingPage from "./TrendingPage";
import QuickQuiz from "./QuickQuiz";
import { useAuth } from "../../context/AuthContext";

interface Unit {
  _id: string;
  title: string;
  description: string;
}

interface Subject {
  _id: string;
  name: string;
  branch: string;
  semester: number;
  units: Unit[];
}

const Materials = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAiTeacherVisible, setIsAiTeacherVisible] = useState(false);
  const [isVisualVaultVisible, setIsVisualVaultVisible] = useState(false);
  const [isStudyHubVisible, setIsStdudyHubVisible] = useState(false);
  const [isChatBotVisible, setIsSChatBotVisible] = useState(false);
  const [isTrendingPageVisible, setIsTrendingPageVisible] = useState(false);
  const [isQuickQuizVisible, setIsQuickQuizVisible] = useState(false);
  const { checkUser } = useAuth();

  useEffect(() => {
    checkUser("materials");
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for demonstration
      const mockData: Subject[] = [
        {
          _id: "671f10a1a1a1a1a1a1a10101",
          name: "Data Structures",
          branch: "Computer Science",
          semester: 3,
          units: [
            {
              _id: "671f10b2b2b2b2b2b2b20101",
              title: "Introduction",
              description: "Overview of data structures",
            },
            {
              _id: "671f10b2b2b2b2b2b2b20102",
              title: "Arrays",
              description: "Static and dynamic arrays",
            },
            {
              _id: "671f10b2b2b2b2b2b2b20103",
              title: "Linked Lists",
              description: "Single and double linked lists",
            },
          ],
        },
        {
          _id: "671f10a1a1a1a1a1a1a10102",
          name: "Database Management Systems",
          branch: "Computer Science",
          semester: 4,
          units: [
            {
              _id: "671f10b2b2b2b2b2b2b20201",
              title: "Relational Model",
              description: "Understanding relational databases",
            },
            {
              _id: "671f10b2b2b2b2b2b2b20202",
              title: "SQL Basics",
              description: "Structured Query Language fundamentals",
            },
            {
              _id: "671f10b2b2b2b2b2b2b20203",
              title: "Normalization",
              description: "Database design and normal forms",
            },
          ],
        },
        {
          _id: "671f10a1a1a1a1a1a1a10103",
          name: "Operating Systems",
          branch: "Computer Science",
          semester: 5,
          units: [
            {
              _id: "671f10b2b2b2b2b2b2b20301",
              title: "Process Management",
              description: "Processes and threads",
            },
            {
              _id: "671f10b2b2b2b2b2b2b20302",
              title: "Memory Management",
              description: "Virtual memory and paging",
            },
            {
              _id: "671f10b2b2b2b2b2b2b20303",
              title: "File Systems",
              description: "File system implementation",
            },
          ],
        },
        {
          _id: "671f10a1a1a1a1a1a1a10104",
          name: "Computer Networks",
          branch: "Computer Science",
          semester: 5,
          units: [
            {
              _id: "671f10b2b2b2b2b2b2b20401",
              title: "OSI Model",
              description: "Seven layers of networking",
            },
            {
              _id: "671f10b2b2b2b2b2b2b20402",
              title: "TCP/IP",
              description: "Internet protocol suite",
            },
            {
              _id: "671f10b2b2b2b2b2b2b20403",
              title: "Network Security",
              description: "Cryptography and secure communication",
            },
          ],
        },
        {
          _id: "671f10a1a1a1a1a1a1a10105",
          name: "Machine Learning",
          branch: "Computer Science",
          semester: 6,
          units: [
            {
              _id: "671f10b2b2b2b2b2b2b20501",
              title: "Supervised Learning",
              description: "Classification and regression",
            },
            {
              _id: "671f10b2b2b2b2b2b2b20502",
              title: "Unsupervised Learning",
              description: "Clustering and dimensionality reduction",
            },
            {
              _id: "671f10b2b2b2b2b2b2b20503",
              title: "Neural Networks",
              description: "Deep learning fundamentals",
            },
          ],
        },
        {
          _id: "671f10a1a1a1a1a1a1a10106",
          name: "Software Engineering",
          branch: "Computer Science",
          semester: 6,
          units: [
            {
              _id: "671f10b2b2b2b2b2b2b20601",
              title: "SDLC Models",
              description: "Waterfall, Agile, and DevOps",
            },
            {
              _id: "671f10b2b2b2b2b2b2b20602",
              title: "Requirements Analysis",
              description: "Gathering and documenting requirements",
            },
            {
              _id: "671f10b2b2b2b2b2b2b20603",
              title: "Testing",
              description: "Unit, integration, and system testing",
            },
          ],
        },
      ];

      // Uncomment below to use real API
      // const response = await fetch('/api/subjects');
      // if (!response.ok) throw new Error('Failed to fetch subjects');
      // const data = await response.json();
      // setSubjects(data);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSubjects(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setTimeout(() => setSelectedSubject(null), 200);
  };

  const handleUnitClick = (unit: Unit) => {
    setSelectedUnit(unit);
    setIsUnitDialogOpen(true);
  };

  const handleCloseUnitDialog = () => {
    setIsUnitDialogOpen(false);
    setTimeout(() => setSelectedUnit(null), 200);
  };

  const handleOptionClick = (label: number) => {
    if (label === 1) {
      setIsStdudyHubVisible(true);
    } else if (label === 2) {
      setIsSChatBotVisible(true);
    } else if (label === 3) {
      setIsAiTeacherVisible(true);
    } else if (label === 4) {
      setIsQuickQuizVisible(true);
    } else if (label === 5) {
      setIsTrendingPageVisible(true);
    } else if (label === 6) {
      setIsVisualVaultVisible(true);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-neutral-900 border border-red-900 rounded-lg max-w-md w-full p-6 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">
            Error Loading Subjects
          </h2>
          <p className="text-neutral-400 mb-4">{error}</p>
          <button
            onClick={fetchSubjects}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
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
      <div className="min-h-screen w-full bg-black p-4 md:p-8  overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              Study Materials
            </h1>
            <p className="text-neutral-400">
              Explore your curriculum by subject and unit
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 0.8, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden p-6 animate-pulse"
                >
                  {/* Title Skeleton */}
                  <div className="h-6 bg-neutral-800 rounded w-3/4 mb-4"></div>

                  {/* Branch & Semester Skeleton */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-neutral-800 rounded w-20"></div>
                      <div className="h-4 bg-neutral-700 rounded w-24"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-neutral-800 rounded w-20"></div>
                      <div className="h-4 bg-neutral-700 rounded w-12"></div>
                    </div>
                  </div>

                  {/* Units Skeleton */}
                  <div className="pt-3 mt-4 border-t border-neutral-800">
                    <div className="h-3 bg-neutral-800 rounded w-1/2"></div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subjects.map((subject, index) => (
                <motion.div
                  key={subject._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleCardClick(subject)}
                  className="bg-neutral-900 border border-neutral-800 hover:border-gray-700 rounded-lg overflow-hidden transition-all cursor-pointer group"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <h3 className="text-xl font-semibold text-white group-hover:text-gray-400 transition-colors">
                        {subject.name}
                      </h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-400">
                          Branch:
                        </span>
                        <span className="text-sm text-neutral-200 font-medium">
                          {subject.branch}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-neutral-400">
                          Semester:
                        </span>
                        <span className="text-sm text-orange-400 font-semibold">
                          {subject.semester}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-neutral-800">
                        <span className="text-xs text-neutral-500">
                          {subject.units.length} units available
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <AnimatePresence>
            {isDialogOpen && selectedSubject && (
              <>
                {/* Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleCloseDialog}
                  className="fixed inset-0 backdrop-blur-sm z-40"
                />

                {/* Dialog */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ duration: 0.2 }}
                  className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-2xl font-bold text-white">
                            {selectedSubject.name}
                          </h2>
                        </div>
                        <div className="flex gap-4 text-sm text-neutral-400">
                          <span>{selectedSubject.branch}</span>
                          <span>•</span>
                          <span>Semester {selectedSubject.semester}</span>
                        </div>
                      </div>
                      <button
                        onClick={handleCloseDialog}
                        className="ml-4 text-neutral-400 hover:text-white transition-colors p-1 rounded-md hover:bg-neutral-800 cursor-pointer"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>

                    {/* Units List */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Course Units
                      </h3>
                      {selectedSubject.units.map((unit, index) => (
                        <motion.div
                          key={unit._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnitClick(unit);
                          }}
                          className="bg-black border border-neutral-800 hover:border-gray-500/50 rounded-lg p-4 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start gap-3">
                            <div className="bg-orange-500/10 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                              <span className="text-orange-400 text-sm font-semibold">
                                {index + 1}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-white font-semibold mb-1">
                                {unit.title}
                              </h4>
                              {unit.description && (
                                <p className="text-neutral-400 text-sm">
                                  {unit.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isUnitDialogOpen && selectedUnit && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleCloseUnitDialog}
                  className="fixed inset-0 backdrop-blur-sm z-60"
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ duration: 0.2 }}
                  className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-70 w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-white mb-1">
                          {selectedUnit.title}
                        </h2>
                        {selectedUnit.description && (
                          <p className="text-neutral-400 text-sm">
                            {selectedUnit.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={handleCloseUnitDialog}
                        className="ml-4 text-neutral-400 hover:text-white transition-colors p-1 rounded-md hover:bg-neutral-800 cursor-pointer  "
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Choose an action
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {unitOptions.map((option, index) => {
                          const Icon = option.icon;
                          return (
                            <motion.button
                              key={option.label}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.05 }}
                              onClick={() => handleOptionClick(option.id)}
                              className={`bg-black border border-neutral-800 hover:border-gray-600 rounded-lg p-4 transition-all hover:scale-102 active:scale-95 group text-left cursor-pointer`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`bg-neutral-900/80 rounded-lg p-3 group-hover:scale-110 transition-transform`}
                                >
                                  <Icon className={`h-6 w-6 text-gray-100`} />
                                </div>
                                <div className="text-white font-medium group-hover:text-neutral-200 transition-colors flex flex-col">
                                  <span>{option.label}</span>
                                  <span className="text-sm text-gray-400">
                                    {option.description}
                                  </span>
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
      {isAiTeacherVisible && (
        <AIAvatar
          setIsAiTeacherVisible={setIsAiTeacherVisible}
          selectedUnit={selectedUnit}
        />
      )}
      {isVisualVaultVisible && (
        <VisualVault
          setIsVisualVaultVisible={setIsVisualVaultVisible}
          selectedUnit={selectedUnit}
        />
      )}
      {isStudyHubVisible && (
        <StudyHub
          setIsStdudyHubVisible={setIsStdudyHubVisible}
          selectedUnit={selectedUnit}
        />
      )}
      {isChatBotVisible && (
        <ChatBot setIsSChatBotVisible={setIsSChatBotVisible} />
      )}
      {isTrendingPageVisible && (
        <TrendingPage setIsTrendingPageVisible={setIsTrendingPageVisible} />
      )}
      {isQuickQuizVisible && (
        <QuickQuiz
          setIsQuickQuizVisible={setIsQuickQuizVisible}
          selectedUnit={selectedUnit}
        />
      )}
    </div>
  );
};

export default Materials;
