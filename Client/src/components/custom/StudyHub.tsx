import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import axios from "axios";

interface Props {
  setIsStdudyHubVisible: (visible: boolean) => void;
  selectedUnit: string | null;
  selectedSubject: string | null;
}

const StudyHub: React.FC<Props> = ({
  setIsStdudyHubVisible,
  selectedUnit,
  selectedSubject,
}) => {
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState([]);

  const fetchMaterials = async () => {
    setLoading(true);
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

      const materialResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/materials/getMaterials`,
        {
          params: {
            subjectId,
            unitId,
          },
          withCredentials: true,
        }
      );

      setMaterials(materialResponse.data.data);
    } catch (error) {
      console.error("Failed to fetch materials:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
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
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] h-[95vh] overflow-y-auto bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl p-8 flex flex-col z-80"
        >
          <button
            onClick={() => setIsStdudyHubVisible(false)}
            className="absolute right-3 top-3 text-neutral-400 hover:text-white transition-colors p-1 rounded-md hover:bg-neutral-800 cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>

          <h1 className="text-white text-3xl text-center">{selectedUnit}</h1>
          <h2 className="text-xl font-semibold text-gray-500 mb-6 text-center">
            Study Materials
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-neutral-800 border border-neutral-700 p-5 rounded-xl shadow-md animate-pulse"
                >
                  <div className="h-6 bg-neutral-700 rounded w-3/4 mb-3" />
                  <div className="h-4 bg-neutral-700 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-neutral-700 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-neutral-700 rounded w-2/3 mb-4" />
                  <div className="h-4 bg-neutral-800 rounded w-1/4 mt-4" />
                </div>
              ))
            ) : materials.length > 0 ? (
              materials.map((material) => (
                <motion.a
                  key={material._id}
                  href={material.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  className="bg-neutral-800 border border-neutral-700 p-5 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between hover:border-gray-500"
                >
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {material.title}
                    </h3>

                    <p className="text-sm text-gray-400 mb-1">
                      Subject: {material.subject?.name || "N/A"}
                    </p>

                    <p className="text-sm text-gray-400 mb-1">
                      Unit: {material.unit?.name || "N/A"}
                    </p>

                    <p className="text-sm text-gray-500">
                      Uploaded by: {material.uploadedBy?.name || "Unknown"}
                    </p>
                  </div>

                  <div className="mt-3 text-orange-400 text-sm">
                    Open Material →
                  </div>
                </motion.a>
              ))
            ) : (
              <p className="text-gray-400 col-span-full text-center">
                No materials available for this unit.
              </p>
            )}
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
    </AnimatePresence>
  );
};

export default StudyHub;
