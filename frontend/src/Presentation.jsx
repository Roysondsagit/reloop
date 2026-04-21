import React, { useState, useEffect } from 'react';
import { 
  Recycle, Brain, Database, Cpu, TrendingUp, ShieldCheck, 
  Mic, Eye, Search, FileText, ArrowRight, ArrowLeft,
  ChevronRight, Zap, Globe, IndianRupee, Server, Layers,
  Code, Activity, Factory, Trash2 // <--- ADDED TRASH2 HERE
} from 'lucide-react';

// --- IMAGE COMPONENT ---
const SlideImage = ({ src, alt, fallbackIcon: Icon }) => {
  // Defensive path handling
  const cleanSrc = src.startsWith('/') ? src.slice(1) : src;
  const finalPath = `/slides/${cleanSrc}`;

  return (
    <div className="w-full h-64 md:h-full relative rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.3)] group bg-slate-900">
      {/* Loading Pulse */}
      <div className="absolute inset-0 bg-slate-800 animate-pulse z-0" />
      
      <img 
        src={finalPath} 
        alt={alt} 
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-100 z-10"
        onError={(e) => {
          e.target.style.display = 'none'; // Hide broken image
          e.target.nextSibling.style.display = 'flex'; // Show fallback
        }}
      />
      
      {/* Fallback View */}
      <div className="absolute inset-0 hidden flex-col items-center justify-center bg-slate-900 z-0 text-slate-500 p-6 text-center">
        <Icon className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-xs font-mono uppercase tracking-widest border border-white/10 px-3 py-2 rounded bg-white/5">
          Missing: public/{finalPath}
        </p>
      </div>

      {/* Aesthetic Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-20 pointer-events-none" />
    </div>
  );
};

const Slide = ({ children, active }) => (
  <div className={`absolute inset-0 transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] transform ${active ? 'opacity-100 translate-x-0 scale-100 blur-0' : 'opacity-0 translate-x-12 scale-95 blur-sm pointer-events-none'}`}>
    <div className="h-full w-full flex flex-col p-6 md:p-12 overflow-y-auto">
      {children}
    </div>
  </div>
);

const Presentation = ({ onExit, onBackToLanding }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 10;

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'Escape') onExit?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#050b14] text-slate-100 font-sans overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#050b14] to-black">
      
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.05]" 
             style={{ backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`, backgroundSize: '50px 50px' }} />
      </div>

      {/* HEADER */}
      <header className="absolute top-0 left-0 right-0 z-50 px-8 py-6 flex justify-between items-start pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="p-2.5 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Recycle className="w-6 h-6 text-black fill-current" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white leading-none">RELOOP</h1>
            <div className="flex items-center gap-2 mt-1">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
               <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Industrial Symbiosis v2.0</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 pointer-events-auto">
           <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
              <span className="text-xs font-bold text-green-400 font-mono">TEAM CODE-999</span>
           </div>
           <div className="flex items-center gap-2">
             <button
               onClick={onBackToLanding || onExit}
               className="px-3 py-1.5 text-[10px] font-semibold text-slate-200 bg-white/10 border border-white/20 rounded-full hover:bg-white/20 transition-colors uppercase tracking-widest"
             >
               Back To Landing
             </button>
             <button onClick={onExit} className="text-[10px] text-slate-600 hover:text-white transition-colors uppercase tracking-widest">
               Exit [ESC]
             </button>
           </div>
        </div>
      </header>

      {/* MAIN SLIDE CONTAINER */}
      <main className="relative w-full h-full max-w-7xl mx-auto pt-24 pb-20">
        
        {/* --- SLIDE 1: INTRO --- */}
        <Slide active={currentSlide === 0}>
          <div className="flex-1 flex flex-col justify-center items-start space-y-8 pl-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold tracking-wider uppercase mb-4">
              <Zap className="w-3 h-3" /> Final Round Evaluation - Convolve 4.0
            </div>
            <h1 className="text-7xl md:text-9xl font-black leading-[0.9] text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-600 tracking-tighter drop-shadow-2xl">
              RELOOP
            </h1>
            <p className="text-2xl md:text-4xl text-slate-400 max-w-4xl font-light leading-snug border-l-4 border-green-500 pl-6">
              Autonomous <span className="text-white font-medium">Multi-Agent Orchestration</span> transforming chaotic waste into digital industrial assets.
            </p>
            
            <div className="flex flex-wrap gap-3 pt-12">
              {['WA-YOLO Runtime', 'Florence-2', 'Whisper 2025 OpenAI', 'Qdrant Local (Offline)'].map((tech) => (
                <span key={tech} className="px-4 py-2 bg-slate-800/50 border border-white/5 rounded-lg text-xs font-mono text-slate-300 uppercase tracking-widest">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </Slide>

        {/* --- SLIDE 2: THE PROBLEM --- */}
        <Slide active={currentSlide === 1}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 h-full items-center">
            <div className="space-y-10">
              <h2 className="text-5xl font-bold flex flex-col gap-2 leading-none">
                <span className="text-red-500 text-2xl font-mono uppercase tracking-widest">The Crisis</span>
                <span>Invisible Leakage</span>
              </h2>
              <p className="text-xl text-slate-400 leading-relaxed">
                India generates <span className="text-white font-bold border-b border-red-500/50">1.85 Lakh Tonnes</span> of waste daily. 
                90% is misclassified, meaning billions in feedstock is buried in landfills simply because we lack the vocabulary to trade it.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl">
                  <h3 className="text-3xl font-black text-red-400">₹1.25L Cr</h3>
                  <p className="text-xs text-red-300/60 uppercase tracking-widest mt-1">Lost Annually</p>
                </div>
                <div className="p-6 bg-slate-800/50 border border-white/5 rounded-2xl">
                  <h3 className="text-3xl font-black text-white">90%</h3>
                  <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Informal Sector</p>
                </div>
              </div>
            </div>
            <SlideImage src="trash_crisis.jpg" alt="Pile of Trash" fallbackIcon={Trash2} />
          </div>
        </Slide>

        {/* --- SLIDE 3: THE SOLUTION --- */}
        <Slide active={currentSlide === 2}>
          <div className="flex flex-col h-full justify-center">
            <div className="mb-16 text-center">
              <h2 className="text-5xl font-black mb-6">Agentic Symbiosis</h2>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto">Moving beyond simple scripts to a system that "Sees, Listens, Remembers, Understands and Trades."</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
              {[
                { title: "Adaptive Inference", desc: "Preprocess layer dynamically scales resolution and contrast before detection.", icon: Eye, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
                { title: "Contamination Recognition", desc: "Each detected item gets a contamination score before acceptance.", icon: ShieldCheck, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
                { title: "Decision + Actuator", desc: "Decision engine emits SORT/REJECT and route target for smart bins.", icon: Factory, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" }
              ].map((item, i) => (
                <div key={i} className={`group p-8 ${item.bg} border ${item.border} rounded-[2rem] hover:-translate-y-2 transition-transform duration-300`}>
                  <div className={`w-14 h-14 rounded-2xl bg-slate-950 flex items-center justify-center mb-6 shadow-xl`}>
                    <item.icon className={`w-7 h-7 ${item.color}`} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white">{item.title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed opacity-80">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Slide>

        {/* --- SLIDE 4: AGENT ARCHITECTURE --- */}
        <Slide active={currentSlide === 3}>
          <div className="flex flex-col h-full justify-center">
            <div className="text-center mb-12">
               <span className="text-blue-500 font-mono text-xs uppercase tracking-widest">System Design</span>
               <h2 className="text-4xl font-bold mt-2">Hub & Spoke Orchestration</h2>
            </div>
            
            <div className="relative max-w-5xl mx-auto w-full">
              {/* Connector Line */}
              <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-y-1/2 hidden md:block" />
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                {[
                  { name: "Orchestrator", role: "Router", icon: Server, color: "text-slate-200" },
                  { name: "Urban Miner", role: "Executor", icon: Cpu, color: "text-blue-400" },
                  { name: "Memory Agent", role: "Retriever", icon: Database, color: "text-purple-400" },
                  { name: "Market Agent", role: "Planner", icon: IndianRupee, color: "text-emerald-400" }
                ].map((agent, i) => (
                  <div key={i} className="bg-[#0b1221] border border-white/10 p-8 rounded-3xl flex flex-col items-center text-center shadow-2xl hover:border-white/20 transition-colors">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 ring-1 ring-white/10">
                      <agent.icon className={`w-10 h-10 ${agent.color}`} />
                    </div>
                    <h3 className="font-bold text-lg text-white">{agent.name}</h3>
                    <span className="text-[10px] font-bold text-slate-500 uppercase mt-2 bg-black/40 px-3 py-1 rounded-full tracking-widest">{agent.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Slide>

        {/* --- SLIDE 5: URBAN MINER (VISION + AUDIO) --- */}
        <Slide active={currentSlide === 4}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 h-full items-center">
             <SlideImage src="vision_demo.jpg" alt="Object Detection" fallbackIcon={Eye} />
             <div className="space-y-8 pl-4">
               <h2 className="text-4xl font-bold mb-2">WA-YOLO Runtime</h2>
               <p className="text-slate-400">Inference path optimized for real-time segregation decisions.</p>
               
               <div className="space-y-6">
                 <div className="flex gap-5">
                   <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 text-blue-400 font-bold">1</div>
                      <div className="w-0.5 h-full bg-blue-500/20 mt-2" />
                   </div>
                   <div className="pb-8">
                     <h4 className="font-bold text-xl text-white">Adaptive Preprocessing</h4>
                     <p className="text-slate-400 text-sm mt-2 leading-relaxed">Input is resized and contrast-normalized using a dynamic profile before model inference.</p>
                   </div>
                 </div>
                 <div className="flex gap-5">
                   <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30 text-purple-400 font-bold">2</div>
                      <div className="w-0.5 h-full bg-purple-500/20 mt-2" />
                   </div>
                   <div className="pb-8">
                     <h4 className="font-bold text-xl text-white">Detection + Classification</h4>
                     <p className="text-slate-400 text-sm mt-2 leading-relaxed">YOLO detects candidates; SigLIP + logic layer resolves material class with memory/voice assist.</p>
                   </div>
                 </div>
                 <div className="flex gap-5">
                   <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 text-emerald-400 font-bold">3</div>
                   </div>
                   <div>
                     <h4 className="font-bold text-xl text-white">Contamination + Decision Engine</h4>
                     <p className="text-slate-400 text-sm mt-2 leading-relaxed">Each item gets a contamination score, then decision engine outputs SORT/REJECT and actuator route (smart bin or reject lane).</p>
                   </div>
                 </div>
               </div>
             </div>
          </div>
        </Slide>

        {/* --- SLIDE 6: MEMORY & QDRANT --- */}
        <Slide active={currentSlide === 5}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 h-full items-center">
             <div className="space-y-10 order-2 md:order-1">
               <div>
                 <div className="flex items-center gap-3 mb-4">
                   <img src="https://qdrant.tech/img/brand-resources-logos/qdrant-brandmark-red.png" className="w-8 h-8" alt="Q" />
                   <span className="text-red-500 font-mono font-bold tracking-widest text-sm">POWERED BY QDRANT</span>
                 </div>
                 <h2 className="text-5xl font-bold text-white">Vector Memory</h2>
               </div>
               
               <p className="text-xl text-slate-400 leading-relaxed">
                 Traditional DBs store text. We store <span className="text-white font-bold underline decoration-red-500 decoration-2 underline-offset-4">meaning</span>.
               </p>

               <div className="grid grid-cols-1 gap-4">
                 <div className="p-6 border border-white/10 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
                   <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-2"><Brain className="w-4 h-4"/> Episodic Memory</h4>
                   <p className="text-sm text-slate-300">"I recognize this specific crumbled packet. The user corrected me last time, so I won't make the same mistake."</p>
                 </div>
                 <div className="p-6 border border-white/10 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors">
                   <h4 className="font-bold text-emerald-400 mb-2 flex items-center gap-2"><Database className="w-4 h-4"/> Knowledge Memory</h4>
                   <p className="text-sm text-slate-300">"This matches the description of LDPE plastic in the SWM 2026 guidelines."</p>
                 </div>
               </div>
             </div>
             {/* IMAGE FIX: Explicit Path */}
             <div className="order-1 md:order-2 h-full py-8">
                <SlideImage src="qdrant_visual.jpg" alt="Vector Space" fallbackIcon={Database} />
             </div>
          </div>
        </Slide>

        {/* --- SLIDE 7: MARKET AGENT --- */}
        <Slide active={currentSlide === 6}>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12 h-full items-center">
             <div className="h-full py-8">
                <SlideImage src="market_graph.jpg" alt="Recycling Plant" fallbackIcon={Activity} />
             </div>
             <div className="space-y-8 pl-4">
               <h2 className="text-4xl font-bold">The Market Agent</h2>
               <p className="text-lg text-slate-400">Bridging the vocabulary gap between messy waste and structured industrial demand.</p>
               
               <div className="space-y-4">
                 <div className="flex gap-4 p-6 bg-slate-900/80 rounded-2xl border border-white/10 shadow-lg">
                   <div className="p-3 bg-red-500/10 rounded-lg h-fit"><FileText className="text-red-400 w-6 h-6" /></div>
                   <div>
                     <h4 className="font-bold text-white text-lg">PDF Ingestion</h4>
                     <p className="text-xs text-slate-400 mt-1 leading-relaxed">Parses complex procurement manifests using PyMuPDF. Extracts "Material", "Price", and "Purity" automatically.</p>
                   </div>
                 </div>
                 <div className="flex gap-4 p-6 bg-slate-900/80 rounded-2xl border border-white/10 shadow-lg">
                   <div className="p-3 bg-emerald-500/10 rounded-lg h-fit"><Search className="text-emerald-400 w-6 h-6" /></div>
                   <div>
                     <h4 className="font-bold text-white text-lg">Semantic Matching</h4>
                     <p className="text-xs text-slate-400 mt-1 leading-relaxed">Matches "Clear PET Bottle" (Vision) with "Polyester Resin Feedstock" (Industry) using vector similarity.</p>
                   </div>
                 </div>
               </div>
             </div>
           </div>
        </Slide>

        {/* --- SLIDE 8: WORKFLOW --- */}
        <Slide active={currentSlide === 7}>
          <div className="flex flex-col h-full justify-center">
            <h2 className="text-4xl font-bold mb-16 text-center">The Operational Pipeline</h2>
            <div className="space-y-3 max-w-4xl mx-auto w-full">
              {[
                { step: "01", title: "Input", desc: "Camera feed / uploaded image enters runtime.", color: "text-blue-400", border: "border-blue-500/30" },
                { step: "02", title: "Preprocess", desc: "Adaptive resize + normalization profile selected.", color: "text-indigo-400", border: "border-indigo-500/30" },
                { step: "03", title: "WA-YOLO Model", desc: "Detection pass generates object candidates.", color: "text-purple-400", border: "border-purple-500/30" },
                { step: "04", title: "Detection + Classify", desc: "SigLIP/material logic finalizes class labels.", color: "text-cyan-400", border: "border-cyan-500/30" },
                { step: "05", title: "Contamination Analysis", desc: "Per-item contamination score is computed.", color: "text-rose-400", border: "border-rose-500/30" },
                { step: "06", title: "Decision Engine", desc: "Items marked SORT or REJECT based on thresholds.", color: "text-emerald-400", border: "border-emerald-500/30" },
                { step: "07", title: "Actuator Route", desc: "Route target emitted: smart bin lane or reject lane.", color: "text-orange-400", border: "border-orange-500/30" }
              ].map((s, i) => (
                <div key={i} className={`flex items-center gap-8 p-5 bg-white/5 border ${s.border} rounded-2xl hover:bg-white/10 transition-colors`}>
                  <span className={`text-2xl font-black ${s.color} font-mono w-12`}>{s.step}</span>
                  <div className="w-px h-10 bg-white/10" />
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-200 text-lg">{s.title}</h4>
                    <p className="text-sm text-slate-500">{s.desc}</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 ${s.color}`} />
                </div>
              ))}
            </div>
          </div>
        </Slide>

        {/* --- SLIDE 9: FUTURE VISION --- */}
        <Slide active={currentSlide === 8}>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-12 h-full items-center">
             <div className="space-y-10 pl-4">
               <h2 className="text-5xl font-bold">2026 Roadmap</h2>
               <p className="text-xl text-slate-400">From a Hackathon prototype to National Asset & Infra.</p>
               <div className="grid grid-cols-1 gap-6">
                 <div className="p-6 bg-gradient-to-r from-blue-900/20 to-transparent border-l-4 border-blue-500 rounded-r-xl">
                   {/* <h3 className="font-bold text-blue-400 text-lg mb-1">Q2 2026</h3> */}
                   <p className="text-sm text-slate-300">Gemini 2.0 Integration for multi-modal reasoning and carbon auditing.</p>
                 </div>
                 <div className="p-6 bg-gradient-to-r from-purple-900/20 to-transparent border-l-4 border-purple-500 rounded-r-xl">
                   {/* <h3 className="font-bold text-purple-400 text-lg mb-1">Q3 2026</h3> */}
                   <p className="text-sm text-slate-300">Blockchain settlements for automated carbon credits.</p>
                 </div>
                 <div className="p-6 bg-gradient-to-r from-emerald-900/20 to-transparent border-l-4 border-emerald-500 rounded-r-xl">
                   {/* <h3 className="font-bold text-emerald-400 text-lg mb-1">Q4 2026</h3> */}
                   <p className="text-sm text-slate-300">Autonomous drone swarms for landfill mining.</p>
                 </div>
               </div>
             </div>
             <SlideImage src="future_city.jpg" alt="Green Future" fallbackIcon={Globe} />
           </div>
        </Slide>

        {/* --- SLIDE 10: CONCLUSION --- */}
        <Slide active={currentSlide === 9}>
           <div className="flex flex-col h-full items-center justify-center text-center space-y-12">
             <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-700 rounded-[2.5rem] flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.4)] animate-bounce-slow">
               <Recycle className="w-16 h-16 text-black fill-current" />
             </div>
             
             <div>
               <h2 className="text-7xl md:text-9xl font-black italic tracking-tighter uppercase mb-6 text-white">
                 ReLoop
               </h2>
               <p className="text-2xl text-slate-400 font-light max-w-2xl mx-auto">
                 "Closing the loop, one vector at a time."
               </p>
             </div>
             
             <div className="flex gap-16 pt-16 border-t border-white/10">
               <div className="text-left">
                 <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] mb-2">Developed By</p>
                 <p className="text-2xl font-bold text-white">Unique Team ID- 999</p>
               </div>
               <div className="text-left">
                 <p className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] mb-2">Powered By</p>
                 <div className="flex items-center gap-3">
                   <img src="https://qdrant.tech/img/brand-resources-logos/qdrant-brandmark-red.png" className="h-8" alt="Qdrant" />
                   <span className="text-2xl font-bold text-white">Qdrant</span>
                 </div>
               </div>
             </div>
           </div>
        </Slide>

      </main>

      {/* FLOATING FOOTER */}
      <footer className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full shadow-2xl">
          <button onClick={prevSlide} className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white"><ArrowLeft className="w-4 h-4" /></button>
          
          <div className="flex items-center gap-2">
             <span className="text-[10px] font-bold font-mono text-slate-400 w-8 text-center">{currentSlide + 1} / {totalSlides}</span>
             <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
               <div className="h-full bg-green-500 transition-all duration-500 ease-out" style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }} />
             </div>
          </div>

          <button onClick={nextSlide} className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white"><ArrowRight className="w-4 h-4" /></button>
        </div>
      </footer>
    </div>
  );
};

export default Presentation;