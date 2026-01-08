import { cn } from "../../../lib/utils";
import Sidebar from "./Navbar";
import { useState, useEffect, useRef } from "react";
import { File, Notebook, Save, X } from "lucide-react";
import { unitOptions } from "../../data/unitOptions";
import { motion, AnimatePresence } from "framer-motion";
import AIAvatar from "./AiAvatar";
import VisualVault from "./VisualVault";
import StudyHub from "./StudyHub";
import ChatBot from "./ChatBot";
import TrendingPage from "./TrendingPage";
import QuickQuiz from "./QuickQuiz";
import { useAuth } from "../../context/AuthContext";
import semestersData from "../../data/semesters.ts";
import BottomGradient from "../ui/buttonGradient.tsx";
import { IconCancel } from "@tabler/icons-react";
import { toast } from "react-toastify";
import axios from "axios";

interface Unit {
  name: string;
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
  const [editProfile, setEditProfile] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      alert("Only PDF files are allowed");
      return;
    }

    setSelectedPdf(file);
  };

  useEffect(() => {
    checkUser("materials");
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const formattedSubjects: Subject[] = [];

      Object.entries(semestersData).forEach(([branchName, semesters]) => {
        Object.entries(semesters).forEach(([semesterKey, subjects]) => {
          const semesterNumber = Number(semesterKey.replace(/\D/g, ""));

          Object.entries(subjects).forEach(([subjectName, units]) => {
            formattedSubjects.push({
              _id: crypto.randomUUID(),
              name: subjectName,
              branch: branchName,
              semester: semesterNumber,
              units: units.map((unit) => ({
                name: unit,
              })),
            });
          });
        });
      });

      setSubjects(formattedSubjects);
      console.log(formattedSubjects);
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

  const handleUpload = async () => {
    if (!selectedPdf) {
      toast.error("Please select a PDF file.");
      return;
    }

    // Validate file type
    if (selectedPdf.type !== "application/pdf") {
      toast.error("Only PDF files are allowed.");
      return;
    }

    // Validate file size (5MB)
    if (selectedPdf.size > 5 * 1024 * 1024) {
      toast.error("PDF must be less than 5MB.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("pdf", selectedPdf);

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/materials/upload-notes`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const { url, fileId } = response.data.data;

      toast.success("PDF uploaded successfully!");

      // Optional: reset state
      setSelectedPdf(null);
      setEditProfile(false);

      // Optional: store URL if needed
      console.log("PDF URL:", url);
      console.log("PDF ID:", fileId);
    } catch (error: any) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload PDF.");
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
      {editProfile && (
        <div className="fixed inset-0 z-100 flex items-center justify-center">
          {/* Glass Background */}
          <div
            className="absolute inset-0 bg-white/10 backdrop-blur-md"
            onClick={() => setEditProfile(false)}
          />

          {/* Modal */}
          <div className="relative z-10 w-[90%] max-w-md rounded-2xl bg-black border border-white/20 p-6 shadow-xl text-white space-y-4">
            {/* PDF Selector */}
            <div className="flex flex-col gap-2">
              <p className="text-sm text-white/70">Upload PDF</p>

              <input
                type="file"
                accept="application/pdf"
                ref={pdfInputRef}
                onChange={handlePdfSelect}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                className="group/btn relative h-10 flex items-center gap-2 w-full rounded-md bg-zinc-900 border border-zinc-700 px-3 text-sm cursor-pointer"
              >
                <File />
                Select PDF
                <BottomGradient />
              </button>

              {selectedPdf && (
                <p className="text-xs text-green-400 truncate">
                  Selected: {selectedPdf.name}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                className="group/btn relative h-10 flex justify-center items-center gap-2 w-auto px-3 rounded-md bg-gray-600 font-medium border border-zinc-700 text-white cursor-pointer"
                onClick={() => setEditProfile(false)}
              >
                <IconCancel />
                Cancel
                <BottomGradient />
              </button>

              <button
                className="group/btn relative h-10 flex justify-center items-center gap-2 w-auto px-3 rounded-md bg-black font-medium border border-zinc-700 text-white cursor-pointer"
                onClick={handleUpload}
                disabled={!selectedPdf}
              >
                <Save />
                Upload
                <BottomGradient />
              </button>
            </div>
          </div>
        </div>
      )}

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
              {subjects
                .filter(
                  (subject) =>
                    Number(subject.semester) ===
                    Number(
                      JSON.parse(localStorage.getItem("userInfo") || "{}")
                        ?.semester
                    )
                )
                .map((subject, index) => (
                  <motion.div
                    key={subject._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    onClick={() => handleCardClick(subject)}
                    className="bg-neutral-900 border border-neutral-800 hover:border-neutral-600 rounded-lg overflow-hidden transition-all cursor-pointer group hover:shadow-lg"
                  >
                    <div className="p-6">
                      {/* Subject Name */}
                      <h3 className="text-lg font-semibold text-white group-hover:text-gray-300 transition-colors mb-4 line-clamp-2">
                        {subject.name}
                      </h3>

                      {/* Meta Info */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Branch</span>
                          <span className="text-neutral-200 font-medium">
                            {subject.branch}
                          </span>
                        </div>

                        <div className="flex justify-between">
                          <span className="text-neutral-400">Semester</span>
                          <span className="text-orange-400 font-semibold">
                            {subject.semester}
                          </span>
                        </div>

                        {/* Units */}
                        <div className="pt-3 mt-2 border-t border-neutral-800">
                          <span className="text-xs text-neutral-500">
                            {subject.units.length} Units Available
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
                          key={`${selectedSubject._id}-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.08 }}
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
                              <h4 className="text-white font-semibold">
                                {unit.name}
                              </h4>
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
                          {selectedSubject?.name} | {selectedUnit?.name}
                        </h2>
                      </div>

                      <button
                        onClick={handleCloseUnitDialog}
                        className="ml-4 text-neutral-400 hover:text-white transition-colors p-1 rounded-md hover:bg-neutral-800 cursor-pointer"
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
                              className="bg-black border border-neutral-800 hover:border-gray-600 rounded-lg p-4 transition-all hover:scale-102 active:scale-95 group text-left cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <div className="bg-neutral-900/80 rounded-lg p-3 group-hover:scale-110 transition-transform">
                                  <Icon className="h-6 w-6 text-gray-100" />
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
                    <button
                      className="group/btn relative h-10 flex justify-center items-center gap-2 w-auto px-1 rounded-md bg-black font-medium border border-zinc-700 text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] cursor-pointer mx-auto my-2"
                      onClick={() => {
                        setEditProfile(true);
                      }}
                    >
                      <Notebook />
                      Contribute Note
                      <BottomGradient />
                    </button>
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
          selectedSubject={selectedSubject}
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
