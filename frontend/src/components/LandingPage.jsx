import { motion } from 'framer-motion';
import { ArrowRight, Camera, Factory, Leaf, MapPinned, Recycle, Sparkles } from 'lucide-react';

const programs = [
  {
    image: '/slides/trash_crisis.jpg',
    title: 'Field Waste Audit',
    text: 'Capture, classify, and quantify mixed waste streams from ground-level collection points.'
  },
  {
    image: '/slides/vision_demo.jpg',
    title: 'Material Intelligence',
    text: 'Tri-model reasoning translates noisy images into clean, buyer-ready material outputs.'
  },
  {
    image: '/slides/market_graph.jpg',
    title: 'Market Activation',
    text: 'Semantic B2B matching connects each batch to nearest demand with price confidence.'
  }
];

const process = [
  { icon: Camera, title: 'Capture', text: 'Scan from camera or upload from gallery.' },
  { icon: Recycle, title: 'Classify', text: 'AI resolves composition and confidence layer.' },
  { icon: MapPinned, title: 'Match', text: 'Find top-fit recyclers and pricing instantly.' },
  { icon: Factory, title: 'Convert', text: 'Move from waste to industrial feedstock.' }
];

export const LandingPage = ({ onStart, onOpenPresentation }) => {
  return (
    <div className="relative h-full w-full overflow-y-auto overflow-x-hidden bg-[#f5f5f2] text-[#101826]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          aria-hidden
          className="absolute -top-32 -left-24 w-[500px] h-[500px] rounded-full bg-[#d7efe8] opacity-45 blur-3xl"
          animate={{ x: [0, 62, -18, 0], y: [0, 30, -18, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden
          className="absolute top-[18%] -right-20 w-[460px] h-[460px] rounded-full bg-[#efe1c9] opacity-40 blur-3xl"
          animate={{ x: [0, -42, 20, 0], y: [0, -24, 14, 0] }}
          transition={{ duration: 23, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden
          className="absolute -bottom-28 left-[32%] w-[380px] h-[380px] rounded-full bg-[#dce6fb] opacity-32 blur-3xl"
          animate={{ x: [0, 24, -16, 0], y: [0, -22, 10, 0] }}
          transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden
          className="absolute inset-0 opacity-[0.09] bg-[linear-gradient(rgba(16,24,38,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(16,24,38,0.35)_1px,transparent_1px)] bg-[size:52px_52px]"
          animate={{ backgroundPosition: ['0px 0px', '34px 18px', '0px 0px'] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <div className="relative z-10">
        <header className="sticky top-0 z-30 border-b border-black/5 backdrop-blur-xl bg-[#f5f5f2]/95">
          <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0e1b2e] to-[#1b3557] text-white font-black text-sm grid place-items-center">R</div>
              <div>
                <p className="text-sm font-black tracking-tight">ReLoop</p>
                <p className="text-[10px] text-slate-500 tracking-[0.18em] uppercase">Circular Infrastructure</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              <a href="#programs" className="hover:text-slate-800 transition">Programs</a>
              <a href="#about" className="hover:text-slate-800 transition">About</a>
              <a href="#process" className="hover:text-slate-800 transition">Workflow</a>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenPresentation}
                className="rounded-full px-4 py-2.5 text-xs font-bold border border-black/15 text-slate-700 hover:bg-white transition"
              >
                Open Presentation
              </button>
              <button onClick={onStart} className="rounded-full px-5 py-2.5 text-xs font-bold bg-[#f7b24a] text-[#111] hover:brightness-95 transition">
                Enter Scanner
              </button>
            </div>
          </div>
        </header>

        <section className="max-w-6xl mx-auto px-5 pt-10 pb-16 grid lg:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1 mb-5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#1a9778]" />
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-slate-600">Industrial Symbiosis Engine</span>
            </div>

            <h1 className="font-['Playfair_Display'] text-5xl md:text-6xl leading-[0.94] tracking-tight text-[#111827]">
              Circular value
              <br />
              begins where
              <br />
              waste meets insight
            </h1>

            <p className="mt-5 text-slate-600 text-base leading-relaxed max-w-xl">
              ReLoop unifies AI perception, operator feedback, and live industrial demand into one sleek operating interface for waste-to-resource workflows.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={onStart}
                className="rounded-full px-6 py-3 bg-[#111] text-white font-semibold inline-flex items-center gap-2 hover:bg-[#1f2937] transition"
              >
                Start Scanning <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenPresentation}
                className="rounded-full px-6 py-3 border border-black/15 text-slate-700 font-semibold hover:bg-white transition"
              >
                View Pitch Deck
              </button>
              <a
                href="#programs"
                className="rounded-full px-6 py-3 border border-black/15 text-slate-700 font-semibold hover:bg-white transition"
              >
                View Programs
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="relative h-[340px] md:h-[460px]"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-[95%] h-[92%]">
                <div className="absolute w-[40%] h-[84%] left-[8%] top-[8%] rounded-[60px] overflow-hidden shadow-xl rotate-[-18deg]">
                  <img src="/slides/trash_crisis.jpg" alt="field" className="w-full h-full object-cover" />
                </div>
                <div className="absolute w-[37%] h-[84%] left-[37%] top-[8%] rounded-[60px] overflow-hidden shadow-xl rotate-[14deg]">
                  <img src="/slides/vision_demo.jpg" alt="vision" className="w-full h-full object-cover" />
                </div>
                <div className="absolute w-[38%] h-[78%] left-[61%] top-[13%] rounded-[60px] overflow-hidden shadow-xl rotate-[-8deg]">
                  <img src="/slides/future_city.jpg" alt="future" className="w-full h-full object-cover" />
                </div>

                <div className="absolute w-16 h-16 rounded-full overflow-hidden border-4 border-white shadow-xl left-[8%] bottom-[2%]">
                  <img src="/slides/qdrant_visual.jpg" alt="small one" className="w-full h-full object-cover" />
                </div>
                <div className="absolute w-12 h-12 rounded-full overflow-hidden border-4 border-white shadow-xl left-[36%] bottom-[0%]">
                  <img src="/slides/market_graph.jpg" alt="small two" className="w-full h-full object-cover" />
                </div>

              </div>
            </div>
          </motion.div>
        </section>

        <section id="programs" className="max-w-6xl mx-auto px-5 pb-12">
          <div className="text-center mb-6">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Our Programs</p>
            <h2 className="font-['Playfair_Display'] text-4xl text-[#111827] mt-1">Designed for the circular field economy</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {programs.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.08, duration: 0.35 }}
                className="rounded-3xl border border-black/10 bg-white shadow-[0_15px_35px_rgba(0,0,0,0.05)] overflow-hidden"
              >
                <img src={feature.image} alt={feature.title} className="w-full h-44 object-cover" />
                <div className="p-5">
                  <h3 className="font-['Playfair_Display'] text-2xl leading-tight mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{feature.text}</p>
                  <button className="mt-4 rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.16em] border border-black/15 text-slate-700 font-semibold hover:bg-slate-100 transition">
                    Learn More
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="about" className="max-w-6xl mx-auto px-5 py-10">
          <div className="rounded-[34px] border border-black/10 bg-white p-7 md:p-9 shadow-[0_15px_35px_rgba(0,0,0,0.05)]">
            <p className="text-xs uppercase tracking-[0.2em] text-[#b89352] mb-3">About Us</p>
            <h2 className="font-['Playfair_Display'] text-4xl text-[#111827] max-w-3xl">Welcome to the ReLoop circular operations network</h2>
            <p className="mt-4 text-slate-600 max-w-4xl leading-relaxed">
              We help communities, waste workers, and industrial buyers participate in one transparent loop. ReLoop combines field capture,
              multilingual operator feedback, and vector-based demand intelligence to create trusted material pathways.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={onStart} className="rounded-full px-5 py-2.5 bg-[#1a9778] text-white font-semibold hover:brightness-95 transition">
                Get Started
              </button>
              <button className="rounded-full px-5 py-2.5 bg-[#101826] text-white font-semibold hover:bg-[#1d2940] transition">
                View Impact
              </button>
            </div>
          </div>
        </section>

        <section id="process" className="max-w-6xl mx-auto px-5 py-6">
          <div className="rounded-[30px] border border-black/10 bg-white p-6 md:p-8 shadow-[0_15px_35px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-2 mb-5">
              <Leaf className="w-4 h-4 text-[#1a9778]" />
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">How It Works</p>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              {process.map((step, index) => (
                <div key={step.title} className="rounded-2xl border border-black/10 bg-[#f8fafb] p-4">
                  <div className="flex items-center justify-between mb-2">
                    <step.icon className="w-5 h-5 text-[#1a9778]" />
                    <span className="text-[10px] font-mono text-slate-400">0{index + 1}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 mb-1">{step.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-5 pt-8 pb-12">
          <div className="rounded-[34px] border border-black/10 bg-[#101826] p-7 md:p-9 flex flex-col md:flex-row md:items-center md:justify-between gap-6 text-white">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-200 mb-2">Ready To Launch</p>
              <h3 className="font-['Playfair_Display'] text-3xl leading-tight">Give every waste batch a verified industrial destination</h3>
              <p className="text-sm text-slate-300 mt-2">Start the scanner and move from visual capture to actionable demand in one clean workflow.</p>
            </div>
            <button
              onClick={onStart}
              className="shrink-0 rounded-full px-6 py-3 bg-[#f7b24a] text-[#111] font-bold hover:brightness-95 transition"
            >
              Enter Scanner
            </button>
          </div>
        </section>

        <footer className="border-t border-black/10 bg-[#eceae3]">
          <div className="max-w-6xl mx-auto px-5 py-10 grid md:grid-cols-4 gap-8 text-sm">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0e1b2e] to-[#1b3557] text-white font-black text-xs grid place-items-center">R</div>
                <div>
                  <p className="font-bold text-slate-900">ReLoop</p>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Circular Infrastructure</p>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed text-xs">
                Turning liability into industrial feedstock through AI perception, memory, and market connectivity.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-3 uppercase tracking-[0.14em] text-[11px]">Platform</h4>
              <ul className="space-y-2 text-slate-600">
                <li><a href="#programs" className="hover:text-slate-900 transition">Programs</a></li>
                <li><a href="#about" className="hover:text-slate-900 transition">About</a></li>
                <li><a href="#process" className="hover:text-slate-900 transition">Workflow</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-3 uppercase tracking-[0.14em] text-[11px]">Contact</h4>
              <ul className="space-y-2 text-slate-600">
                <li>hello@reloop.ai</li>
                <li>+91 80000 700 999</li>
                <li>New Delhi, India</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-3 uppercase tracking-[0.14em] text-[11px]">Get Started</h4>
              <p className="text-slate-600 text-xs leading-relaxed mb-3">Run a live material scan and connect to active demand in one flow.</p>
              <button
                onClick={onStart}
                className="rounded-full px-4 py-2 bg-[#101826] text-white text-xs font-semibold hover:bg-[#1f2f49] transition"
              >
                Launch Scanner
              </button>
            </div>
          </div>

          <div className="border-t border-black/10">
            <div className="max-w-6xl mx-auto px-5 py-4 flex flex-col md:flex-row gap-2 items-start md:items-center justify-between text-[11px] text-slate-500">
              <p>2026 ReLoop. All rights reserved.</p>
              <p>Built for circular economy operations.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};
