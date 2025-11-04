import React, { useEffect, useState } from "react";
import { X, RefreshCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BottomGradient from "../ui/buttonGradient";
import axios from "axios";
import { RxArrowTopRight } from "react-icons/rx";

interface Unit {
  _id: string;
  title: string;
  description: string;
}
interface props {
  setIsVisualVaultVisible: (visible: boolean) => void;
  selectedUnit: Unit | null;
}

const VisualVault: React.FC<props> = ({
  setIsVisualVaultVisible,
  selectedUnit,
}) => {
  const keywords = [selectedUnit?.title || "Data Structure"];
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentKeyword = keywords[0];
  const udemyUrl = `https://www.udemy.com/courses/search/?src=ukw&q=${encodeURIComponent(
    currentKeyword
  )}`;
  const courseraUrl = `https://www.coursera.org/search?query=${encodeURIComponent(
    currentKeyword
  )}`;
  const linkedInUrl = `https://www.linkedin.com/learning/search?keywords=${encodeURIComponent(
    currentKeyword
  )}`;

  const fetchVideos = async () => {
    if (!currentKeyword) return;

    setLoading(true);
    try {
      const API_KEY = import.meta.env.VITE_GOOGLE_CLOUD_API_KEY;
      const query = "Educational videos related to" + keywords.join(" ");

      const response = await axios.get(
        "https://www.googleapis.com/youtube/v3/search",
        {
          params: {
            part: "snippet",
            q: query,
            type: "video",
            maxResults: 9,
            key: API_KEY,
            safeSearch: "strict",
          },
        }
      );

      const videoItems = response.data.items.filter((item) => item.id.videoId);
      setVideos(videoItems);
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setLoading(false);
    }
  };
  const SkeletonGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-center items-center w-full">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="bg-neutral-800 rounded-lg overflow-hidden animate-pulse"
        >
          <div className="h-48 bg-neutral-700"></div>
          <div className="p-4 space-y-2">
            <div className="h-4 bg-neutral-700 rounded w-3/4"></div>
            <div className="h-3 bg-neutral-700 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  );
  useEffect(() => {
    fetchVideos();
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

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed flex-col  left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] h-[95vh] overflow-y-auto bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl flex justify-center items-center z-80"
        >
          <button
            onClick={() => setIsVisualVaultVisible(false)}
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
          <h2 className="text-2xl font-bold mb-4 text-gray-500">
            Keywords:{" "}
            <span className="text-gray-300">{keywords.join(", ")}</span>
          </h2>
          <div className="flex flex-wrap gap-4">
            <button
              className="group/btn relative h-10 w-auto p-3 flex justify-center items-center gap-3 rounded-md bg-gradient-to-br from-black border border-gray-700  to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] my-4 cursor-pointer"
              onClick={fetchVideos}
              disabled={loading}
            >
              <RefreshCcw className="w-5 h-5" />
              {loading ? "Fetching..." : "Refresh"}
              <BottomGradient />
            </button>
            <a
              href={udemyUrl}
              target="_blank"
              className="group/btn relative h-10 w-auto p-3 flex justify-center items-center gap-3 rounded-md bg-gradient-to-br from-black border border-gray-700 to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] my-4 cursor-pointer"
            >
              Udemy
              <RxArrowTopRight className="w-5 h-5" />
              <BottomGradient />
            </a>
            <a
              href={courseraUrl}
              target="_blank"
              className="group/btn relative h-10 w-auto p-3 flex justify-center items-center gap-3 rounded-md bg-gradient-to-br from-black border border-gray-700 to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] my-4 cursor-pointer"
            >
              Coursera
              <RxArrowTopRight className="w-5 h-5" />
              <BottomGradient />
            </a>
            <a
              href={linkedInUrl}
              target="_blank"
              className="group/btn relative h-10 w-auto p-3 flex justify-center items-center gap-3 rounded-md bg-gradient-to-br from-black border border-gray-700 to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] my-4 cursor-pointer"
            >
              LinkedIn 
              <RxArrowTopRight className="w-5 h-5" />
              <BottomGradient />
            </a>
          </div>
          <div className="max-w-7xl w-full overflow-y-auto p-4 flex flex-col justify-center items-center gap-2">
            <div className="w-full mx-auto">
              {videos.length === 0 && !loading && (
                <p className="text-gray-600 mb-4">No videos found yet.</p>
              )}

              {loading ? (
                <SkeletonGrid />
              ) : (
                <div className="grid grid-cols-1 h-[70vh] sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videos.map((video) => {
                    return (
                      <a
                        href={`https://www.youtube.com/watch?v=${video.id.videoId}`}
                        target="_blank"
                        key={video.id.videoId}
                        className="group bg-neutral-900 text-white rounded-xl shadow-lg border border-neutral-800 
             hover:-translate-y-2 hover:shadow-2xl hover:border-gray-600/50 
             transition-all duration-300 ease-out"
                      >
                        <div
                          rel="noopener noreferrer"
                          className="block overflow-hidden rounded-t-xl"
                        >
                          <img
                            src={video.snippet.thumbnails.medium.url}
                            alt={video.snippet.title}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                          />
                        </div>
                        <div className="p-4">
                          <div rel="noopener noreferrer" className="block">
                            <p className="font-semibold text-white group-hover:text-orange-400 transition-colors duration-300">
                              {video.snippet.title}
                            </p>
                          </div>
                          <p className="text-gray-400 text-sm mt-1">
                            {video.snippet.channelTitle}
                          </p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
};

export default VisualVault;
