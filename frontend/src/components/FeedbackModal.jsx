import React, { useState } from 'react';
import { Check, X, AlertTriangle } from 'lucide-react';

const MATERIALS = ["Plastic", "Glass", "Metal", "Paper", "MLP", "Hazardous", "Milk Pouch (LDPE)", "Snack Packet (MLP)"];

export const FeedbackModal = ({ item, onClose }) => {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (correctLabel) => {
    setSubmitting(true);
    try {
      // --- FIX: Use relative path to work in any network environment ---
      await fetch('/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_path: item.visual_proof_url || "", 
          predicted_label: item.product_name,
          correct_label: correctLabel
        })
      });
      alert("Thanks! I've memorized this for next time.");
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to save feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 bg-yellow-500/10 rounded-full">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Teach Urban Miner</h3>
            <p className="text-sm text-slate-400">
              I identified this as <span className="text-red-400">{item.product_name}</span>. 
              What is it really?
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
          {MATERIALS.map((mat) => (
            <button
              key={mat}
              onClick={() => handleSubmit(mat)}
              disabled={submitting}
              className={`p-3 rounded-lg text-xs font-medium transition-all ${
                mat === item.product_name 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50 opacity-50 cursor-not-allowed'
                  : 'bg-white/5 hover:bg-green-500/20 hover:text-green-400 hover:border-green-500/50 border border-transparent'
              }`}
            >
              {mat}
            </button>
          ))}
        </div>

        <button 
          onClick={onClose}
          className="mt-4 w-full py-3 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 text-xs tracking-widest"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
};