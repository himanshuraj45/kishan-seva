"use client";

import { useState } from "react";
import { Play, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FloatingDemoVideo() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button Bottom Left */}
      <div className="fixed bottom-6 left-6 z-[60] font-sans">
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-[#166534] hover:bg-[#14532d] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group"
        >
          <Play size={24} className="ml-1" />
          
          {/* Tooltip */}
          <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-white text-gray-800 text-sm font-semibold py-2 px-3 rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-gray-100">
            Watch Video
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-white rotate-45 border-l border-b border-gray-100"></div>
          </div>
        </button>
      </div>

      {/* Video Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
              className="bg-black w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl relative border border-white/10"
              onClick={(e) => e.stopPropagation()} // prevent closing when clicking video
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-md transition-colors"
              >
                <X size={20} />
              </button>
              
              {/* Local Demo Video Player */}
              <video 
                src="/demo-video.mp4" 
                controls 
                autoPlay 
                className="w-full h-full object-cover"
                style={{ maxHeight: '80vh' }}
              >
                Your browser does not support the video tag.
              </video>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
