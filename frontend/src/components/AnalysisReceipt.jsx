import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, ArrowRight, Coins, Factory, Leaf, ShieldCheck } from 'lucide-react';
import { FeedbackModal } from './FeedbackModal';
import { API_URL } from '../services/api';

export const AnalysisReceipt = ({ data, capturedImage, onReset, onBackToLanding }) => {
  const [showFeedback, setShowFeedback] = useState(null);

  const getAbsoluteImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  if (!data || !data.best_factory_match) {
    return (
      <div className="w-full h-full bg-[#f5f5f2] flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Analysis Failed</h2>
        <button onClick={onReset} className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-lg">Try Again</button>
      </div>
    );
  }

  const { batch_dna, best_factory_match, eco_impact, items, visual_proof_url, pipeline, decision_summary } = data;
  const proofImageUrl = getAbsoluteImageUrl(visual_proof_url);

  const confidenceValues = (items || [])
    .map((item) => Number(item.final_confidence_score))
    .filter((value) => Number.isFinite(value));

  const averageConfidence = confidenceValues.length
    ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length
    : 0.01;

  const getConfidenceBand = (value) => {
    if (!Number.isFinite(value)) return 'low';
    if (value >= 0.85) return 'high';
    if (value >= 0.6) return 'medium';
    return 'low';
  };

  const buildMatrixRow = (label, filterFn) => {
    const filtered = (items || []).filter(filterFn);
    const row = { label, total: filtered.length, high: 0, medium: 0, low: 0 };
    filtered.forEach((item) => {
      const band = getConfidenceBand(Number(item.final_confidence_score));
      row[band] += 1;
    });
    return row;
  };

  const matrixRows = [
    buildMatrixRow('Overall', () => true),
    buildMatrixRow('Vision Agent', (item) => (item.source_of_truth || '').includes('Vision')),
    buildMatrixRow('Memory Agent', (item) => (item.source_of_truth || '').includes('Memory')),
    buildMatrixRow('Voice Command', (item) => (item.source_of_truth || '').includes('Voice')),
  ];

  const getMaterialColor = (material) => {
    if (material === 'Plastic') return 'from-emerald-400 to-green-300';
    if (material === 'MLP') return 'from-orange-400 to-amber-300';
    if (material === 'Hazardous') return 'from-red-500 to-rose-400';
    if (material === 'Glass') return 'from-sky-400 to-cyan-300';
    if (material === 'Metal') return 'from-indigo-400 to-blue-300';
    return 'from-slate-400 to-slate-300';
  };

  const compositionEntries = Object.entries(batch_dna || {});

  return (
    <div className="w-full h-full bg-[#f5f5f2] flex flex-col relative overflow-y-auto pb-32 font-sans text-slate-800">
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(900px_420px_at_50%_-10%,#e7eef4,transparent_70%)]" />

      <div className="relative p-6 pt-5 border-b border-black/10 bg-white/75 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3 mb-4">
          <button
            onClick={onBackToLanding}
            className="rounded-full bg-white border border-black/10 px-4 py-2 text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-sm hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back To Landing
          </button>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-semibold">Scan Receipt</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">Analysis Summary</h1>
            <p className="mt-1 text-[11px] text-slate-600">Confidence-first review with visual proof and verification matrix.</p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white px-3 py-2 shadow-sm text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Market Mention</p>
            <p className="text-xs text-slate-700 mt-0.5">INR {best_factory_match.offer_price} from {best_factory_match.factory_name}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-violet-300/35 bg-violet-50 px-3 py-2">
            <div className="text-violet-700 text-[10px] uppercase tracking-widest font-semibold">Avg Confidence</div>
            <p className="text-lg font-extrabold text-slate-900 mt-1">{Math.round(averageConfidence * 100)}%</p>
          </div>
          <div className="rounded-xl border border-emerald-300/35 bg-emerald-50 px-3 py-2">
            <div className="flex items-center gap-2 text-emerald-700 text-[10px] uppercase tracking-widest font-semibold">
              <Leaf className="w-3.5 h-3.5" /> Carbon Saved
            </div>
            <p className="text-lg font-extrabold text-slate-900 mt-1">{eco_impact.saved_carbon_kg}kg</p>
          </div>
          <div className="rounded-xl border border-cyan-300/35 bg-cyan-50 px-3 py-2">
            <div className="flex items-center gap-2 text-cyan-700 text-[10px] uppercase tracking-widest font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" /> Credits
            </div>
            <p className="text-lg font-extrabold text-slate-900 mt-1">+{eco_impact.credits_earned}</p>
          </div>
        </div>
      </div>

      <div className="relative p-6 space-y-6">
        <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600">Batch Composition</h3>
            <span className="text-[10px] font-mono text-slate-500">{items.length} units</span>
          </div>
          <div className="space-y-2.5">
            {compositionEntries.map(([material, stats]) => (
              <div key={material}>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-700 font-medium">{material}</span>
                  <span className="text-slate-500 font-mono">{stats.percent}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.percent}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full bg-gradient-to-r ${getMaterialColor(material)}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600">Accuracy Matrix</h3>
              <p className="text-[11px] text-slate-500 mt-1">Confidence distribution by inference source.</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Overall</p>
              <p className="text-sm font-bold text-slate-900">{Math.round(averageConfidence * 100)}% confidence</p>
            </div>
          </div>

          <div className="rounded-xl border border-black/10 overflow-hidden">
            <div className="grid grid-cols-5 bg-slate-50 text-[10px] uppercase tracking-widest font-semibold text-slate-600">
              <div className="px-3 py-2">Source</div>
              <div className="px-3 py-2 text-center">High</div>
              <div className="px-3 py-2 text-center">Medium</div>
              <div className="px-3 py-2 text-center">Low</div>
              <div className="px-3 py-2 text-center">Total</div>
            </div>

            {matrixRows.map((row) => (
              <div key={row.label} className="grid grid-cols-5 border-t border-black/5 text-xs text-slate-700">
                <div className="px-3 py-2.5 font-semibold">{row.label}</div>
                <div className="px-3 py-2.5 text-center text-emerald-700 font-semibold">{row.high}</div>
                <div className="px-3 py-2.5 text-center text-amber-700 font-semibold">{row.medium}</div>
                <div className="px-3 py-2.5 text-center text-rose-700 font-semibold">{row.low}</div>
                <div className="px-3 py-2.5 text-center font-semibold">{row.total}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="mb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600">Visual Identification</h3>
            <p className="text-[11px] text-slate-500 mt-1">Your uploaded image and the AI-marked image with identified objects.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Uploaded Image</p>
              <div className="rounded-xl overflow-hidden border border-black/10 bg-slate-100 min-h-44 flex items-center justify-center">
                {capturedImage ? (
                  <img src={capturedImage} alt="Uploaded waste" className="w-full h-full object-cover" />
                ) : (
                  <p className="text-xs text-slate-500">No image preview available</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">AI Identified Objects</p>
              <div className="rounded-xl overflow-hidden border border-emerald-300/40 bg-slate-100 min-h-44 flex items-center justify-center">
                {proofImageUrl ? (
                  <img src={proofImageUrl} alt="Detected objects with boxes" className="w-full h-full object-cover" />
                ) : (
                  <p className="text-xs text-slate-500">Marked image not available for this scan</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-sky-200 bg-sky-50 p-4 relative overflow-hidden shadow-sm">
          <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-sky-200/40 blur-2xl" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center text-sky-700 font-black">
                <Factory className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-sky-700 font-semibold">Short Market Note</p>
                <h3 className="text-slate-900 font-bold text-sm">{best_factory_match.factory_name}</h3>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
              <Coins className="w-4 h-4" /> INR {best_factory_match.offer_price}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600">WA-YOLO Pipeline</h3>
            <span className="text-[10px] text-slate-500 font-mono">Sort: {decision_summary?.sort ?? 0} | Reject: {decision_summary?.reject ?? 0}</span>
          </div>

          {pipeline?.stages?.length ? (
            <div className="grid md:grid-cols-2 gap-2 mb-4">
              {pipeline.stages.map((stage, index) => (
                <div key={stage} className="rounded-lg border border-black/10 bg-slate-50 px-3 py-2 text-[11px] text-slate-700">
                  <span className="text-slate-500 font-mono mr-2">{String(index + 1).padStart(2, '0')}</span>
                  {stage}
                </div>
              ))}
            </div>
          ) : null}

          <div className="rounded-xl border border-black/10 overflow-hidden">
            <div className="grid grid-cols-4 bg-slate-50 text-[10px] uppercase tracking-widest font-semibold text-slate-600">
              <div className="px-3 py-2">Item</div>
              <div className="px-3 py-2 text-center">Contam</div>
              <div className="px-3 py-2 text-center">Decision</div>
              <div className="px-3 py-2 text-center">Actuator</div>
            </div>
            {(decision_summary?.actuator_plan || []).map((row, idx) => (
              <div key={`${row.item}-${idx}`} className="grid grid-cols-4 border-t border-black/5 text-xs text-slate-700">
                <div className="px-3 py-2.5 font-medium truncate">{row.item}</div>
                <div className="px-3 py-2.5 text-center font-semibold">{Math.max(1, Math.round(Number(row.contamination_score || 0) * 100))}%</div>
                <div className={`px-3 py-2.5 text-center font-bold ${row.decision === 'SORT' ? 'text-emerald-700' : 'text-rose-700'}`}>{row.decision}</div>
                <div className="px-3 py-2.5 text-center font-mono text-[10px]">{row.route}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-600">Item Verification</h3>
          <div className="rounded-2xl border border-black/10 bg-white divide-y divide-black/5 max-h-72 overflow-y-auto shadow-sm">
            {items && items.map((item, i) => (
              <div key={i} className="p-3 flex justify-between items-center group hover:bg-slate-50 transition-colors">
                <div className="pr-2">
                  <p className="text-sm text-slate-800 font-medium leading-tight">{item.product_name}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">{item.source_of_truth}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-1 rounded-lg border border-black/10 bg-slate-100 text-slate-700 font-semibold min-w-14 text-center">
                    {Number.isFinite(Number(item.final_confidence_score)) ? `${Math.max(1, Math.round(Number(item.final_confidence_score) * 100))}%` : 'N/A'}
                  </span>
                  <button
                    onClick={() => setShowFeedback(item)}
                    className="text-[10px] px-2.5 py-1 rounded-lg border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 transition-all"
                  >
                    Correct
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#f5f5f2] via-[#f5f5f2] to-transparent z-20">
        <button
          onClick={onReset}
          className="w-full py-4 rounded-2xl bg-[#111827] text-white font-black active:scale-[0.99] transition-transform flex items-center justify-center gap-2 hover:bg-[#1f2937]"
        >
          Scan Next Batch <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {showFeedback && <FeedbackModal item={showFeedback} onClose={() => setShowFeedback(null)} />}
    </div>
  );
};