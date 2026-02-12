/*braile/frontend/src/App.jsx*/

import React, { useState } from 'react';
import axios from 'axios';
import {
  Upload,
  Cpu,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  Globe,
  Sun,
  Moon,
  Copy,
  Check,
  RefreshCcw
} from 'lucide-react';

// Language configuration to match your backend ISO mapping
const SUPPORTED_LANGUAGES = [
  { name: "Hindi", code: "hindi" },
  { name: "Tamil", code: "tamil" },
  { name: "Telugu", code: "telugu" },
  { name: "Malayalam", code: "malayalam" },
  { name: "Marathi", code: "marathi" },
  { name: "Bengali", code: "bengali" },
  { name: "Kannada", code: "kannada" },
  { name: "Gujarati", code: "gujarati" },
  { name: "French", code: "french" },
  { name: "Spanish", code: "spanish" },
  { name: "German", code: "german" },
];

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mode, setMode] = useState("Digital/Black Dots");
  const [targetLang, setTargetLang] = useState("malayalam");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [theme, setTheme] = useState("light");
  const [copied, setCopied] = useState(false);

  const isDark = theme === "dark";

  const handleUpload = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null); 
  };

  const copyToClipboard = () => {
    if (result?.translated) {
      navigator.clipboard.writeText(result.translated);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const processScript = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);
    formData.append('target_lang', targetLang);

    try {
      const response = await axios.post('http://localhost:8000/translate', formData);
      setResult(response.data);
    } catch (error) {
      console.error("Backend unreachable", error);
      alert("⚠️ Connection Error: Ensure your Python backend is running at http://localhost:8000");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={isDark
      ? "min-h-screen bg-slate-950 text-amber-50 p-4 md:p-8 font-sans transition-colors duration-500"
      : "min-h-screen bg-amber-50 text-slate-900 p-4 md:p-8 font-sans transition-colors duration-500"
    }>
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {isDark ? (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_#451a03_0,_#020617_100%)]" />
        ) : (
          <>
            <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-yellow-200/40 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-amber-200/40 blur-[120px]" />
          </>
        )}
      </div>

      <div className="max-w-6xl mx-auto relative">
        {/* Top Header */}
        <header className="flex justify-between items-center mb-12">
          <div className="group cursor-default">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 text-white p-2.5 rounded-2xl shadow-xl shadow-amber-500/20 group-hover:rotate-12 transition-transform">
                <Sparkles size={28} />
              </div>
              <h1 className="text-4xl font-black tracking-tighter">
                Braille<span className="text-amber-600">Studio</span>
              </h1>
            </div>
            <p className={`text-xs mt-1.5 font-bold uppercase tracking-[0.2em] opacity-60 ml-14`}>
              AI-Powered Vision System
            </p>
          </div>
          
          <button 
            onClick={() => setTheme(isDark ? "light" : "dark")} 
            className={`p-3 rounded-2xl border transition-all active:scale-90 ${
              isDark ? "bg-slate-900 border-slate-700 text-yellow-400" : "bg-white border-amber-200 text-amber-600 shadow-sm"
            }`}
          >
            {isDark ? <Sun size={22} /> : <Moon size={22} />}
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN - CONTROLS */}
          <div className="lg:col-span-5 space-y-6">
            <section className={`p-6 rounded-[2.5rem] border transition-all ${
              isDark ? "bg-white/5 border-white/10" : "bg-white/80 border-white shadow-xl shadow-amber-900/5"
            }`}>
              <div className="flex justify-between items-center mb-4 px-2">
                <span className="text-[11px] uppercase font-black tracking-widest text-amber-600">01. Source Script</span>
                {preview && (
                   <button onClick={() => {setFile(null); setPreview(null); setResult(null);}} className="text-xs font-bold text-red-500 flex items-center gap-1 hover:opacity-80">
                     <RefreshCcw size={12} /> Clear
                   </button>
                )}
              </div>
              
              <label className={`group border-2 border-dashed rounded-[2rem] h-72 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative ${
                isDark ? "border-slate-700 bg-slate-900/50 hover:border-amber-500/50" : "border-amber-200 bg-amber-50/50 hover:bg-amber-100/50"
              }`}>
                {preview ? (
                  <img src={preview} alt="preview" className="h-full w-full object-contain p-2" />
                ) : (
                  <div className="text-center">
                    <div className={`p-5 rounded-full inline-block mb-4 transition-transform group-hover:-translate-y-2 ${isDark ? 'bg-slate-800 text-amber-500' : 'bg-amber-100 text-amber-600'}`}>
                      <Upload size={32} />
                    </div>
                    <p className="text-sm font-bold opacity-70">Click or Drag Image</p>
                    <p className="text-[10px] opacity-40 mt-1 uppercase tracking-tighter">JPG, PNG up to 10MB</p>
                  </div>
                )}
                <input type="file" className="hidden" onChange={handleUpload} accept="image/*" />
              </label>
            </section>

            <div className="grid grid-cols-2 gap-4">
              <div className={`p-5 rounded-3xl border ${isDark ? "bg-white/5 border-white/10" : "bg-white/80 border-white"}`}>
                <label className="text-[10px] uppercase font-black tracking-widest text-amber-600 mb-3 flex items-center gap-2">
                  <Cpu size={14}/> Algorithm
                </label>
                <select 
                  value={mode} 
                  onChange={(e)=>setMode(e.target.value)}
                  className={`w-full bg-transparent text-sm font-bold outline-none cursor-pointer`}
                >
                  <option value="Digital/Black Dots">Modern Digital</option>
                  <option value="Real Photo (Embossed)">Optical Photo</option>
                </select>
              </div>

              <div className={`p-5 rounded-3xl border ${isDark ? "bg-white/5 border-white/10" : "bg-white/80 border-white"}`}>
                <label className="text-[10px] uppercase font-black tracking-widest text-amber-600 mb-3 flex items-center gap-2">
                  <Globe size={14}/> Translation
                </label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className={`w-full bg-transparent text-sm font-bold outline-none cursor-pointer`}
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              onClick={processScript} 
              disabled={loading || !file} 
              className="group w-full py-6 bg-amber-500 hover:bg-amber-600 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-amber-500/40 transition-all transform active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-3 overflow-hidden relative"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" />
                  <span>Processing Neurons...</span>
                </>
              ) : (
                <>
                  <Sparkles size={22} className="group-hover:animate-pulse" />
                  <span>Execute Translation</span>
                </>
              )}
            </button>
          </div>

          {/* RIGHT COLUMN - RESULTS */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Visualization Card */}
            <div className={`p-5 rounded-[2.5rem] border overflow-hidden relative group ${
              isDark ? "bg-white/5 border-white/10" : "bg-white/80 border-white shadow-xl shadow-amber-900/5"
            }`}>
               <span className="text-[11px] uppercase font-black tracking-widest block mb-4 text-amber-600">AI Computer Vision Map</span>
               <div className={`rounded-[1.5rem] overflow-hidden min-h-[320px] flex items-center justify-center border transition-all ${
                 isDark ? "bg-slate-950 border-white/5" : "bg-white border-amber-100 shadow-inner"
               }`}>
                  {result?.image ? (
                    <img src={result.image} alt="AI output" className="w-full h-auto animate-in fade-in zoom-in duration-500" />
                  ) : (
                    <div className="text-center p-12 opacity-40">
                      <div className="relative inline-block">
                        <ImageIcon className="mx-auto mb-4" size={64} strokeWidth={1} />
                        <Loader2 className={`absolute -top-1 -right-1 text-amber-500 ${loading ? 'animate-spin' : 'hidden'}`} />
                      </div>
                      <p className="text-sm font-bold">Neural Map Visualization</p>
                      <p className="text-[10px] uppercase mt-1 tracking-tighter">Waiting for script processing...</p>
                    </div>
                  )}
               </div>
            </div> {/* <-- Error was here: changed </section> to </div> */}

            {/* Results Grid */}
            <div className="space-y-4">
              <div className={`p-6 rounded-3xl border-l-8 border-amber-500 transition-all ${
                isDark ? "bg-white/5 border-white/10" : "bg-white border-white shadow-lg"
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] uppercase font-black text-amber-600 tracking-tighter">02. Corrected English (LLM)</span>
                </div>
                <p className="text-xl font-bold tracking-tight">
                  {result?.ai || <span className="opacity-20">---</span>}
                </p>
              </div>

              <div className={`p-8 rounded-[3rem] border-2 transition-all relative overflow-hidden group ${
                isDark 
                ? "bg-amber-500/10 border-amber-500/30 text-amber-100" 
                : "bg-amber-500 text-white border-amber-400 shadow-2xl shadow-amber-500/40"
              }`}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className={`text-[11px] uppercase font-black tracking-[0.3em] ${isDark ? 'text-amber-500' : 'text-amber-200'}`}>
                      Final Global Output
                    </span>
                    <h3 className="text-xs font-bold opacity-80 mt-1 uppercase">Target: {targetLang}</h3>
                  </div>
                  
                  {result?.translated && (
                    <button 
                      onClick={copyToClipboard}
                      className={`p-3 rounded-2xl transition-all active:scale-90 ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-white/20 hover:bg-white/30 text-white'}`}
                    >
                      {copied ? <Check size={20} /> : <Copy size={20} />}
                    </button>
                  )}
                </div>

                <div className="text-4xl md:text-5xl font-black leading-tight tracking-tighter break-words">
                  {result?.translated || (
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-current opacity-20 animate-bounce" />
                      <div className="w-3 h-3 rounded-full bg-current opacity-20 animate-bounce [animation-delay:0.2s]" />
                      <div className="w-3 h-3 rounded-full bg-current opacity-20 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  )}
                </div>
                <Globe className="absolute -bottom-6 -right-6 w-32 h-32 opacity-10 rotate-12" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;