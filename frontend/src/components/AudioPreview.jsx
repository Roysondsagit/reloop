import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, X, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const AudioPreview = ({ audioUrl, duration, onClear }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  // Toggle Play
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Update Progress Bar
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration || 1;
      setProgress((current / total) * 100);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  // Generate "Fake" Frequency Bars
  const bars = Array.from({ length: 12 }).map((_, i) => (
    <motion.div
      key={i}
      className={`w-1 rounded-full ${isPlaying ? 'bg-green-400' : 'bg-slate-500'}`}
      initial={{ height: 4 }}
      animate={{ 
        height: isPlaying ? [8, 16, 6, 12, 4][i % 5] : 4, // Dance effect
        opacity: isPlaying ? 1 : 0.5 
      }}
      transition={{ 
        duration: 0.5, 
        repeat: isPlaying ? Infinity : 0, 
        repeatType: "reverse",
        delay: i * 0.05 
      }}
    />
  ));

  return (
    <motion.div 
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: "auto", opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      className="flex items-center gap-3 bg-black/60 backdrop-blur-md rounded-full border border-green-500/30 pl-1 pr-3 py-1 ml-2 overflow-hidden h-12"
    >
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        onTimeUpdate={handleTimeUpdate} 
        onEnded={handleEnded} 
        className="hidden" 
      />

      {/* Play/Pause Button */}
      <button 
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-black hover:bg-green-400 transition-colors flex-shrink-0"
      >
        {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
      </button>

      {/* Visualizer & Progress */}
      <div className="flex items-center gap-1 h-full min-w-[60px]">
        {bars}
      </div>

      {/* Close Button */}
      <button 
        onClick={onClear}
        className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};