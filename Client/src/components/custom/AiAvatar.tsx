import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, Square, X, Loader } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BottomGradient from "../ui/buttonGradient";
import axios from "axios";
import { toast } from "react-toastify";

interface Props {
  setIsAiTeacherVisible: (visible: boolean) => void;
  selectedUnit: string | null;
  selectedSubject: string | null;
}

const AIAvatar: React.FC<Props> = ({
  setIsAiTeacherVisible,
  selectedUnit,
  selectedSubject,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [textDisplaying, setTextDisplaying] = useState("");
  const [hindiVoice, setHindiVoice] = useState(null);
  const videoRef = useRef(null);
  const subtitleTimeoutRefs = useRef([]);
  const utteranceRef = useRef(null);
  const wordsRef = useRef([]);
  const currentWordIndexRef = useRef(0);
  const subtitleIntervalRef = useRef(null);
  const speechStartTimeRef = useRef(0);
  const pausedTimeRef = useRef(0);
  const totalPausedDurationRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [text, setText] = useState(
    `Hello, welcome to JaisianVerse! I’m here to summarize this unit for you a quick, clear walkthrough to help you understand the key points`
  );
  const [isGenerating, setIsGenerating] = useState(false);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [textDisplaying]);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();

      if (availableVoices.length > 0) {
        const selectedVoice =
          availableVoices.find((v) => v.lang.toLowerCase().includes("hi-in")) ||
          availableVoices.find((v) => v.name.toLowerCase().includes("hindi")) ||
          availableVoices.find((v) =>
            v.name.toLowerCase().includes("female")
          ) ||
          availableVoices.find((v) => v.name.toLowerCase().includes("woman")) ||
          availableVoices[0];

        setHindiVoice(selectedVoice);
      }
    };

    loadVoices();

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      subtitleTimeoutRefs.current.forEach(clearTimeout);
      if (subtitleIntervalRef.current) {
        clearInterval(subtitleIntervalRef.current);
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  const startVideoPlayback = () => {
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.error("Video play error:", err);
      });
    }
  };

  const updateSubtitles = () => {
    const now = Date.now();
    const elapsedTime =
      now - speechStartTimeRef.current - totalPausedDurationRef.current;

    const words = wordsRef.current;
    const wordsPerSecond = 2.4;
    const expectedWordIndex = Math.floor((elapsedTime / 1000) * wordsPerSecond);

    if (
      expectedWordIndex < words.length &&
      expectedWordIndex !== currentWordIndexRef.current
    ) {
      currentWordIndexRef.current = expectedWordIndex;
      const displayText = words.slice(0, expectedWordIndex + 1).join(" ");
      setTextDisplaying(displayText);
    }
  };
  const speakText = async () => {
    if (isSpeaking) return;
    setIsGenerating(true);

    let finalText = text;

    try {
      const idResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/materials/fetchSubjectUnitID`,
        {
          params: {
            subjectName: selectedSubject,
            unitName: selectedUnit,
          },
          withCredentials: true,
        }
      );

      const { subjectId, unitId } = idResponse.data;

      if (!subjectId || !unitId) {
        throw new Error("Invalid subject or unit ID");
      }

      const summary = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/materials/generateSummary`,
        {
          params: {
            subjectId,
            unitId,
            selectedSubject,
          },
          withCredentials: true,
        }
      );

      finalText = `
        Hello, welcome to JaisianVerse! I’m here to summarize this unit for you a quick, clear walkthrough to help you understand the key points in
        ${" "}
        ${selectedSubject || ""}
        ${" "}
        ${selectedUnit || ""}.
        ${" "}
        ${summary.data.summary}
        `;
      finalText = finalText.replace(/\s+/g, " ").trim();
      setText(finalText);
      console.log(finalText);
    } catch (error) {
      setIsGenerating(false);
      toast.error("Failed to generate summary.");
      console.error("Failed to fetch materials:", error);
      return;
    }

    // CLEAR PREVIOUS SUBTITLES / INTERVALS
    subtitleTimeoutRefs.current.forEach(clearTimeout);
    subtitleTimeoutRefs.current = [];

    if (subtitleIntervalRef.current) {
      clearInterval(subtitleIntervalRef.current);
    }

    // SPEECH STATE
    setIsSpeaking(true);
    setIsPaused(false);
    setTextDisplaying("");

    wordsRef.current = finalText.split(" ");
    currentWordIndexRef.current = 0;
    totalPausedDurationRef.current = 0;

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }

    const utterance = new SpeechSynthesisUtterance(finalText);
    utteranceRef.current = utterance;

    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }

    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    let hasStarted = false;

    utterance.onstart = () => {
      if (!hasStarted) {
        hasStarted = true;
        speechStartTimeRef.current = Date.now();
        startVideoPlayback();
        subtitleIntervalRef.current = setInterval(updateSubtitles, 50);
      }
    };

    utterance.onend = () => {
      if (subtitleIntervalRef.current) {
        clearInterval(subtitleIntervalRef.current);
      }

      setTextDisplaying(finalText);
      setIsSpeaking(false);
      setIsPaused(false);

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    };

    utterance.onerror = (e) => {
      console.error("Speech synthesis error:", e);

      if (subtitleIntervalRef.current) {
        clearInterval(subtitleIntervalRef.current);
      }

      setIsSpeaking(false);
      setIsPaused(false);

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    };

    window.speechSynthesis.cancel(); // safety
    window.speechSynthesis.speak(utterance);
  };

  const togglePause = () => {
    if (!isSpeaking) return;

    if (isPaused) {
      const pauseDuration = Date.now() - pausedTimeRef.current;
      totalPausedDurationRef.current += pauseDuration;

      window.speechSynthesis.resume();
      if (videoRef.current) {
        videoRef.current.play().catch((err) => {
          console.error("Video play error:", err);
        });
      }

      subtitleIntervalRef.current = setInterval(updateSubtitles, 50);

      setIsPaused(false);
    } else {
      pausedTimeRef.current = Date.now();

      window.speechSynthesis.pause();
      if (videoRef.current) {
        videoRef.current.pause();
      }

      if (subtitleIntervalRef.current) {
        clearInterval(subtitleIntervalRef.current);
      }

      setIsPaused(true);
    }
  };

  useEffect(() => {
    stopSpeech();
  }, []);

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    subtitleTimeoutRefs.current.forEach(clearTimeout);
    subtitleTimeoutRefs.current = [];

    if (subtitleIntervalRef.current) {
      clearInterval(subtitleIntervalRef.current);
    }
    setIsGenerating(false);
    setIsSpeaking(false);
    setIsPaused(false);
    setTextDisplaying("");
    currentWordIndexRef.current = 0;
    totalPausedDurationRef.current = 0;

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
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
          className="fixed inset-0 backdrop-blur-sm"
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] h-[95vh] overflow-y-auto bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl flex justify-center items-center z-80"
        >
          <button
            onClick={() => setIsAiTeacherVisible(false)}
            className="ml-4 absolute right-1 top-1 text-neutral-400 hover:text-white transition-colors p-1 rounded-md hover:bg-neutral-800 cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>
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
             .delay-150 { animation-delay: 150ms; }
        .delay-300 { animation-delay: 300ms; }
        `}
          </style>

          <div className="min-h-screen  flex items-center justify-center p-4">
            <div className="max-w-7xl w-full">
              {/* Header Section */}
              <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-white mb-3">
                  {selectedSubject}
                </h1>
                <p className="text-base text-gray-400">{selectedUnit}</p>
              </div>

              {/* Main Content Grid */}
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                {/* Transcript Display */}
                <div className="w-full">
                  <div className="relative">
                    {/* Decorative corners */}
                    <div className="absolute -top-2 -left-2 w-8 h-8 border-t-2 border-l-2 border-orange-500/50 rounded-tl-lg"></div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 border-t-2 border-r-2 border-orange-500/50 rounded-tr-lg"></div>
                    <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-2 border-l-2 border-orange-500/50 rounded-bl-lg"></div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-2 border-r-2 border-orange-500/50 rounded-br-lg"></div>

                    <div className="relative bg-neutral-900 backdrop-blur-xl rounded-2xl p-10 border border-orange-500/20 min-h-[450px] flex items-center justify-center">
                      <div className="w-full">
                        {/* Live Indicator */}
                        <div className="flex items-center gap-2 mb-6">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"></div>
                            <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse delay-150"></div>
                            <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse delay-300"></div>
                          </div>
                          <span className="text-xs font-semibold text-orange-300 uppercase tracking-wider">
                            Live Transcript
                          </span>
                        </div>

                        {textDisplaying ? (
                          <div className="h-80 overflow-y-auto pr-2">
                            <p className="text-lg md:text-xl leading-relaxed text-gray-100 font-light">
                              {textDisplaying}
                              <div ref={messagesEndRef} />
                            </p>
                          </div>
                        ) : (
                          <div className="h-80 flex flex-col items-center justify-center text-center space-y-4">
                            <p className="text-2xl text-gray-300 font-medium">
                              Ready to Learn
                            </p>
                            <p className="text-sm text-gray-500">
                              Press the speak button to begin your lesson
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controls Section */}
                <div className="w-full flex items-center justify-center lg:justify-start">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {!isSpeaking ? (
                      <button
                        disabled={isGenerating || isSpeaking}
                        className="group/btn relative h-12 px-8 flex justify-center items-center gap-3 rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        onClick={speakText}
                      >
                        {isGenerating ? (
                          <>
                            <Loader className="w-5 h-5 animate-spin" />
                            <span>Generating summary...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-5 h-5" />
                            <span>Start Speaking</span>
                          </>
                        )}
                        <BottomGradient />
                      </button>
                    ) : (
                      <>
                        <button
                          className="group/btn relative h-12 px-8 flex justify-center items-center gap-3 rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] cursor-pointer transition-all"
                          onClick={togglePause}
                        >
                          {isPaused ? (
                            <>
                              <Play className="w-5 h-5" />
                              <span>Resume</span>
                            </>
                          ) : (
                            <>
                              <Pause className="w-5 h-5" />
                              <span>Pause</span>
                            </>
                          )}
                          <BottomGradient />
                        </button>

                        <button
                          className="group/btn relative h-12 px-8 flex justify-center items-center gap-3 rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] cursor-pointer transition-all"
                          onClick={stopSpeech}
                        >
                          <Square className="w-5 h-5" />
                          <span>Stop</span>
                          <BottomGradient />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
};

export default AIAvatar;
