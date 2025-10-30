import { useEffect, useRef, useState } from "react";
import { Play, Pause, Square, MessageSquare } from "lucide-react";
import Sidebar from "./Navbar";
import { cn } from "../../../lib/utils";

export default function AIAvatar() {
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
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [textDisplaying]);

  const text = `Hello, welcome to JaisianVerse! I’m here to summarize this unit for you — a quick, clear walkthrough to help you understand the key points before you move ahead.

Today, we’re exploring one of the most fascinating processes in nature — Photosynthesis.

Photosynthesis is how green plants, algae, and some bacteria make their own food using sunlight. Imagine a plant as a tiny, solar-powered factory — it takes in sunlight, carbon dioxide from the air, and water from the soil, and transforms them into glucose — a type of sugar that serves as food and energy. In the process, it also releases oxygen, which we humans rely on to breathe. Pretty amazing, right?

Let’s break it down a bit. The green pigment in leaves called chlorophyll captures sunlight. This energy is then used to split water molecules into hydrogen and oxygen. The hydrogen combines with carbon dioxide to form glucose, while oxygen is released into the air as a by-product. The simple equation looks like this:  
Carbon Dioxide plus Water, in the presence of sunlight and chlorophyll, gives Glucose and Oxygen.  

In plants, this process mostly happens in tiny cell parts called chloroplasts — they’re like the powerhouses where all the magic happens. The glucose made isn’t just used right away; some of it is stored as starch for later, helping the plant survive during low-light or dry periods.  

But photosynthesis isn’t just important for plants — it’s the foundation of all life on Earth. It’s what keeps our atmosphere balanced by reducing carbon dioxide and producing oxygen. It’s also the first step in every food chain — without it, there’d be no plants, no animals, and no us.

So, in summary: Photosynthesis is nature’s way of turning sunlight into life. It’s one of the most efficient, elegant, and essential systems ever created — a perfect example of how energy flows through the living world.

Thank you for listening! I’ll see you again here on JaycianVerse — where learning is simple, engaging, and full of discovery.
`;

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();

      if (availableVoices.length > 0) {
        let selectedVoice =
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
    const wordsPerSecond = 2.5;
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

  const speakText = () => {
    if (!text || isSpeaking) return;

    subtitleTimeoutRefs.current.forEach(clearTimeout);
    subtitleTimeoutRefs.current = [];
    if (subtitleIntervalRef.current) {
      clearInterval(subtitleIntervalRef.current);
    }

    setIsSpeaking(true);
    setIsPaused(false);
    setTextDisplaying("");

    wordsRef.current = text.split(" ");
    currentWordIndexRef.current = 0;
    totalPausedDurationRef.current = 0;

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }

    const utterance = new SpeechSynthesisUtterance(text);
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

        subtitleIntervalRef.current = setInterval(updateSubtitles, 100);
      }
    };

    utterance.onend = () => {
      if (subtitleIntervalRef.current) {
        clearInterval(subtitleIntervalRef.current);
      }

      setTextDisplaying(text);

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

      subtitleIntervalRef.current = setInterval(updateSubtitles, 100);

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

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    subtitleTimeoutRefs.current.forEach(clearTimeout);
    subtitleTimeoutRefs.current = [];

    if (subtitleIntervalRef.current) {
      clearInterval(subtitleIntervalRef.current);
    }

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
    <div
      className={cn(
        "mx-auto fixed flex w-full flex-1 flex-col border border-neutral-200 bg-gray-100 md:flex-row dark:border-neutral-700 dark:bg-neutral-900 h-screen"
      )}
    >
      <Sidebar />
      <div className="min-h-screen w-full bg-black flex items-center justify-center p-4 md:p-8">
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
        <div className="max-w-7xl w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              JaicianVerse AI Teacher
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              Your personal learning companion
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Left Side - Video */}
            <div className="flex flex-col">
              <div
                className="relative rounded-2xl overflow-hidden transition-all duration-500 ease-out bg-neutral-900"
                style={{
                  filter:
                    isSpeaking && !isPaused
                      ? "drop-shadow(0 0 40px hsl(270 80% 65% / 0.6))"
                      : "drop-shadow(0 0 20px hsl(270 50% 40% / 0.2))",
                }}
              >
                <video
                  ref={videoRef}
                  src="AI-Teacher-Video.mp4"
                  className="w-full h-auto"
                  muted
                  preload="auto"
                  playsInline
                  loop
                />

                {/* Status Indicator */}
                <div className="absolute top-4 right-4">
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md ${
                      isSpeaking && !isPaused
                        ? "bg-green-500/20 border border-green-500/50"
                        : isPaused
                        ? "bg-yellow-500/20 border border-yellow-500/50"
                        : "bg-gray-500/20 border border-gray-500/50"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isSpeaking && !isPaused
                          ? "bg-green-400 animate-pulse"
                          : isPaused
                          ? "bg-yellow-400"
                          : "bg-gray-400"
                      }`}
                    ></div>
                    <span className="text-xs font-medium text-white">
                      {isSpeaking && !isPaused
                        ? "Speaking"
                        : isPaused
                        ? "Paused"
                        : "Ready"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="mt-6 flex justify-center gap-3">
                {!isSpeaking ? (
                  <button
                    onClick={speakText}
                    className="group relative px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 bg-purple-600 hover:bg-purple-700 active:scale-95 shadow-lg shadow-purple-500/50"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      Start Speaking
                    </span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={togglePause}
                      className="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-lg shadow-blue-500/50"
                    >
                      <span className="flex items-center gap-2">
                        {isPaused ? (
                          <>
                            <Play className="w-5 h-5" />
                            Resume
                          </>
                        ) : (
                          <>
                            <Pause className="w-5 h-5" />
                            Pause
                          </>
                        )}
                      </span>
                    </button>
                    <button
                      onClick={stopSpeech}
                      className="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 bg-red-600 hover:bg-red-700 active:scale-95 shadow-lg shadow-red-500/50"
                    >
                      <span className="flex items-center gap-2">
                        <Square className="w-5 h-5" />
                        Stop
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Right Side - Subtitles */}
            <div className="flex flex-col justify-center">
              <div className="relative">
                {/* Decorative corner elements */}
                <div className="absolute -top-2 -left-2 w-8 h-8 border-t-2 border-l-2 border-purple-500/50 rounded-tl-lg"></div>
                <div className="absolute -top-2 -right-2 w-8 h-8 border-t-2 border-r-2 border-purple-500/50 rounded-tr-lg"></div>
                <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-2 border-l-2 border-purple-500/50 rounded-bl-lg"></div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-2 border-r-2 border-purple-500/50 rounded-br-lg"></div>

                <div className="relative bg-neutral-900 backdrop-blur-xl rounded-2xl p-8 border border-purple-500/20 min-h-[400px] flex items-center justify-center">
                  <div className="relative z-10 w-full">
                    {textDisplaying ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse delay-150"></div>
                            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse delay-300"></div>
                          </div>
                          <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                            Live Transcript
                          </span>
                        </div>
                        <p className="text-lg md:text-xl leading-relaxed text-gray-100 font-light h-80 overflow-y-auto">
                          {textDisplaying} <div ref={messagesEndRef} />
                        </p>
                      </div>
                    ) : (
                      <div className="text-center space-y-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 border border-purple-500/30">
                          <MessageSquare className="w-8 h-8 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-xl text-gray-300 font-medium mb-2">
                            Ready to Learn
                          </p>
                          <p className="text-sm text-gray-500">
                            Press the speak button to begin your lesson
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
