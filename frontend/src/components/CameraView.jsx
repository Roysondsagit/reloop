import React, { useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import { ArrowLeft, Camera, UploadCloud } from 'lucide-react';
import { motion } from 'framer-motion';

const videoConstraints = {
  facingMode: "environment",
  aspectRatio: 16/9,
};

export const CameraView = ({ onCapture, initialMode = "camera", onBackToLanding }) => {
  const webcamRef = useRef(null);
  const [flash, setFlash] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // OPTIMIZED CAPTURE LOGIC
  const capture = useCallback((e) => {
    // 1. Prevent Default Browser Zoom/Scroll behaviors on tap
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // 2. Visual Flash Effect
    setFlash(true);
    setTimeout(() => setFlash(false), 100);

    // 3. Capture Frame
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      
      if (imageSrc) {
        // Haptic Feedback (if supported on mobile)
        if (navigator.vibrate) navigator.vibrate(50);
        
        // Slight delay to let the flash animation play for UX
        setTimeout(() => onCapture(imageSrc, null), 50);
      } else {
        console.warn("Camera not ready yet.");
      }
    }
  }, [webcamRef, onCapture]);

  return (
    <div className="absolute inset-0 w-full h-full bg-[#eceae3] z-0 flex flex-col select-none">
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(900px_400px_at_50%_-10%,#e5edf4,transparent_70%)]" />

        <div className="absolute top-5 left-5 z-[70] flex items-center gap-3">
          <button
            onClick={onBackToLanding}
            className="rounded-full bg-white/95 border border-black/10 px-4 py-2 text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-sm hover:bg-white transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back To Landing
          </button>
          <div className="hidden md:flex items-center gap-2 rounded-full bg-white/90 border border-black/10 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-slate-500 font-semibold">
            <Camera className="w-3.5 h-3.5 text-[#1a9778]" />
            Live Scanner
          </div>
        </div>
        
        {/* --- WHITE FLASH OVERLAY (Visual Feedback) --- */}
        {flash && (
          <div className="absolute inset-0 bg-white z-[99999] pointer-events-none animate-[ping_0.1s_ease-out]" />
        )}

        {initialMode === 'camera' ? (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              className="absolute inset-0 w-full h-full object-cover opacity-90" 
              onUserMediaError={(e) => console.error("Camera Error:", e)}
            />
            
            {/* Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] bg-[size:44px_44px] pointer-events-none" />
            
            {/* Scanner Line Animation */}
            <motion.div 
              className="absolute w-full h-1 bg-[#1a9778]/60 shadow-[0_0_15px_rgba(26,151,120,0.8)] z-10 pointer-events-none"
              initial={{ top: "10%" }} animate={{ top: "90%" }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
            />

            <div className="absolute inset-x-5 top-20 z-20 pointer-events-none">
              <div className="rounded-2xl border border-white/40 bg-white/20 backdrop-blur-md p-3 text-center">
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/90 font-semibold">Capture A Clear Material View</p>
              </div>
            </div>

            {/* --- INSTANT SHUTTER BUTTON --- */}
            {/* z-[9999] ensures it's on top. touch-action-none prevents browser zooming/scrolling on tap. */}
            <div className="fixed bottom-28 right-8 z-[9999] touch-none">
               <button 
                 // Use onPointerDown for INSTANT reaction (onClick has 300ms delay on mobile)
                 onPointerDown={(e) => { setIsPressed(true); capture(e); }}
                 onPointerUp={() => setIsPressed(false)}
                 onPointerLeave={() => setIsPressed(false)}
                 className={`
                    w-20 h-20 rounded-full border-[6px] 
                    flex items-center justify-center 
                    shadow-[0_0_40px_rgba(0,0,0,0.6)] 
                    transition-all duration-75 ease-in-out
                    ${isPressed 
                        ? 'border-[#1a9778] bg-white/60 scale-90' 
                        : 'border-white/90 bg-white/25 scale-100 hover:bg-white/35'}
                 `}
                 aria-label="Capture Photo"
               >
                 <div className={`
                    w-16 h-16 bg-[#fff8e7] rounded-full shadow-inner 
                    transition-all duration-75
                    ${isPressed ? 'scale-90 bg-[#1a9778]' : 'scale-100'}
                 `} />
               </button>
            </div>
          </>
        ) : (
          /* GALLERY UPLOAD MODE UI */
          <div className="absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed border-[#c8c5ba] bg-[#f3f1ea] m-4 rounded-3xl shadow-inner">
            <UploadCloud className="w-16 h-16 mb-4 text-[#8c8a82]" />
            <p className="text-slate-700 font-semibold">Ready for Upload</p>
            <p className="text-slate-500 text-xs mt-2">Use the upload control below</p>
          </div>
        )}
      </div>
    </div>
  );
};