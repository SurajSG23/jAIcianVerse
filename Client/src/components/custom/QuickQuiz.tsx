import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousal";
import BottomGradient from "../ui/buttonGradient";
import { RxCross1 } from "react-icons/rx";
import { FaCheck } from "react-icons/fa";
import useDetectTabSwitch from "../ui/useDetectTabSwitch";

interface Unit {
  _id: string;
  title: string;
  description: string;
}

interface Material {
  _id: string;
  title: string;
  fileUrl: string;
  uploadedBy: string;
  subject: string;
  unit: string;
  approved: boolean;
}

interface Props {
  setIsQuickQuizVisible: (visible: boolean) => void;
  selectedUnit: Unit | null;
}

const StudyHub: React.FC<Props> = ({ setIsQuickQuizVisible, selectedUnit }) => {
  useDetectTabSwitch();
  const [currentTime, setCurrentTime] = useState(10 * 60);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>(
    Array(10).fill(null)
  );
  const [currentSlide, setCurrentSlide] = useState(1);
  const nextRef = useRef<HTMLButtonElement>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const [geminiQuestions, setGeminiQuestions] = useState<string[]>([]);
  const [geminiOptions, setGeminiOptions] = useState<string[][]>([]);
  const [geminiAnswers, setGeminiAnswers] = useState<string[]>([]);
  const [geminiExplaination, setGeminiExplaination] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [quitConfirmation, setQuitConfirmation] = useState(false);
  const [submitConfirmation, setSubmitConfirmation] = useState(false);
  const [scoreBoard, setScoreBoard] = useState(false);
  const [score, setScore] = useState<number>(0);

  useEffect(() => {
    if (currentTime <= 0) return;
    const timer = setInterval(() => {
      setCurrentTime((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentTime, geminiQuestions, geminiOptions, geminiAnswers]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSelectOption = (questionIndex: number, option: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = option;
    setUserAnswers(newAnswers);
  };

  const handleSubmitTest = async () => {
    const score = userAnswers.reduce((total, answer, index) => {
      return answer?.trim() === geminiAnswers[index].trim() ? total + 1 : total;
    }, 0);
    setScore(score);
    setScoreBoard(true);
  };

  const incrementSlideNo = () => {
    const newValue = currentSlide + 1;
    setCurrentSlide(newValue);
  };
  const decrementSlideNo = () => {
    const newValue = currentSlide - 1;
    setCurrentSlide(newValue);
  };

  const changeSlide = (targetIndex: number) => {
    if (targetIndex + 1 > currentSlide) {
      for (let i = currentSlide; i < targetIndex + 1; i++) {
        nextRef.current?.click();
      }
    } else if (targetIndex + 1 < currentSlide) {
      for (let i = currentSlide; i > targetIndex + 1; i--) {
        prevRef.current?.click();
      }
    } else {
      return;
    }
    const newValue = targetIndex + 1;
    setCurrentSlide(newValue);
  };

  useEffect(() => {
    const preventRefresh = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", preventRefresh);

    return () => {
      window.removeEventListener("beforeunload", preventRefresh);
    };
  }, []);

  useEffect(() => {
    const handleBack = () => {
      window.history.pushState(null, "", window.location.href);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handleBack);

    return () => {
      window.removeEventListener("popstate", handleBack);
    };
  }, []);

  const GenerateQuestions = async () => {
    setLoading(true);
    try {
      const result = `
        <questions>
        Software engineering primarily focuses on which of the following aspects of software development?***
        Which of the following best defines software engineering?***
        Which of the following is NOT a phase of the software development life cycle (SDLC)?***
        The main goal of requirement analysis in software engineering is to?***
        Which model is also known as the linear-sequential model in software development?***
        What is the primary advantage of the prototyping model?***
        Which of the following ensures software quality during development?***
        Who is responsible for ensuring that software meets customer requirements?***
        What does software maintenance mainly involve?***
        Which of the following is a characteristic of good software?***
        <questions>

        <options>
        Quality assurance@*@Project management@*@Programming@*@Design ***
        Process of creating, testing, and maintaining software systematically@*@Writing code quickly@*@Using tools to automate software creation@*@Testing software manually ***
        Planning@*@Design@*@Shopping@*@Testing ***
        Identify what the software must do@*@Build software architecture@*@Deploy the system@*@Maintain existing code ***
        Waterfall model@*@Spiral model@*@Prototype model@*@Agile model ***
        Allows early user feedback@*@Reduces cost completely@*@Eliminates testing@*@Avoids user interaction ***
        Software testing@*@Code formatting@*@Debugging@*@Documentation ***
        Project manager@*@Client@*@Software engineer@*@Database administrator ***
        Bug fixing and updating@*@Planning new software@*@Hiring developers@*@Designing new interfaces ***
        Complexity@*@Unreliability@*@Efficiency@*@Ambiguity ***
        <options>

        <answers>
        Design ***
        Process of creating, testing, and maintaining software systematically ***
        Shopping ***
        Identify what the software must do ***
        Waterfall model ***
        Allows early user feedback ***
        Software testing ***
        Software engineer ***
        Bug fixing and updating ***
        Efficiency ***
        <answers>

        <explaination>
        Design focuses on how software components interact to meet user needs. ***
        Software engineering is a systematic approach involving analysis, design, testing, and maintenance. ***
        Shopping is not part of the SDLC; it’s unrelated to development processes. ***
        Requirement analysis defines functional and non-functional expectations from users. ***
        The waterfall model is also called the linear-sequential model. ***
        The prototyping model provides early user feedback to refine requirements. ***
        Software testing ensures software quality through verification and validation. ***
        Software engineers ensure that software fulfills customer requirements. ***
        Software maintenance involves fixing bugs and updating features. ***
        Efficiency is a key quality attribute of well-designed software. ***
        <explaination>
        `;
      const geminiQues = result
        ?.split("<questions>")[1]
        .split("</questions>")[0]
        .split("***")
        .map((question) => question.trim())
        .filter(Boolean);
      setGeminiQuestions(geminiQues ?? []);

      const geminiOps = result
        ?.split("<options>")[1]
        .split("***")
        .map((option) => option.trim().split("@*@"));
      setGeminiOptions(geminiOps ?? []);

      const geminiAns = result
        ?.split("<answers>")[1]
        .split("***")
        .map((answer) => answer.trim());
      setGeminiAnswers(geminiAns ?? []);

      const geminiExp = result
        ?.split("<explaination>")[1]
        .split("***")
        .map((answer) => answer.trim());
      setGeminiExplaination(geminiExp ?? []);
    } catch (error) {
      console.error("Error generating questions:", error);
    } finally {
      setCurrentTime(10 * 60);
      setLoading(false);
    }
  };
  useEffect(() => {
    GenerateQuestions();
  }, []);

  return (
    <AnimatePresence>
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] h-[95vh] overflow-y-auto bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl flex flex-col z-80"
        >
          <button
            onClick={() => setIsQuickQuizVisible(false)}
            className="absolute right-3 top-3 text-neutral-400 hover:text-white transition-colors p-1 rounded-md hover:bg-neutral-800 cursor-pointer z-100"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="min-h-screen bg-neutral-900 text-white w-full absolute">
            {/* Header */}
            <header className="bg-black shadow-md">
              <div className="container mx-auto px-4 py-3 flex justify-start items-center">
                <div className="flex items-center">
                  <div className="bg-neutral-900 px-4 py-2 rounded-md flex items-center">
                    <svg
                      className="h-5 w-5 mr-2 text-orange-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-mono">{formatTime(currentTime)}</span>
                  </div>
                </div>
              </div>
            </header>

            <div className="bg-black py-2 px-4">
              <div className="container mx-auto">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-300">Progress</span>
                  <span className="text-sm text-gray-300">
                    {userAnswers.filter((ans) => ans !== null).length} /{" "}
                    {geminiQuestions.length} answered
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        (userAnswers.filter((ans) => ans !== null).length /
                          geminiQuestions.length) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Main content */}
            <main className="container mx-auto px-4 py-8">
              <Carousel className="w-full max-w-4xl mx-auto">
                <CarouselContent>
                  {geminiQuestions.map((question, index) => (
                    <CarouselItem key={index}>
                      <div className="bg-black rounded-lg p-6 shadow-lg h-full">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl font-bold text-orange-500">
                            Question {index + 1}
                          </h3>
                          <span className="bg-gray-700 px-2 py-1 rounded text-sm">
                            {index + 1} of {geminiQuestions.length}
                          </span>
                        </div>

                        <p className="text-lg mb-6">{question}</p>

                        <div className="space-y-3">
                          {geminiOptions[index].map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className={`border border-gray-700 rounded-md p-3 cursor-pointer transition-colors ${
                                userAnswers[index] === option
                                  ? "bg-orange-600 border-orange-500"
                                  : "hover:bg-gray-700"
                              }`}
                              onClick={() => handleSelectOption(index, option)}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="flex justify-between items-center mt-4">
                  <div
                    aria-disabled={currentSlide <= 1}
                    onClick={() => {
                      decrementSlideNo();
                    }}
                  >
                    <CarouselPrevious
                      className="relative right-0 left-auto bg-gray-800 border-gray-700 hover:bg-gray-700 text-white cursor-pointer"
                      ref={prevRef}
                    />
                  </div>
                  <div
                    aria-disabled={currentSlide === 10}
                    onClick={() => {
                      incrementSlideNo();
                    }}
                  >
                    <CarouselNext
                      className="relative right-0 left-auto bg-gray-800 border-gray-700 hover:bg-gray-700 text-white cursor-pointer"
                      ref={nextRef}
                    />
                  </div>
                </div>
              </Carousel>

              {/* Question navigator */}
              <div className="mt-8 max-w-4xl mx-auto">
                <h3 className="text-lg font-semibold mb-3">
                  Questions Navigator
                </h3>
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
                  {geminiQuestions.map((_, index) => (
                    <button
                      key={index}
                      className={`h-10 w-10 rounded-md flex items-center justify-center ${
                        userAnswers[index] !== null
                          ? "bg-orange-600 text-white"
                          : "bg-black text-gray-300 border border-gray-700"
                      } cursor-pointer hover:bg-gray-700`}
                      onClick={() => {
                        changeSlide(index);
                      }}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                <div className="flex justify-center ">
                  <div
                    onClick={() => {
                      setQuitConfirmation(true);
                    }}
                    className="relative w-[120px] mt-6 mx-auto"
                  >
                    <p className="group/btn relative block border border-gray-700 w-auto p-2 flex justify-center items-center gap-3 rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] cursor-pointer">
                      Quit Test
                      <BottomGradient />
                    </p>
                  </div>
                  <div
                    onClick={() => {
                      setSubmitConfirmation(true);
                    }}
                    className="relative w-[120px] mt-6 mx-auto"
                  >
                    <button className="group/btn relative block  border border-gray-700 w-auto p-2 flex justify-center items-center gap-3 rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] cursor-pointer">
                      Submit Test
                      <BottomGradient />
                    </button>
                  </div>
                </div>
                <p className="text-center m-3">
                  <span className="font-semibold text-gray-400">Notice:</span>{" "}
                  If you encounter any errors in generating questions or
                  options, <br /> please click{" "}
                  <span
                    className="text-red-400 cursor-pointer hover:text-red-500"
                    // onClick={GenerateQuestions}
                  >
                    {" "}
                    here{" "}
                  </span>{" "}
                  to regenerate them.{" "}
                </p>
              </div>
            </main>
          </div>

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
                background-color: rgba(54, 54, 54, 0.8);
              }
            `}
          </style>
        </motion.div>
      </>
      {quitConfirmation && (
        <AnimatePresence>
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] h-[95vh] overflow-y-auto bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl flex flex-col z-80"
            >
              <div className="fixed inset-0 flex justify-center items-center bg-neutral-900 z-50 backdrop-blur-sm">
                <div className="bg-black rounded-3xl shadow-2xl p-10 text-white w-[90%] max-w-lg border border-gray-700 transition-all duration-300">
                  <h1 className="text-3xl font-bold mb-6 tracking-wide text-center">
                    Are you sure you want to quit?
                  </h1>
                  <div className="mt-8 flex justify-center gap-6">
                    <button
                      onClick={() => {
                        setQuitConfirmation(false);
                      }}
                      className="group/btn px-6 text-lg relative block border border-gray-700 w-auto p-2 flex justify-center items-center gap-3 rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] cursor-pointer"
                    >
                      No
                      <BottomGradient />
                    </button>
                    <button
                      onClick={() => {
                        setQuitConfirmation(false);
                        setIsQuickQuizVisible(false);
                      }}
                      className="group/btn px-6 text-lg relative block border border-gray-700 w-auto p-2 flex justify-center items-center gap-3 rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] cursor-pointer"
                    >
                      Yes
                      <BottomGradient />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        </AnimatePresence>
      )}

      {submitConfirmation && (
        <AnimatePresence>
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] h-[95vh] overflow-y-auto bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl flex flex-col z-80"
            >
              <div className="w-full h-full inset-0 flex justify-center items-center bg-neutral-900 z-50 backdrop-blur-sm">
                <div className="bg-black rounded-3xl shadow-2xl p-10 text-white max-w-lg border border-gray-600 transition-all duration-300">
                  <h1 className="text-3xl font-extrabold mb-6 tracking-wide text-center">
                    Are you sure you want to submit?
                  </h1>
                  <p className="text-center">
                    You have attended{" "}
                    <span className="text-orange-300">
                      {userAnswers.filter((answer) => answer !== null).length}
                    </span>{" "}
                    / 10 Questions
                  </p>
                  <p className="text-center">
                    <span className="text-orange-300">
                      {10 -
                        userAnswers.filter((answer) => answer !== null).length}
                    </span>{" "}
                    remaining
                  </p>
                  <div className="mt-4 flex justify-center gap-2">
                    <button
                      onClick={() => {
                        setSubmitConfirmation(false);
                      }}
                      className="group/btn px-6 text-lg relative block border border-gray-700 w-auto p-2 flex justify-center items-center gap-3 rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] cursor-pointer"
                    >
                      No
                      <BottomGradient />
                    </button>
                    <button
                      onClick={() => {
                        handleSubmitTest();
                        setSubmitConfirmation(false);
                      }}
                      className="group/btn px-6 text-lg relative block border border-gray-700 w-auto p-2 flex justify-center items-center gap-3 rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] cursor-pointer"
                    >
                      Yes
                      <BottomGradient />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        </AnimatePresence>
      )}

      {scoreBoard && (
        <AnimatePresence>
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] h-[95vh] overflow-y-auto bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl flex flex-col z-80"
            >
              <div className="fixed inset-0 flex justify-center items-center bg-black z-50 backdrop-blur-sm">
                <div className="bg-neutral-900 shadow-2xl p-10 text-white w-full h-full overflow-y-auto transition-all duration-300">
                  {/* Title */}
                  <h1 className="text-4xl font-extrabold mb-6 tracking-wide text-center drop-shadow-lg">
                    Test Completed!
                  </h1>

                  {/* Score Summary */}
                  <div className="text-center space-y-4 text-lg">
                    <p>
                      <span className="text-gray-600 font-semibold">
                        Total Points:
                      </span>{" "}
                      {score} / 10
                    </p>
                    <p
                      className={`font-medium ${
                        score === 10
                          ? "text-green-400"
                          : score >= 7
                          ? "text-blue-400"
                          : score >= 4
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {score === 10
                        ? "Perfect Score!"
                        : score >= 7
                        ? "Great Job!"
                        : score >= 4
                        ? "Good Effort!"
                        : "Keep Practicing!"}
                    </p>
                  </div>

                  {/* Mistakes Section */}
                  {score < 10 && (
                    <div className="mt-10 space-y-10">
                      {/* MISTAKES SECTION*/}
                      <div>
                        <h2 className="text-2xl font-semibold text-gray-500 text-center mb-6">
                          Your Mistakes
                        </h2>

                        {geminiAnswers.some(
                          (correct, index) =>
                            userAnswers[index]?.trim() !== correct.trim()
                        ) ? (
                          <ul className="space-y-5 max-w-3xl mx-auto px-4">
                            {geminiAnswers.map((correct, index) => {
                              const user = userAnswers[index];

                              // Show this if user gave a wrong answer OR didn't answer at all
                              if (
                                (!user || user.trim() !== correct.trim()) &&
                                index != 10
                              ) {
                                return (
                                  <li
                                    key={index}
                                    className="bg-neutral-800 p-5 rounded-2xl shadow-md border border-red-900/8 0 transition-all duration-200"
                                  >
                                    <p className="text-red-400 font-semibold mb-2 flex items-center gap-1">
                                      <RxCross1 className="text-xl" /> Question{" "}
                                      {index + 1}
                                    </p>

                                    {/* If user didn’t answer */}
                                    {!user ? (
                                      <p className="text-gray-400 italic">
                                        You did not answer this question.
                                      </p>
                                    ) : (
                                      <>
                                        <p className="text-gray-300">
                                          <span className="text-gray-500 font-semibold">
                                            Your Answer:
                                          </span>{" "}
                                          {user}
                                        </p>
                                      </>
                                    )}

                                    <p className="text-gray-300">
                                      <span className="text-gray-500 font-semibold">
                                        Correct Answer:
                                      </span>{" "}
                                      {correct}
                                    </p>

                                    <p className="text-gray-300 mt-2">
                                      <span className="text-gray-500 font-semibold">
                                        Explanation:
                                      </span>{" "}
                                      {geminiExplaination[index]}
                                    </p>
                                  </li>
                                );
                              }
                              return null;
                            })}
                          </ul>
                        ) : (
                          <p className="text-center text-green-400 text-lg font-medium mt-4">
                            No mistakes found.
                          </p>
                        )}
                      </div>

                      {/*CORRECT ANSWERS SECTION*/}
                      <div>
                        <h2 className="text-2xl font-semibold text-gray-500 text-center my-6">
                          Correct Answers
                        </h2>

                        {geminiAnswers.some(
                          (correct, index) =>
                            userAnswers[index]?.trim() === correct.trim()
                        ) ? (
                          <ul className="space-y-5 max-w-3xl mx-auto px-4">
                            {geminiAnswers.map((correct, index) => {
                              const user = userAnswers[index];
                              if (user && user.trim() === correct.trim()) {
                                return (
                                  <li
                                    key={index}
                                    className="bg-neutral-800 p-5 rounded-2xl shadow-md border border-green-500/30 hover:border-green-400/60 transition-all duration-200"
                                  >
                                    <p className="text-green-400 font-semibold mb-2 flex items-center gap-1">
                                      <FaCheck className="text-xl" /> Question{" "}
                                      {index + 1}
                                    </p>
                                    <p className="text-gray-300">
                                      <span className="text-gray-400 font-semibold">
                                        Your Answer:
                                      </span>{" "}
                                      {user}
                                    </p>
                                    <p className="text-gray-300 mt-2">
                                      <span className="text-gray-400 font-semibold">
                                        Explanation:
                                      </span>{" "}
                                      {geminiExplaination[index]}
                                    </p>
                                  </li>
                                );
                              }
                              return null;
                            })}
                          </ul>
                        ) : (
                          <p className="text-center text-gray-400 text-lg font-medium mt-4">
                            No correct answers found yet.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-10 flex justify-center gap-6">
                    <button
                      onClick={() => setIsQuickQuizVisible(false)}
                      className="group/btn px-6 text-lg relative block border border-gray-700 w-auto p-2 flex justify-center items-center gap-3 rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] cursor-pointer"
                    >
                      Close
                      <BottomGradient />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        </AnimatePresence>
      )}

      {loading && (
        <AnimatePresence>
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] h-[95vh] bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl flex flex-col z-80"
            >
              <div className="flex absolute top-0 justify-center items-center h-screen bg-neutral-900 w-full z-99">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 border-4 border-transparent border-t-gray-500 border-b-gray-500 rounded-full animate-spin"></div>
                  <p className="text-white mt-4 text-lg font-semibold">
                    Generating Questions...
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        </AnimatePresence>
      )}
    </AnimatePresence>
  );
};

export default StudyHub;
