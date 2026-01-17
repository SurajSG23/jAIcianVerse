import React, { useState } from "react";
import {
  ChevronLeft,
  GraduationCap,
  BookOpen,
  Mail,
  Lock,
  BookMarked,
  Calendar,
  User,
  Building,
} from "lucide-react";
import { RxCross2 } from "react-icons/rx";
import BottomGradient from "../ui/buttonGradient";
import axios, { AxiosError } from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext.jsx";
import Branches from "../../data/allBranches.ts";

interface props {
  setGetStarted: React.Dispatch<React.SetStateAction<boolean>>;
}

const AuthCarousel: React.FC<props> = ({ setGetStarted }) => {
  // Hooks & State
  const { checkUser } = useAuth();

  const [step, setStep] = useState(0);
  const [userType, setUserType] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    branch: "",
    semester: "",
    subjects: "",
    name: "",
    department: "",
  });

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectInput, setSubjectInput] = useState("");

  const [registerLoading, setRegisterLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Step Handlers
  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleUserTypeSelect = (type: string) => {
    setUserType(type);
    setStep(2);
  };

  // Form Handlers
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addSubject = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && subjectInput.trim()) {
      e.preventDefault();
      setSubjects([...subjects, subjectInput.trim()]);
      setSubjectInput("");
    }
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  // Auth Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/user/login`,
        loginData,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      if (res.status === 200) {
        localStorage.setItem("userInfo", JSON.stringify(res.data.user));
        checkUser("homepage");
      }
    } catch (error) {
      toast.error("Login failed: Invalid credentials");
      const axiosError = error as AxiosError;
      console.error(
        "Login failed:",
        (axiosError.response?.data as any)?.message || axiosError.message
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterLoading(true);

    if (
      (userType === "student" && Number(formData?.semester) < 1) ||
      Number(formData?.semester) > 8
    ) {
      toast.error("Semester must be between 1 and 8.");
      setRegisterLoading(false);
      return;
    }

    if (formData?.branch && !Branches.includes(formData?.branch)) {
      toast.error("Please select from the suggested branches.");
      setRegisterLoading(false);
      return;
    }

    if (formData?.department && !Branches.includes(formData?.department)) {
      toast.error("Please select from the suggested branches.");
      setRegisterLoading(false);
      return;
    }

    const payload = {
      userType,
      ...formData,
    };

    try {
      const result = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/user/signup`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      toast.success("Signup success: Please login");
      setStep(0);
      console.log("Signup success:", result.data);
    } catch (error) {
      console.error("Signup error:", error);
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="fixed flex flex-col items-center justify-center min-h-full backdrop-blur-2xl z-99 w-full">
      <div className="relative w-full max-w-md mx-auto p-8 rounded-2xl bg-black border border-white/10 shadow-xl overflow-hidden">
        <RxCross2
          className="text-3xl absolute right-4 top-4 hover:cursor-pointer hover:text-gray-600 duration-100"
          onClick={() => setGetStarted(false)}
        />
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-8 bg-orange-500" : "w-1.5 bg-white/20"
              }`}
            />
          ))}
        </div>

        {/* Carousel content */}
        <div className="relative min-h-[400px]">
          {/* Step 0: Sign In */}
          <div
            className={`absolute inset-0 transition-all duration-120 ${
              step === 0
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-full pointer-events-none"
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="shadow-input mx-auto w-full max-w-md rounded-none bg-white md:rounded-2xl dark:bg-black">
                <form className="my-6 space-y-6" onSubmit={handleLogin}>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="email"
                      placeholder="Email"
                      value={loginData.email}
                      onChange={(e) =>
                        setLoginData({ ...loginData, email: e.target.value })
                      }
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-orange-500/50 focus:bg-white/10 transition-all duration-300"
                      required
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="password"
                      placeholder="Set a Password"
                      value={loginData.password}
                      onChange={(e) =>
                        setLoginData({ ...loginData, password: e.target.value })
                      }
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-orange-500/50 focus:bg-white/10 transition-all duration-300"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loginLoading}
                    className={`group/btn relative flex h-10 w-full items-center justify-center
    rounded-md bg-gradient-to-br from-black to-neutral-600
    font-medium text-white
    shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset]
    dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900
    dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]
    transition-all
    ${
      loginLoading
        ? "cursor-not-allowed pointer-events-none opacity-80"
        : "cursor-pointer"
    }
  `}
                  >
                    {loginLoading ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>Sign in &rarr;</>
                    )}

                    <BottomGradient />
                  </button>

                  <div className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />
                </form>
                <div>
                  <p>
                    Not Register yet?{" "}
                    <button
                      className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] my-4 cursor-pointer"
                      onClick={handleNext}
                    >
                      Sign Up &rarr;
                      <BottomGradient />
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 1: User Type Selection */}
          <div
            className={`absolute inset-0 transition-all duration-120 ${
              step === 1
                ? "opacity-100 translate-x-0"
                : step < 1
                ? "opacity-0 translate-x-full pointer-events-none"
                : "opacity-0 -translate-x-full pointer-events-none"
            }`}
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <h2 className="text-2xl font-bold text-white">I am a...</h2>
              <div className="w-full space-y-4 mt-8">
                <button
                  onClick={() => handleUserTypeSelect("student")}
                  className="w-full p-6 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/50 hover:bg-white/10 transition-all duration-120 group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full border-1 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <GraduationCap className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-semibold text-white">
                        Student
                      </h3>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleUserTypeSelect("professor")}
                  className="w-full p-6 rounded-xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all duration-120 group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full border-1 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <BookOpen className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-xl font-semibold text-white">
                        Professor
                      </h3>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Step 2: Student Form */}
          <form
            onSubmit={handleSignup}
            className={`absolute inset-0 transition-all duration-120 ${
              step === 2 && userType === "student"
                ? "opacity-100 translate-x-0"
                : step < 2
                ? "opacity-0 translate-x-full pointer-events-none"
                : "opacity-0 -translate-x-full pointer-events-none"
            }`}
          >
            <div className="flex flex-col space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-white">
                  Student Details
                </h2>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300"
                    required
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300"
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="password"
                    placeholder="Set a Password"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300"
                    required
                  />
                </div>

                <div className="relative">
                  <BookMarked className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="text"
                    placeholder="Branch (e.g., Computer Science)"
                    value={formData.branch}
                    list="branches"
                    onChange={(e) =>
                      handleInputChange("branch", e.target.value)
                    }
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300"
                    required
                  />
                  <datalist id="branches">
                    {Branches.map((branch) => (
                      <option key={branch} value={branch} />
                    ))}
                  </datalist>
                </div>

                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="number"
                    min={1}
                    max={8}
                    placeholder="Semester"
                    value={formData.semester}
                    onChange={(e) =>
                      handleInputChange("semester", e.target.value)
                    }
                    list="semesters"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300"
                    required
                  />
                </div>
                <datalist id="semesters">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem} />
                  ))}
                </datalist>
              </div>
              <button
                type="submit"
                disabled={registerLoading}
                className={`group/btn relative block h-10 w-full rounded-md
    bg-gradient-to-br from-black to-neutral-600
    font-medium text-white
    shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset]
    dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900
    dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]
    transition-all
    ${
      registerLoading
        ? "cursor-not-allowed pointer-events-none opacity-80"
        : "cursor-pointer"
    }
  `}
              >
                {registerLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span className="text-sm">Processing</span>
                  </div>
                ) : (
                  "Complete Registration"
                )}

                <BottomGradient />
              </button>
            </div>
          </form>

          {/* Step 2: Professor Form */}
          <form
            onSubmit={handleSignup}
            className={`absolute inset-0 transition-all duration-120 ${
              step === 2 && userType === "professor"
                ? "opacity-100 translate-x-0"
                : step < 2
                ? "opacity-0 translate-x-full pointer-events-none"
                : "opacity-0 -translate-x-full pointer-events-none"
            }`}
          >
            <div className="flex flex-col space-y-2">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-white">
                  Professor Details
                </h2>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all duration-300"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all duration-300"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="password"
                    placeholder="Set a Password"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all duration-300"
                  />
                </div>

                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                  <input
                    type="string"
                    placeholder="Daprtment"
                    value={formData.department}
                    onChange={(e) =>
                      handleInputChange("department", e.target.value)
                    }
                    list="branches"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all duration-300"
                  />
                  <datalist id="branches">
                    {Branches.map((branch) => (
                      <option key={branch} value={branch} />
                    ))}
                  </datalist>
                </div>

                <div className="relative">
                  <BookOpen className="absolute left-4 top-4 w-5 h-5 text-white/40" />

                  <div className="pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus-within:border-purple-500/50 focus-within:bg-white/10 transition-all duration-300">
                    {subjects.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {subjects.map((subj, index) => (
                          <span
                            key={index}
                            className="flex items-center gap-2 px-3 py-1 text-sm bg-purple-600/30 rounded-full text-white"
                          >
                            {subj}
                            <button
                              type="button"
                              onClick={() => removeSubject(index)}
                              className="text-white/60 hover:text-white cursor-pointer hover:scale-120 duration-110"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <input
                      type="text"
                      placeholder="Type subject you handle and press Enter"
                      value={subjectInput}
                      onChange={(e) => setSubjectInput(e.target.value)}
                      onKeyDown={addSubject}
                      className="w-full bg-transparent outline-none text-white placeholder:text-white/40"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={registerLoading}
                className={`group/btn relative block h-10 w-full rounded-md
    bg-gradient-to-br from-black to-neutral-600
    font-medium text-white
    shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset]
    dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900
    dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]
    transition-all
    ${
      registerLoading
        ? "cursor-not-allowed pointer-events-none opacity-80"
        : "cursor-pointer"
    }
  `}
              >
                {registerLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span className="text-sm">Processing</span>
                  </div>
                ) : (
                  "Complete Registration"
                )}

                <BottomGradient />
              </button>
            </div>
          </form>
        </div>

        {/* Back button */}
        {step > 0 && step < 2 && (
          <button
            onClick={handleBack}
            className="absolute top-8 left-8 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all duration-300 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}

        {step === 2 && (
          <button
            onClick={() => {
              setFormData({
                email: "",
                password: "",
                branch: "",
                semester: "",
                subjects: "",
                name: "",
                department: "",
              });
              setStep(1);
            }}
            className="absolute top-8 left-8 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all duration-300 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthCarousel;
