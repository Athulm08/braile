/*braile/frontend/src/App.jsx*/

import React, { useState } from 'react';
import axios from 'axios';
import {
  Upload,
  Cpu,
  Sparkles,
  FileText,
  Loader2,
  Image as ImageIcon,
  Globe,
  Sun,
  Moon
} from 'lucide-react';

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mode, setMode] = useState("Digital/Black Dots");
  const [targetLang, setTargetLang] = useState("hindi");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [theme, setTheme] = useState("light");

  const isDark = theme === "dark";

  const handleUpload = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
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
      alert("Make sure backend/src/main.py is running!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={isDark
      ? "min-h-screen bg-slate-950 text-amber-50 p-4 md:p-8 font-sans relative overflow-hidden transition-colors duration-500"
      : "min-h-screen bg-amber-50 text-slate-900 p-4 md:p-8 font-sans relative overflow-hidden transition-colors duration-500"
    }>
      
      {/* Beautiful Sunny Background Gradients */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {isDark ? (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#451a03_0,_#020617_70%)]" />
        ) : (
          <>
            <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-yellow-200/50 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-amber-200/50 blur-[120px]" />
          </>
        )}
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Header & Theme Toggle */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
              <span className="bg-amber-500 text-white p-2 rounded-xl shadow-lg shadow-amber-500/30">
                <Sparkles size={28} />
              </span>
              Braille<span className="text-amber-600">Studio</span>
            </h1>
            <p className={`text-sm mt-1 font-medium ${isDark ? "text-amber-200/60" : "text-slate-500"}`}>
              Modern AI Braille Translation Portal
            </p>
          </div>
          
          <button 
            onClick={() => setTheme(isDark ? "light" : "dark")} 
            className={`p-3 rounded-2xl border transition-all duration-300 ${
              isDark ? "bg-slate-900 border-slate-700 text-yellow-400" : "bg-white border-amber-200 text-amber-600 shadow-sm"
            }`}
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* LEFT PANEL: INPUTS */}
          <div className="space-y-6">
            
            {/* 1. Upload Section */}
            <div className={`p-6 rounded-3xl backdrop-blur-md border transition-all ${
              isDark ? "bg-white/5 border-white/10" : "bg-white/70 border-white shadow-xl shadow-amber-900/5"
            }`}>
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-amber-600 mb-4 block">1. Source Image</span>
              <label className={`border-2 border-dashed rounded-2xl h-64 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-[1.01] overflow-hidden ${
                isDark ? "border-slate-700 bg-slate-900/50" : "border-amber-200 bg-amber-50/50 hover:bg-amber-100/50"
              }`}>
                {preview ? (
                  <img src={preview} alt="preview" className="h-full w-full object-contain" />
                ) : (
                  <div className="text-center">
                    <div className="bg-amber-100 text-amber-600 p-4 rounded-full inline-block mb-3">
                      <Upload size={32} />
                    </div>
                    <p className="text-sm font-semibold">Drop Braille image here</p>
                  </div>
                )}
                <input type="file" className="hidden" onChange={handleUpload} />
              </label>
            </div>

            {/* 2. Controls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-5 rounded-3xl border ${isDark ? "bg-white/5 border-white/10" : "bg-white/70 border-white"}`}>
                <span className="text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 mb-3 text-amber-600">
                  <Cpu size={14}/> Scan Mode
                </span>
                <select 
                  value={mode} 
                  onChange={(e)=>setMode(e.target.value)}
                  className={`w-full p-3 rounded-xl text-sm font-medium outline-none border transition-all ${
                    isDark ? "bg-slate-900 border-slate-700" : "bg-white border-amber-100 focus:border-amber-400"
                  }`}
                >
                  <option>Digital/Black Dots</option>
                  <option>Real Photo (Embossed)</option>
                </select>
              </div>

              <div className={`p-5 rounded-3xl border ${isDark ? "bg-white/5 border-white/10" : "bg-white/70 border-white"}`}>
                <span className="text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 mb-3 text-amber-600">
                  <Globe size={14}/> Target Lang
                </span>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className={`w-full p-3 rounded-xl text-sm font-medium outline-none border transition-all ${
                    isDark ? "bg-slate-900 border-slate-700" : "bg-white border-amber-100 focus:border-amber-400"
                  }`}
                >
                  <option value="hindi">Hindi</option>
                  <option value="telugu">Telugu</option>
                  <option value="tamil">Tamil</option>
                  <option value="marathi">Marathi</option>
                  <option value="french">French</option>
                  <option value="spanish">Spanish</option>
                </select>
              </div>
            </div>

            <button 
              onClick={processScript} 
              disabled={loading || !file} 
              className="w-full py-5 bg-amber-500 hover:bg-amber-600 text-white rounded-3xl font-bold text-lg shadow-2xl shadow-amber-500/40 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={22} />}
              {loading ? "Analyzing Braille Patterns..." : "Translate Script Now"}
            </button>
          </div>

          {/* RIGHT PANEL: RESULTS */}
          <div className="space-y-6">
            
            <div className={`p-4 rounded-3xl border overflow-hidden relative ${
              isDark ? "bg-white/5 border-white/10" : "bg-white/70 border-white shadow-lg"
            }`}>
               <span className="text-[10px] uppercase font-bold tracking-widest block mb-3 text-amber-600">AI Segmentation Map</span>
               <div className={`rounded-2xl overflow-hidden min-h-[200px] flex items-center justify-center border ${isDark ? "bg-slate-950 border-white/5" : "bg-amber-50/50 border-amber-100"}`}>
                  {result?.image ? (
                    <img src={result.image} alt="AI output" className="w-full h-auto" />
                  ) : (
                    <div className="text-center p-10">
                      <ImageIcon className="mx-auto text-amber-200 mb-2" size={48} />
                      <p className="text-xs text-amber-400 font-medium">Visualization will load here</p>
                    </div>
                  )}
               </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Refined Result Box */}
              <div className={`p-5 rounded-3xl border-l-4 border-l-amber-500 ${isDark ? "bg-white/5 border-white/10" : "bg-white/80 border-white shadow-md"}`}>
                <span className="text-[10px] uppercase font-bold text-amber-600 block mb-1">Refined English</span>
                <p className="text-lg font-semibold tracking-tight">{result?.ai || "---"}</p>
              </div>

              {/* Translation Box */}
              <div className={`p-6 rounded-[2rem] border-2 transition-all ${
                isDark 
                ? "bg-amber-500/10 border-amber-500/30 text-amber-100" 
                : "bg-amber-500 text-white border-amber-400 shadow-2xl shadow-amber-500/30"
              }`}>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[11px] uppercase font-black tracking-[0.3em] opacity-80">Final Translation</span>
                  <div className="bg-white/20 p-1 px-3 rounded-full text-[10px] font-bold">{targetLang.toUpperCase()}</div>
                </div>
                <div className="text-3xl font-bold leading-tight drop-shadow-sm">
                  {result?.translated || "Waiting for input..."}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default App;