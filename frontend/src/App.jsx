import { useState, useEffect, useRef } from 'react';
import { CameraView } from './components/CameraView';
import { AnalysisReceipt } from './components/AnalysisReceipt';
import { LandingPage } from './components/LandingPage';
import { DevConsole } from './components/DevConsole';
import { LiveMap } from './components/LiveMap';
import { AnimatedLogo } from './components/AnimatedLogo';
import { AudioPreview } from './components/AudioPreview'; 
import { analyzeImage } from './services/api';
import { Scan, Terminal, Factory, LayoutGrid, Camera, Image as ImageIcon, UploadCloud, Mic, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { FileText, CheckCircle, RefreshCw } from 'lucide-react';
import { uploadManifest } from './services/api';
import Presentation from './Presentation'; // IMPORT THE DECK

// ... (Keep MarketView exactly as it is) ...
const MarketView = () => {
  const [orders, setOrders] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
        const data = await uploadManifest(file);
        if (data.status === 'success') {
            setOrders(data.orders);
        } else {
            alert("Failed to parse manifest");
        }
    } catch (err) {
        console.error(err);
        alert("Upload Error");
    } finally {
        setUploading(false);
    }
  };

  return (
    <div className="w-full h-full bg-[#f5f5f2] p-6 pt-28 overflow-y-auto pb-40 font-sans text-slate-800">
      <div className="max-w-md mx-auto">
        <div className="mb-8">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold mb-2">Marketplace</p>
            <h2 className="text-3xl font-['Playfair_Display'] text-slate-900 tracking-tight leading-none">Demand Market</h2>
            <p className="text-xs text-slate-500 mt-2">Connect directly with verified industrial recyclers.</p>
        </div>
        <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-6 text-center mb-8 hover:border-[#1a9778]/50 transition-colors group shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
            <input type="file" accept="application/pdf" ref={fileRef} onChange={handleFileUpload} className="hidden" />
            {uploading ? (
                <div className="flex flex-col items-center py-4">
                    <RefreshCw className="w-8 h-8 text-[#1a9778] animate-spin mb-3" />
                    <p className="text-xs font-mono text-[#1a9778] animate-pulse">VECTORIZING DEMAND...</p>
                </div>
            ) : (
                <div onClick={() => fileRef.current.click()} className="cursor-pointer py-2">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-[#1a9778]/10 transition-colors border border-slate-200">
                        <FileText className="w-6 h-6 text-slate-500 group-hover:text-[#1a9778]" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">Import Procurement Manifest</h3>
                    <p className="text-[10px] text-slate-500 mt-1">Supports PDF / CSV Contracts</p>
                </div>
            )}
        </div>
        <div className="space-y-4">
            <div className="flex justify-between items-end px-1">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Buy Orders</h3>
                {orders.length > 0 && <span className="text-[10px] text-[#1a9778] flex items-center gap-1"><CheckCircle className="w-3 h-3" /> QDRANT SYNCED</span>}
            </div>
            <AnimatePresence>
                {orders.map((order, i) => (
                    <motion.div 
                        key={order.id || i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between hover:border-[#1a9778]/40 transition-all group shadow-[0_8px_20px_rgba(0,0,0,0.05)]"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-white border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                                {order.factory_name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">{order.factory_name}</h3>
                                <p className="text-[10px] text-slate-500 font-mono">Buying: <span className="text-[#1a9778]">{order.material}</span></p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-black text-[#1a9778]">₹{order.price}</p>
                            <p className="text-[9px] text-slate-500 font-medium">PER KG</p>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
            {orders.length === 0 && !uploading && (
                <div className="text-center py-10 opacity-50">
                    <p className="text-xs font-mono text-slate-500">NO ACTIVE ORDERS</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

function App() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
    const [hasEnteredScanner, setHasEnteredScanner] = useState(false);
  const fileInputRef = useRef(null);
  
  // Audio State
  const { isRecording, toggleRecording, audioBlob, audioUrl, clearAudio } = useAudioRecorder();
  const audioBlobRef = useRef(null);
  useEffect(() => { audioBlobRef.current = audioBlob; }, [audioBlob]);

  // View State
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem("last_tab") || "scanner");
  const [startMode, setStartMode] = useState(() => localStorage.getItem("last_mode") || "camera");
  const [showDevConsole, setShowDevConsole] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  
  // --- NEW: Presentation Mode State ---
  const [showPresentation, setShowPresentation] = useState(false);

  // Persistence
  useEffect(() => { localStorage.setItem("last_tab", activeTab); }, [activeTab]);
  useEffect(() => { localStorage.setItem("last_mode", startMode); }, [startMode]);

  const toggleMode = () => {
      setStartMode(prev => prev === 'camera' ? 'gallery' : 'camera');
  };

  const handleCapture = async (imgSrc, audioBlobData) => {
    setImage(imgSrc); 
    setLoading(true); 
    setIsMapExpanded(false); 
    
    const finalAudio = audioBlobData || audioBlobRef.current;
    console.log("📸 Capture Triggered. Audio Blob Status:", finalAudio ? `Present (${finalAudio.size} bytes)` : "Missing");

    try {
      const data = await analyzeImage(imgSrc, finalAudio);
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Analysis Failed. Check backend."); 
      setImage(null);
    } finally { 
      setLoading(false); 
    }
  };
  
  const handleGalleryUpload = (e) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => handleCapture(reader.result, audioBlobRef.current);
          reader.readAsDataURL(file);
      }
  };

  const handleReset = () => { 
      setImage(null); 
      setResult(null); 
      setShowDevConsole(false); 
      clearAudio(); 
  };

    const handleBackToLanding = () => {
        setHasEnteredScanner(false);
        setActiveTab('scanner');
        setImage(null);
        setResult(null);
        setLoading(false);
        setShowDevConsole(false);
        setIsMapExpanded(false);
        clearAudio();
    };

  const mapVariants = {
    expanded: { width: "100%", height: "100%", top: 0, right: 0, borderRadius: 0, opacity: 1 },
    radar: { width: "120px", height: "80px", top: 24, right: 24, borderRadius: 24, opacity: 1 },
    icon: { width: "48px", height: "48px", top: 24, right: 24, borderRadius: 999, opacity: 1 }
  };
  const currentMapState = isMapExpanded ? 'expanded' : (result ? 'icon' : 'radar');
    const isLandingVisible = activeTab === 'scanner' && !hasEnteredScanner && !image && !result;
    const showGlobalHud = activeTab === 'market';

  return (
    <div className="relative w-full h-[100dvh] bg-black text-white overflow-hidden font-sans flex flex-col">
      
      {/* --- PRESENTATION LAYER --- */}
      <AnimatePresence>
                {showPresentation && (
                    <Presentation
                        onExit={() => setShowPresentation(false)}
                        onBackToLanding={() => {
                            setShowPresentation(false);
                            handleBackToLanding();
                        }}
                    />
                )}
      </AnimatePresence>

      {/* --- CREATIVE SLIDER TRIGGER (Left Side) --- */}
            {!showPresentation && showGlobalHud && (
        <div className="fixed left-0 top-1/2 -translate-y-1/2 z-[200] group h-32 w-4 hover:w-12 transition-all duration-300 flex items-center">
            <motion.div 
                drag="x"
                dragConstraints={{ left: 0, right: 100 }}
                dragElastic={0.2}
                onDragEnd={(e, { offset, velocity }) => {
                    if (offset.x > 80) setShowPresentation(true);
                }}
                className="h-16 w-2 bg-white/20 rounded-r-full cursor-grab active:cursor-grabbing backdrop-blur-md border-y border-r border-white/10 hover:bg-green-500/50 transition-colors flex items-center justify-center overflow-hidden"
            >
                <div className="w-0.5 h-4 bg-white/50 rounded-full" />
            </motion.div>
            {/* Tooltip hint */}
            <div className="absolute left-6 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-black/80 px-2 py-1 rounded text-[10px] font-mono border border-white/10 text-green-400 pointer-events-none">
                SLIDE TO PITCH →
            </div>
        </div>
      )}

      {/* 1. LAYERS */}
      <div className="absolute inset-0 z-0">
        <div className={`absolute inset-0 transition-opacity duration-500 ${activeTab === 'scanner' ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                                                {!hasEnteredScanner && !image && !result && (
                                                        <LandingPage
                                                            onStart={() => setHasEnteredScanner(true)}
                                                            onOpenPresentation={() => setShowPresentation(true)}
                                                        />
                                                )}
                        {hasEnteredScanner && !image && !result && (
                            <CameraView key={startMode} onCapture={handleCapture} initialMode={startMode} onBackToLanding={handleBackToLanding} />
                        )}
            {image && loading && (
               <div className="w-full h-full flex flex-col items-center justify-center bg-black z-50">
                  <div className="scale-150 mb-6"><AnimatedLogo /></div>
                  <p className="text-green-400 font-mono text-[10px] tracking-[0.3em] animate-pulse">NEURAL SCAN...</p>
               </div>
            )}
                {result && !loading && (
                    <div className="w-full h-full bg-slate-900 pt-24"><AnalysisReceipt data={result} capturedImage={image} onReset={handleReset} onBackToLanding={handleBackToLanding} /></div>
            )}
        </div>
        <div className={`absolute inset-0 bg-slate-900 transition-opacity duration-300 ${activeTab === 'market' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
            <MarketView />
        </div>
      </div>

      {/* 2. HEADER HUD */}
            {showGlobalHud && (
                <header className="absolute top-0 left-0 right-0 p-6 z-[60] flex justify-between items-start pointer-events-none">
                    <motion.div 
                        animate={{ opacity: isMapExpanded ? 0 : 1, filter: isMapExpanded ? 'blur(10px)' : 'blur(0px)' }}
                        className="flex items-center gap-4 pointer-events-auto"
                    >
                        <AnimatedLogo />
                        <div>
                            <h1 className="text-xl font-black tracking-tighter text-white leading-none">RELOOP</h1>
                            <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] font-bold text-black bg-green-400 px-1.5 rounded">V2.0</span>
                                    <span className="text-[9px] text-slate-500 font-mono tracking-wider">IND.SYMBIOSIS</span>
                            </div>
                        </div>
                    </motion.div>

                    <div className="pointer-events-auto">
                            <AnimatePresence>
                                    {result && !isMapExpanded && (
                                            <motion.button
                                                    initial={{ scale: 0, opacity: 0, x: 20 }}
                                                    animate={{ scale: 1, opacity: 1, x: 0 }}
                                                    exit={{ scale: 0, opacity: 0, x: 20 }}
                                                    onClick={() => setShowDevConsole(true)}
                                                    className="fixed top-6 right-24 z-[60] w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-yellow-400 hover:bg-white/10 hover:scale-105 transition-all shadow-xl"
                                            >
                                                    <Terminal className="w-5 h-5" />
                                            </motion.button>
                                    )}
                            </AnimatePresence>

                            <motion.div 
                                layout
                                initial={false}
                                animate={currentMapState}
                                variants={mapVariants}
                                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                                className={`fixed z-[70] overflow-hidden shadow-2xl bg-black border border-white/10 ${!isMapExpanded ? 'cursor-pointer hover:border-green-500/50' : ''}`}
                                onClick={() => !isMapExpanded && setIsMapExpanded(true)}
                            >
                                 {currentMapState === 'icon' ? (
                                         <div className="w-full h-full flex items-center justify-center bg-slate-900/80 backdrop-blur">
                                                 <Globe className="w-6 h-6 text-green-400 animate-pulse" />
                                         </div>
                                 ) : (
                                         <LiveMap isExpanded={isMapExpanded} onToggle={() => setIsMapExpanded(!isMapExpanded)} />
                                 )}
                            </motion.div>
                    </div>
                </header>
            )}

      {/* 3. TRIGGER RAIL */}
            {!result && (hasEnteredScanner || activeTab === 'market') && (
        <div className="fixed bottom-8 left-0 right-0 px-8 z-[100] pointer-events-auto flex items-end justify-between">
            <div className="flex flex-col gap-4 items-start">
                {activeTab === 'scanner' && (
                    <>
                        <div className="flex items-center">
                            <button 
                                onClick={toggleRecording}
                                className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300 ${
                                    isRecording 
                                    ? 'bg-red-500 border-red-300 text-white shadow-[0_0_20px_rgba(239,68,68,0.6)] scale-110' 
                                    : 'bg-white/90 border-black/10 text-slate-700 backdrop-blur-md hover:bg-white'
                                }`}
                            >
                                <Mic className={`w-5 h-5 ${isRecording ? 'fill-current animate-pulse' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {audioUrl && <AudioPreview audioUrl={audioUrl} onClear={clearAudio} />}
                            </AnimatePresence>
                        </div>
                        <button 
                            onClick={toggleMode}
                            className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-md border border-black/10 flex items-center justify-center text-slate-700 hover:bg-white transition-all"
                        >
                            {startMode === 'camera' ? <ImageIcon className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                        </button>
                    </>
                )}
            </div>

            <div className="bg-white/90 backdrop-blur-xl p-1.5 rounded-full border border-black/10 flex gap-2 shadow-[0_10px_30px_rgba(0,0,0,0.12)] mb-2">
                <button onClick={() => setActiveTab('scanner')} className={`p-3 rounded-full transition-all ${activeTab === 'scanner' ? 'bg-[#101826] text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Scan className="w-5 h-5" />
                </button>
                <div className="w-[1px] bg-black/10 my-2"></div>
                <button onClick={() => setActiveTab('market')} className={`p-3 rounded-full transition-all ${activeTab === 'market' ? 'bg-[#101826] text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                    <LayoutGrid className="w-5 h-5" />
                </button>
            </div>

            <div>
                {activeTab === 'scanner' && startMode === 'gallery' ? (
                    <button 
                        onClick={() => fileInputRef.current.click()}
                        className="w-16 h-16 rounded-full bg-[#f7b24a] flex items-center justify-center shadow-[0_10px_30px_rgba(247,178,74,0.45)] hover:scale-105 transition-transform"
                    >
                        <UploadCloud className="w-8 h-8 text-[#111]" />
                    </button>
                ) : (
                    <div className="w-20 h-20" /> 
                )}
            </div>
        </div>
      )}

      <input type="file" accept="image/*" ref={fileInputRef} onChange={handleGalleryUpload} className="hidden" />
      <AnimatePresence>{showDevConsole && <DevConsole data={result} onClose={() => setShowDevConsole(false)} />}</AnimatePresence>
    </div>
  );
}

export default App;