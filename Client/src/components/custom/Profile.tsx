import { useEffect, useState, useRef } from "react";
import { cn } from "../../../lib/utils";
import Sidebar from "./Navbar";
import { FileText, Edit2, Plus, Save } from "lucide-react";
import BottomGradient from "../ui/buttonGradient";
import { useAuth } from "../../context/AuthContext";
import GlassLoader from "../ui/loading.tsx";
import { IconCancel } from "@tabler/icons-react";
import axios from "axios";

interface Contributions {
  notesUploaded: string[];
  questionsAnswered: string[];
}

interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: "student" | "professor" | "admin";
  profileImage: string;
  branch: string;
  semester: number;
  points: number;
  contributions: Contributions;
  subjectsHandled: string[];
  createdAt: string;
  token: string;
}

const Profile = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [userRole, setUserRole] = useState("student");
  const { checkUser } = useAuth();
  const [userDetails, setUserDetails] = useState<UserInfo | null>(null);
  const [isLoading, setIsloading] = useState(false);
  const [editProfile, setEdiProfile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditProfileDetails((prev) => ({
      ...prev,
      [name]: name === "semester" ? Number(value) : value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEditProfileDetails((prev) => ({
      ...prev,
      profileImage: file,
      profilePreview: URL.createObjectURL(file),
    }));
    console.log(editProfileDetails.profileImage);
  };

  const [editProfileDetails, setEditProfileDetails] = useState({
    profileImage: null as File | null, // actual file
    profilePreview: null as string | null, // preview URL
    name: "",
    email: "",
    branch: "",
    semester: userDetails?.semester,
  });
  useEffect(() => {
    if (userDetails) {
      setEditProfileDetails({
        profileImage: null,
        profilePreview: null,
        name: userDetails?.name || "",
        email: userDetails?.email || "",
        branch: userDetails?.branch || "",
        semester: userDetails?.semester,
      });
    }
  }, [userDetails]);

  const formatJoinedDate = (dateString?: string) => {
    if (!dateString) return "Joined on —";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const fetchUserDetails = async () => {
    setIsloading(true);
    try {
      const storedUser = localStorage.getItem("userInfo");

      if (!storedUser) {
        console.warn("No user info found in localStorage");
        return;
      }

      const parsedUser = JSON.parse(storedUser);

      setUserDetails(parsedUser);
      setUserRole(parsedUser.role);
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setIsloading(false);
    }
  };

  useEffect(() => {
    checkUser("profile");
    fetchUserDetails();
  }, []);

  const userData = {
    student: {
      name: "Suraj S G Dhanva",
      email: "surajdhanva@university.edu",
      role: "Student",
      profileImage: "suraj.jpg",
      branch: "Computer Science",
      semester: "6th Semester",
      points: 1250,
      maxPoints: 2000,
      notesUploaded: [
        {
          id: 1,
          title: "Data Structures Notes",
          subject: "DSA",
          date: "2025-10-15",
          downloads: 45,
        },
        {
          id: 2,
          title: "Algorithm Analysis",
          subject: "DSA",
          date: "2025-10-10",
          downloads: 32,
        },
        {
          id: 3,
          title: "Database Normalization",
          subject: "DBMS",
          date: "2025-10-05",
          downloads: 28,
        },
      ],
      questionsAnswered: [
        {
          id: 1,
          question: "How to implement binary search tree?",
          upvotes: 23,
          date: "2025-10-20",
        },
        {
          id: 2,
          question: "Explain ACID properties",
          upvotes: 18,
          date: "2025-10-18",
        },
        {
          id: 3,
          question: "What is time complexity?",
          upvotes: 31,
          date: "2025-10-12",
        },
      ],
    },
    professor: {
      name: "Dr. Sarah Williams",
      email: "sarah.williams@university.edu",
      role: "Professor",
      profileImage: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      department: "Computer Science & Engineering",
      subjectsHandled: ["Data Structures", "Algorithms", "Machine Learning"],
      announcements: [
        {
          id: 1,
          title: "Mid-term Exam Schedule",
          message:
            "Mid-term exams will be conducted from Nov 5-10. Please prepare accordingly.",
          semester: "6th Semester",
          subject: "Data Structures",
          date: "2025-10-25",
        },
        {
          id: 2,
          title: "Project Submission Deadline",
          message:
            "Final project submissions due by November 15th. Late submissions will not be accepted.",
          semester: "6th Semester",
          subject: "Algorithms",
          date: "2025-10-22",
        },
        {
          id: 3,
          title: "Guest Lecture on AI",
          message:
            "Special guest lecture on AI trends this Friday at 2 PM in Hall A.",
          semester: "All",
          subject: "Machine Learning",
          date: "2025-10-20",
        },
      ],
    },
  };

  const handleEditProfile = async () => {
    try {
      let uploadedImageUrl = "";

      if (
        editProfileDetails.profileImage &&
        editProfileDetails.profileImage !== userDetails?.profileImage
      ) {
        console.log("Hello");

        const formData = new FormData();
        formData.append("file", editProfileDetails.profileImage);
        formData.append(
          "upload_preset",
          import.meta.env.VITE_CLOUD_PRESET_NAME
        );
        formData.append("cloud_name", import.meta.env.VITE_CLOUD_NAME);

        const response = await axios.post(
          `https://api.cloudinary.com/v1_1/${
            import.meta.env.VITE_CLOUD_NAME
          }/image/upload`,
          formData
        );
        uploadedImageUrl = response.data.secure_url as string;
        setUserDetails((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            profileImage: uploadedImageUrl,
          };
        });
      }

      const payload = {
        name: editProfileDetails.name || userDetails?.name,
        email: editProfileDetails.email || userDetails?.email,
        branch: editProfileDetails.branch || userDetails?.branch,
        semester: editProfileDetails.semester ?? userDetails?.semester,
        profileImage: uploadedImageUrl || userDetails?.profileImage,
      };

      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/user/update-profile`,
        payload,
        {
          headers: {
            authorization: `Bearer ${userDetails?.token}`,
          },
          withCredentials: true,
        }
      );
      const existingUser = JSON.parse(localStorage.getItem("userInfo") || "{}");

      const updatedUser = {
        ...response.data.user,
        token: existingUser.token,
      };

      // Update local storage & state
      localStorage.setItem("userInfo", JSON.stringify(updatedUser));
      setUserDetails(updatedUser);

      console.log(response.data);

      setEdiProfile(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const currentUser = userData[userRole];

  return (
    <div
      className={cn(
        "mx-auto fixed flex w-full flex-1 flex-col border border-neutral-200 bg-gray-100 md:flex-row dark:border-neutral-700 dark:bg-black h-screen text-white"
      )}
    >
      {editProfile && (
        <>
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Glass Background */}
            <div
              className="absolute inset-0 bg-white/10 backdrop-blur-md"
              onClick={() => setEdiProfile(false)}
            />

            {/* Modal */}
            <div className="relative z-10 w-[90%] max-w-md rounded-2xl bg-black border border-white/20 p-6 shadow-xl text-white">
              <h2 className="text-lg font-semibold mb-4">Edit Profile</h2>

              {/* Profile Picture */}
              <div className="flex items-center gap-4 mb-4">
                <div className="h-16 w-16 rounded-full bg-white/20 overflow-hidden">
                  {editProfileDetails.profilePreview ? (
                    <img
                      src={editProfileDetails.profilePreview}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={String(userDetails?.profileImage)}
                      alt={userDetails?.name}
                      className="flex h-full w-full items-center justify-center text-xs text-white/60"
                    />
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-blue-400 hover:underline"
                >
                  Change Profile Picture
                </button>
              </div>

              {/* Name */}
              <div className="mb-3">
                <label className="text-xs text-white/60">Name</label>
                <input
                  name="name"
                  value={editProfileDetails.name}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md bg-white/10 px-3 py-2 text-sm outline-none border border-white/20 focus:border-blue-400"
                />
              </div>

              {/* Email */}
              <div className="mb-3">
                <label className="text-xs text-white/60">Email</label>
                <input
                  name="email"
                  value={editProfileDetails.email}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md bg-white/10 px-3 py-2 text-sm outline-none border border-white/20 focus:border-blue-400"
                />
              </div>

              {/* Branch */}
              <div className="mb-3">
                <label className="text-xs text-white/60">Branch</label>
                <input
                  name="branch"
                  value={editProfileDetails.branch}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md bg-white/10 px-3 py-2 text-sm outline-none border border-white/20 focus:border-blue-400 cursor-pointer"
                />
              </div>

              {/* Semester */}
              <div className="mb-4">
                <label className="text-xs text-white/60">Semester</label>
                <input
                  type="number"
                  name="semester"
                  min={1}
                  max={8}
                  value={editProfileDetails.semester}
                  onChange={handleChange}
                  className="mt-1 w-full rounded-md bg-white/10 px-3 py-2 text-sm outline-none border border-white/20 focus:border-blue-400"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  className="group/btn relative h-10 flex justify-center items-center gap-2 w-auto px-1 rounded-md bg-gray-600 font-medium border border-zinc-700 text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] cursor-pointer"
                  onClick={() => {
                    setEdiProfile(false);
                  }}
                >
                  <IconCancel />
                  Cancel
                  <BottomGradient />
                </button>
                <button
                  className="group/btn relative h-10 flex justify-center items-center gap-2 w-auto px-1 rounded-md bg-black font-medium border border-zinc-700 text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] cursor-pointer"
                  onClick={handleEditProfile}
                >
                  <Save />
                  Save Changes
                  <BottomGradient />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      {isLoading ? <GlassLoader destination={"Profile"} /> : <></>}
      <style>
        {`
          ::-webkit-scrollbar {
            width: 0px;
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

      <div className="max-w-7xl mx-auto p-6 w-screen overflow-y-auto">
        {/* Profile Header */}
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-3xl blur-3xl"></div>
          <div className="relative bg-neutral-900 backdrop-blur-xl rounded-3xl p-8 border border-gray-800/50 shadow-2xl">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative group">
                <div className="absolute inset-0  rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                <img
                  src={String(userDetails?.profileImage)}
                  alt={userDetails?.name}
                  className="relative w-36 h-36 rounded-full border-4 border-gray-800 shadow-xl"
                />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl py-2 font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {userDetails?.name}
                </h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                  <div className="flex items-center gap-2 text-gray-400">
                    <span>{userDetails?.email}</span>
                  </div>
                  <span className="px-4 py-1 rounded-full text-sm font-medium bg-amber-600/20 text-amber-400 border border-amber-600/30">
                    {userDetails?.role
                      ? userDetails.role[0].toUpperCase() +
                        userDetails.role.slice(1)
                      : "User"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                  <span>
                    Joined on {formatJoinedDate(userDetails?.createdAt)}
                  </span>
                </div>
              </div>
              <button
                className="group/btn relative h-10 flex justify-center items-center gap-2 w-auto px-3 rounded-md bg-black font-medium border border-zinc-700 text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] my-4 cursor-pointer"
                onClick={() => {
                  setEdiProfile(true);
                }}
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
                <BottomGradient />
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-neutral-900 backdrop-blur-xl rounded-2xl p-2 border border-gray-800/50">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-black text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-gray-800/50"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() =>
              setActiveTab(
                userRole === "student" ? "contributions" : "announcements"
              )
            }
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all cursor-pointer ${
              activeTab ===
              (userRole === "student" ? "contributions" : "announcements")
                ? "bg-black text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-gray-800/50"
            }`}
          >
            {userRole === "student" ? "Contributions" : "Announcements"}
          </button>
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userRole === "student" && (
                <>
                  <div className="bg-neutral-900 backdrop-blur-xl rounded-2xl p-6 border border-gray-800/50 hover:border-zinc-700 transition-all">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      Academic Info
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Branch:</span>
                        <span className="font-medium">
                          {userDetails?.branch
                            ? String(userDetails?.branch)
                            : "Branch"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Semester:</span>
                        <span className="font-medium">
                          {String(userDetails?.semester)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Total Points:</span>
                        <span className="font-medium text-orange-400">
                          {String(userDetails?.points)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-neutral-900  backdrop-blur-xl rounded-2xl p-6 border border-gray-800/50 hover:border-zinc-700 transition-all">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      Quick Stats
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Notes Uploaded:</span>
                        <span className="font-medium">
                          {String(
                            userDetails?.contributions?.notesUploaded?.length
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">
                          Questions Answered:
                        </span>
                        <span className="font-medium">
                          {userDetails?.contributions?.questionsAnswered.length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Total Upvotes:</span>
                        <span className="font-medium text-orange-400">
                          {currentUser.questionsAnswered.reduce(
                            (sum, q) => sum + q.upvotes,
                            0
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {userRole === "professor" && (
                <>
                  <div className="bg-neutral-900  backdrop-blur-xl rounded-2xl p-6 border border-gray-800/50 hover:border-zinc-700 transition-all">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      Department Info
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Department:</span>
                        <span className="font-medium">
                          {userDetails?.department}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Total Subjects:</span>
                        <span className="font-medium">
                          {userDetails?.subjectsHandled?.length}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-neutral-900 backdrop-blur-xl rounded-2xl p-6 border border-gray-800/50 hover:border-zinc-700 transition-all">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      Subjects Handled
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {currentUser.subjectsHandled.map((subject, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-lg text-sm border border-gray-600"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "contributions" && userRole === "student" && (
            <div className="space-y-6">
              <div className="bg-neutral-900 backdrop-blur-xl rounded-2xl p-6 border border-gray-800/50">
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  Notes Uploaded
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentUser.notesUploaded.map((note) => (
                    <div
                      key={note.id}
                      className="group bg-black rounded-xl p-4 border border-gray-700/50 hover:border-zinc-700 transition-all hover:shadow-lg"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="p-2  rounded-lg">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold transition-colors">
                            {note.title}
                          </h4>
                          <p className="text-sm text-gray-400">
                            {note.subject}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">{note.date}</span>
                        <span className="text-orange-400">
                          {note.downloads} downloads
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-neutral-900 backdrop-blur-xl rounded-2xl p-6 border border-gray-800/50">
                <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  Questions Answered
                </h3>
                <div className="space-y-4">
                  {currentUser.questionsAnswered.map((qa) => (
                    <div
                      key={qa.id}
                      className="bg-black rounded-xl p-4 border border-gray-700/50 transition-all hover:border-zinc-700"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <p className="flex-1 font-medium">{qa.question}</p>
                        <div className="flex items-center gap-2 text-orange-400">
                          <span className="font-semibold">{qa.upvotes}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">{qa.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "announcements" && userRole === "professor" && (
            <div>
              <div className="bg-neutral-900 backdrop-blur-xl rounded-2xl p-6 border border-gray-800/50">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-semibold flex items-center gap-2">
                    Announcements
                  </h3>
                  <button className="group/btn relative h-10 flex justify-center items-center gap-2 w-auto px-3 rounded-md bg-black font-medium border border-zinc-700 text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] cursor-pointer">
                    <Plus className="w-4 h-4" />
                    New Announcement
                    <BottomGradient />
                  </button>
                </div>
                <div className="space-y-4">
                  {currentUser.announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="bg-black rounded-xl p-5 border border-gray-700/50 hover:border-zinc-700 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-xl font-semibold">
                          {announcement.title}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {announcement.date}
                        </span>
                      </div>
                      <p className="text-gray-300 mb-4">
                        {announcement.message}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 rounded-lg text-sm border border-gray-700">
                          {announcement.semester}
                        </span>
                        <span className="px-3 py-1 rounded-lg text-sm border border-gray-700">
                          {announcement.subject}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
