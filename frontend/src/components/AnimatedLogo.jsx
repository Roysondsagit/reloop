import React from 'react';
import { motion } from 'framer-motion';

export const AnimatedLogo = () => {
  return (
    <div className="relative w-10 h-10 flex items-center justify-center">
      
      {/* 1. THE TURBINE (Spinning Blades) */}
      <motion.svg
        viewBox="0 0 100 100"
        className="w-full h-full absolute inset-0 text-green-500 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      >
        <defs>
          <linearGradient id="bladeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Blade 1 */}
        <path d="M50 15 L58 35 A 15 15 0 0 1 42 35 Z" fill="url(#bladeGrad)" transform="translate(0, -5)" />
        {/* Blade 2 */}
        <path d="M50 15 L58 35 A 15 15 0 0 1 42 35 Z" fill="url(#bladeGrad)" transform="rotate(120 50 50) translate(0, -5)" />
        {/* Blade 3 */}
        <path d="M50 15 L58 35 A 15 15 0 0 1 42 35 Z" fill="url(#bladeGrad)" transform="rotate(240 50 50) translate(0, -5)" />
        
        {/* Outer Ring Segments */}
        <path d="M50 5 A 45 45 0 0 1 85 25" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        <path d="M50 5 A 45 45 0 0 1 85 25" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" opacity="0.6" transform="rotate(120 50 50)" />
        <path d="M50 5 A 45 45 0 0 1 85 25" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" opacity="0.6" transform="rotate(240 50 50)" />
      </motion.svg>

      {/* 2. THE REACTOR CORE (Pulsing Center) */}
      <motion.div
        className="w-3 h-3 bg-white rounded-full z-10 shadow-[0_0_15px_#ffffff]"
        animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* 3. ENERGY FIELD (Faint glow behind) */}
      <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full animate-pulse" />
    </div>
  );
};