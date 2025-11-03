import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

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
  setIsStdudyHubVisible: (visible: boolean) => void;
  selectedUnit: Unit | null;
}

const StudyHub: React.FC<Props> = ({ setIsStdudyHubVisible, selectedUnit }) => {
  const [loading, setLoading] = useState(true);

  const sampleMaterials: Material[] = [
    {
      _id: "1",
      title: "Introduction to AI",
      fileUrl: "https://example.com/ai_intro.pdf",
      uploadedBy: "John Doe",
      subject: "Artificial Intelligence",
      unit: "Unit 1",
      approved: true,
    },
    {
      _id: "2",
      title: "Machine Learning Basics",
      fileUrl: "https://example.com/ml_basics.pdf",
      uploadedBy: "Alice Smith",
      subject: "Machine Learning",
      unit: "Unit 2",
      approved: true,
    },
    {
      _id: "3",
      title: "Neural Networks Notes",
      fileUrl: "https://example.com/neural_networks.pdf",
      uploadedBy: "Bob Kumar",
      subject: "Deep Learning",
      unit: "Unit 3",
      approved: true,
    },
  ];

  // Simulate loading time
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
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

          <h1 className="text-white text-3xl text-center">{selectedUnit?.title}</h1>
          <h2 className="text-xl font-semibold text-gray-500 mb-6 text-center">
            Study Materials
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading
              ? 
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
              : 
                sampleMaterials.map((material) => (
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
                        Subject: {material.subject}
                      </p>
                      <p className="text-sm text-gray-400 mb-1">
                        Unit: {material.unit}
                      </p>
                      <p className="text-sm text-gray-500">
                        Uploaded by: {material.uploadedBy}
                      </p>
                    </div>
                    <div className="mt-3 text-orange-400 text-sm">
                      Open Material →
                    </div>
                  </motion.a>
                ))}
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
