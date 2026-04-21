import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, X, Image as ImageIcon, Code, Cpu } from 'lucide-react';

// Automatically points to localhost:8000
const API_URL = 'http://127.0.0.1:8000'; 

export const DevConsole = ({ data, onClose }) => {
  if (!data) return null;

  return (
    <motion.div 
      initial={{ y: "100%" }}
      animate={{ y: "0%" }}
      exit={{ y: "100%" }}
      className="fixed inset-0 z-[60] bg-slate-900/95 backdrop-blur-md flex flex-col pt-12 text-slate-200 font-mono text-xs md:text-sm"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-black/40 border-b border-white/10 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 text-green-400">
          <Terminal className="w-4 h-4" />
          <span className="font-bold tracking-wider">RELOOP_KERNEL_V2.LOG</span>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* LEFT COL: LOGS */}
        <div className="flex flex-col gap-4">
          
          {/* 1. Execution Trace */}
          <div className="bg-black/50 rounded border border-white/10 overflow-hidden">
            <div className="bg-white/5 px-3 py-2 border-b border-white/10 flex items-center gap-2">
              <Cpu className="w-3 h-3 text-blue-400" />
              <span className="font-bold">EXECUTION TRACE</span>
            </div>
            <div className="p-3 h-64 overflow-y-auto space-y-1">
              {data.trace_logs?.map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-slate-500 whitespace-nowrap">{log.split(']')[0]}]</span>
                  <span className={log.includes('✅') ? 'text-green-400' : log.includes('⚠️') ? 'text-yellow-400' : 'text-slate-300'}>
                    {log.split(']')[1]}
                  </span>
                </div>
              )) || <p className="text-slate-500">No logs available.</p>}
            </div>
          </div>

          {/* 2. Visual Proof */}
          <div className="bg-black/50 rounded border border-white/10 overflow-hidden">
             <div className="bg-white/5 px-3 py-2 border-b border-white/10 flex items-center gap-2">
              <ImageIcon className="w-3 h-3 text-purple-400" />
              <span className="font-bold">COMPUTER VISION LAYER</span>
            </div>
            <div className="p-2 flex justify-center bg-[url('/grid.svg')]">
               {/* Use API_URL prefix because the path is relative */}
               <img src={`${API_URL}${data.visual_proof_url}`} className="max-h-64 rounded border border-white/20" />
            </div>
          </div>

        </div>

        {/* RIGHT COL: RAW JSON */}
        <div className="bg-black/50 rounded border border-white/10 flex flex-col h-full overflow-hidden">
            <div className="bg-white/5 px-3 py-2 border-b border-white/10 flex items-center gap-2">
              <Code className="w-3 h-3 text-yellow-400" />
              <span className="font-bold">RAW JSON RESPONSE</span>
            </div>
            <pre className="p-4 overflow-auto text-[10px] text-green-300/80 leading-relaxed">
              {JSON.stringify(data, null, 2)}
            </pre>
        </div>

      </div>
    </motion.div>
  );
};