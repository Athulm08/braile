import React, { useState } from 'react';
import axios from 'axios';
import {
  Upload, Cpu, Sparkles, Loader2, Image as ImageIcon,
  Globe, Sun, Moon, Copy, Check, RefreshCcw, ScanLine, Keyboard, Download, Type, Volume2
} from 'lucide-react';

const SUPPORTED_LANGUAGES =[
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

// Map languages to Google TTS short codes
const GTTS_LANG_MAP = {
  "hindi": "hi",
  "tamil": "ta",
  "telugu": "te",
  "malayalam": "ml",
  "marathi": "mr",
  "bengali": "bn",
  "kannada": "kn",
  "gujarati": "gu",
  "french": "fr",
  "spanish": "es",
  "german": "de",
  "english": "en"
};

function App() {
  const [activeTab, setActiveTab] = useState("scan"); 
  const [targetLang, setTargetLang] = useState("malayalam");
  
  // Tab 1: Image Scanner
  const [file, setFile] = useState(null);
  const[preview, setPreview] = useState(null);
  const [mode, setMode] = useState("Digital/Black Dots");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Tab 2: Text to Braille Generator
  const [inputText, setInputText] = useState("");
  const[generatedBraille, setGeneratedBraille] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genCopied, setGenCopied] = useState(false);

  // Tab 3: Braille Unicode to Text Decoder
  const [decodeInput, setDecodeInput] = useState("");
  const[decodeResult, setDecodeResult] = useState(null);
  const [decoding, setDecoding] = useState(false);
  const [decodeCopied, setDecodeCopied] = useState(false);

  const [theme, setTheme] = useState("light");
  const [isSpeaking, setIsSpeaking] = useState(false); // Global Audio State
  const isDark = theme === "dark";

  const handleUpload = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null); 
  };

  const copyToClipboard = (text, setCopiedState) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2000);
    }
  };

  // --- NATIVE CLOUD AUDIO FETCH ---
  const speakText = async (text, lang) => {
    if (!text || isSpeaking) return;
    setIsSpeaking(true);
    
    const langCode = GTTS_LANG_MAP[lang.toLowerCase()] || "en";
    
    try {
      const response = await axios.post('http://localhost:8000/generate-audio', {
        text: text,
        lang: langCode
      });
      
      if (response.data.audio) {
        const audio = new Audio(response.data.audio);
        audio.onended = () => setIsSpeaking(false);
        audio.play();
      } else {
        alert("Audio generation failed.");
        setIsSpeaking(false);
      }
    } catch (err) {
      console.error("Audio error:", err);
      alert("⚠️ Connection Error: Ensure Python backend is running.");
      setIsSpeaking(false);
    }
  };

  const downloadBrailleAsImage = () => {
    if (!generatedBraille) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const padding = 80;
    const maxWidth = 1000;
    const lineHeight = 90;
    ctx.font = "bold 60px sans-serif";
    const rawLines = generatedBraille.split('\n');
    const wrappedLines =[];
    rawLines.forEach(line => {
      const words = line.split(' ');
      let currentLine = '';
      words.forEach(word => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
          wrappedLines.push(currentLine);
          currentLine = word;
        } else { currentLine = testLine; }
      });
      if (currentLine) wrappedLines.push(currentLine);
    });
    canvas.width = maxWidth + padding * 2;
    canvas.height = (wrappedLines.length * lineHeight) + (padding * 2);
    ctx.fillStyle = isDark ? "#0f172a" : "#fefce8"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = isDark ? "#f8fafc" : "#1e293b"; 
    ctx.font = "bold 60px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    wrappedLines.forEach((line, index) => {
      ctx.fillText(line, padding, padding + (index * lineHeight));
    });
    const link = document.createElement("a");
    link.download = "BrailleStudio_Translation.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
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
      alert("⚠️ Connection Error: Ensure Python backend is running.");
    } finally { setLoading(false); }
  };

  const generateBraille = async () => {
    if (!inputText.trim()) return;
    setGenerating(true);
    try {
      const response = await axios.post('http://localhost:8000/generate-braille', { text: inputText });
      setGeneratedBraille(response.data.braille);
    } catch (error) {
      alert("⚠️ Connection Error: Ensure Python backend is running.");
    } finally { setGenerating(false); }
  };

  const decodeBrailleText = async () => {
    if (!decodeInput.trim()) return;
    setDecoding(true);
    try {
      const response = await axios.post('http://localhost:8000/translate-braille-text', { 
        braille_text: decodeInput,
        target_lang: targetLang
      });
      setDecodeResult(response.data);
    } catch (error) {
      alert("⚠️ Connection Error: Ensure Python backend is running.");
    } finally { setDecoding(false); }
  };

  return (
    <div className={isDark ? "min-h-screen bg-slate-950 text-amber-50 p-4 md:p-8 font-sans transition-colors duration-500" : "min-h-screen bg-amber-50 text-slate-900 p-4 md:p-8 font-sans transition-colors duration-500"}>
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {isDark ? (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_#451a03_0,_#020617_100%)]" />
        ) : (
          <><div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-yellow-200/40 blur-[120px]" /><div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-amber-200/40 blur-[120px]" /></>
        )}
      </div>

      <div className="max-w-6xl mx-auto relative">
        <header className="flex justify-between items-center mb-10">
          <div className="group cursor-default">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 text-white p-2.5 rounded-2xl shadow-xl shadow-amber-500/20 group-hover:rotate-12 transition-transform">
                <Sparkles size={28} />
              </div>
              <h1 className="text-4xl font-black tracking-tighter">Braille<span className="text-amber-600">Studio</span></h1>
            </div>
            <p className="text-xs mt-1.5 font-bold uppercase tracking-[0.2em] opacity-60 ml-14">AI-Powered Vision System</p>
          </div>
          <button onClick={() => setTheme(isDark ? "light" : "dark")} className={`p-3 rounded-2xl border transition-all active:scale-90 ${isDark ? "bg-slate-900 border-slate-700 text-yellow-400" : "bg-white border-amber-200 text-amber-600 shadow-sm"}`}>
            {isDark ? <Sun size={22} /> : <Moon size={22} />}
          </button>
        </header>

        <div className="flex justify-center mb-10">
          <div className={`p-1.5 rounded-2xl border inline-flex ${isDark ? 'bg-white/5 border-white/10' : 'bg-white/80 border-amber-200 shadow-sm'}`}>
            <button onClick={() => setActiveTab("scan")} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === "scan" ? 'bg-amber-500 text-white shadow-md' : 'opacity-60 hover:opacity-100'}`}>
              <ScanLine size={18} /> Image to Text
            </button>
            <button onClick={() => setActiveTab("decode")} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === "decode" ? 'bg-amber-500 text-white shadow-md' : 'opacity-60 hover:opacity-100'}`}>
              <Type size={18} /> Braille to Text
            </button>
            <button onClick={() => setActiveTab("generate")} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === "generate" ? 'bg-amber-500 text-white shadow-md' : 'opacity-60 hover:opacity-100'}`}>
              <Keyboard size={18} /> Text to Braille
            </button>
          </div>
        </div>

        {/* TAB 1: IMAGE SCANNER */}
        {activeTab === "scan" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-5 space-y-6">
              <section className={`p-6 rounded-[2.5rem] border transition-all ${isDark ? "bg-white/5 border-white/10" : "bg-white/80 border-white shadow-xl shadow-amber-900/5"}`}>
                <div className="flex justify-between items-center mb-4 px-2">
                  <span className="text-[11px] uppercase font-black tracking-widest text-amber-600">01. Source Script</span>
                  {preview && <button onClick={() => {setFile(null); setPreview(null); setResult(null);}} className="text-xs font-bold text-red-500 flex items-center gap-1 hover:opacity-80"><RefreshCcw size={12} /> Clear</button>}
                </div>
                <label className={`group border-2 border-dashed rounded-[2rem] h-72 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative ${isDark ? "border-slate-700 bg-slate-900/50 hover:border-amber-500/50" : "border-amber-200 bg-amber-50/50 hover:bg-amber-100/50"}`}>
                  {preview ? <img src={preview} alt="preview" className="h-full w-full object-contain p-2" /> : <div className="text-center"><div className={`p-5 rounded-full inline-block mb-4 transition-transform group-hover:-translate-y-2 ${isDark ? 'bg-slate-800 text-amber-500' : 'bg-amber-100 text-amber-600'}`}><Upload size={32} /></div><p className="text-sm font-bold opacity-70">Click or Drag Image</p></div>}
                  <input type="file" className="hidden" onChange={handleUpload} accept="image/*" />
                </label>
              </section>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-5 rounded-3xl border ${isDark ? "bg-white/5 border-white/10" : "bg-white/80 border-white"}`}>
                  <label className="text-[10px] uppercase font-black tracking-widest text-amber-600 mb-3 flex items-center gap-2"><Cpu size={14}/> Algorithm</label>
                  <select value={mode} onChange={(e)=>setMode(e.target.value)} className="w-full bg-transparent text-sm font-bold outline-none cursor-pointer">
                    <option value="Digital/Black Dots">Modern Digital</option>
                    <option value="Real Photo (Embossed)">Optical Photo</option>
                  </select>
                </div>
                <div className={`p-5 rounded-3xl border ${isDark ? "bg-white/5 border-white/10" : "bg-white/80 border-white"}`}>
                  <label className="text-[10px] uppercase font-black tracking-widest text-amber-600 mb-3 flex items-center gap-2"><Globe size={14}/> Translation</label>
                  <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="w-full bg-transparent text-sm font-bold outline-none cursor-pointer">
                    {SUPPORTED_LANGUAGES.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={processScript} disabled={loading || !file} className="group w-full py-6 bg-amber-500 hover:bg-amber-600 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-amber-500/40 transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-3"><Sparkles size={22} /> Execute Translation</button>
            </div>
            
            <div className="lg:col-span-7 space-y-6">
              <div className={`p-5 rounded-[2.5rem] border ${isDark ? "bg-white/5 border-white/10" : "bg-white/80 border-white"}`}>
                <span className="text-[11px] uppercase font-black tracking-widest block mb-4 text-amber-600">AI Computer Vision Map</span>
                <div className={`rounded-[1.5rem] overflow-hidden min-h-[320px] flex items-center justify-center border ${isDark ? "bg-slate-950 border-white/5" : "bg-white border-amber-100 shadow-inner"}`}>
                    {result?.image ? <img src={result.image} alt="AI output" className="w-full h-auto" /> : <ImageIcon size={64} className="opacity-20" />}
                </div>
              </div>
              <div className="space-y-4">
                <div className={`p-6 rounded-3xl border-l-8 border-amber-500 ${isDark ? "bg-white/5" : "bg-white shadow-lg"}`}>
                  <span className="text-[10px] uppercase font-black text-amber-600 tracking-tighter mb-2 block">02. Corrected English (LLM)</span>
                  <p className="text-xl font-bold tracking-tight">{result?.ai || <span className="opacity-20">---</span>}</p>
                </div>
                <div className={`p-8 rounded-[3rem] border-2 relative group ${isDark ? "bg-amber-500/10 border-amber-500/30 text-amber-100" : "bg-amber-500 text-white border-amber-400 shadow-2xl shadow-amber-500/40"}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div><span className={`text-[11px] uppercase font-black tracking-[0.3em] ${isDark ? 'text-amber-500' : 'text-amber-200'}`}>Final Global Output</span><h3 className="text-xs font-bold opacity-80 mt-1 uppercase">Target: {targetLang}</h3></div>
                    
                    {result?.translated && (
                      <div className="flex gap-2">
                        <button onClick={() => speakText(result.translated, targetLang)} disabled={isSpeaking} className="p-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white transition-all active:scale-90" title="Listen to Translation">
                          {isSpeaking ? <Loader2 size={20} className="animate-spin" /> : <Volume2 size={20} />}
                        </button>
                        <button onClick={() => copyToClipboard(result.translated, setCopied)} className="p-3 rounded-2xl bg-white/20 hover:bg-white/30 text-white transition-all active:scale-90" title="Copy Text">
                          {copied ? <Check size={20} /> : <Copy size={20} />}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="text-4xl md:text-5xl font-black leading-tight tracking-tighter break-words" style={{ lineHeight: '1.4' }}>{result?.translated || "..."}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BRAILLE DECODER */}
        {activeTab === "decode" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-5 space-y-6">
              <section className={`p-6 rounded-[2.5rem] border transition-all ${isDark ? "bg-white/5 border-white/10" : "bg-white/80 border-white shadow-xl shadow-amber-900/5"}`}>
                <span className="text-[11px] uppercase font-black tracking-widest text-amber-600 mb-4 block">Paste Braille Script</span>
                <textarea 
                  rows="6"
                  value={decodeInput}
                  onChange={(e) => setDecodeInput(e.target.value)}
                  placeholder="Paste Unicode Braille here... (e.g., ⠃⠥⠞⠞⠑⠗⠋⠇⠽)"
                  className={`w-full p-6 rounded-3xl outline-none text-3xl font-medium resize-none transition-all ${
                    isDark ? "bg-slate-900/50 text-white focus:bg-slate-900" : "bg-amber-50/50 text-slate-800 focus:bg-white focus:ring-4 ring-amber-100"
                  }`}
                />
              </section>
              
              <div className={`p-5 rounded-3xl border ${isDark ? "bg-white/5 border-white/10" : "bg-white/80 border-white"}`}>
                <label className="text-[10px] uppercase font-black tracking-widest text-amber-600 mb-3 flex items-center gap-2"><Globe size={14}/> Translation</label>
                <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="w-full bg-transparent text-sm font-bold outline-none cursor-pointer">
                  {SUPPORTED_LANGUAGES.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                </select>
              </div>

              <button 
                onClick={decodeBrailleText} 
                disabled={decoding || !decodeInput.trim()} 
                className="group w-full py-6 bg-amber-500 hover:bg-amber-600 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-amber-500/40 transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-3"
              >
                {decoding ? <><Loader2 className="animate-spin" /><span>Decoding...</span></> : <><Sparkles size={22} /><span>Execute Translation</span></>}
              </button>
            </div>
            
            <div className="lg:col-span-7 space-y-6">
              <div className={`p-6 rounded-3xl border-l-8 border-amber-500 transition-all ${isDark ? "bg-white/5 border-white/10" : "bg-white border-white shadow-lg"}`}>
                <span className="text-[10px] uppercase font-black text-amber-600 tracking-tighter mb-2 block">01. Corrected English (LLM)</span>
                <p className="text-2xl font-bold tracking-tight">{decodeResult?.ai || <span className="opacity-20">Waiting for input...</span>}</p>
              </div>

              <div className={`p-8 rounded-[3rem] border-2 transition-all relative overflow-hidden group ${isDark ? "bg-amber-500/10 border-amber-500/30 text-amber-100" : "bg-amber-500 text-white border-amber-400 shadow-2xl shadow-amber-500/40"}`}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className={`text-[11px] uppercase font-black tracking-[0.3em] ${isDark ? 'text-amber-500' : 'text-amber-200'}`}>Final Global Output</span>
                    <h3 className="text-xs font-bold opacity-80 mt-1 uppercase">Target: {targetLang}</h3>
                  </div>
                  
                  {decodeResult?.translated && (
                    <div className="flex gap-2">
                        <button onClick={() => speakText(decodeResult.translated, targetLang)} disabled={isSpeaking} className={`p-3 rounded-2xl transition-all active:scale-90 ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-white/20 hover:bg-white/30 text-white'}`} title="Listen to Translation">
                          {isSpeaking ? <Loader2 size={20} className="animate-spin" /> : <Volume2 size={20} />}
                        </button>
                        <button onClick={() => copyToClipboard(decodeResult.translated, setDecodeCopied)} className={`p-3 rounded-2xl transition-all active:scale-90 ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-white/20 hover:bg-white/30 text-white'}`} title="Copy Text">
                          {decodeCopied ? <Check size={20} /> : <Copy size={20} />}
                        </button>
                    </div>
                  )}
                </div>
                <div className="text-4xl md:text-5xl font-black leading-tight tracking-tighter break-words" style={{ lineHeight: '1.4' }}>
                  {decodeResult?.translated || <div className="flex gap-2"><div className="w-3 h-3 rounded-full bg-current opacity-20 animate-bounce" /></div>}
                </div>
                <Globe className="absolute -bottom-6 -right-6 w-32 h-32 opacity-10 rotate-12" />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GENERATOR */}
        {activeTab === "generate" && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className={`p-6 rounded-[2.5rem] border transition-all ${isDark ? "bg-white/5 border-white/10" : "bg-white/80 border-white shadow-xl shadow-amber-900/5"}`}>
              <span className="text-[11px] uppercase font-black tracking-widest text-amber-600 mb-4 block">Enter Text</span>
              <textarea rows="4" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="Type English text or numbers to generate Braille..." className={`w-full p-6 rounded-3xl outline-none text-xl font-medium resize-none transition-all ${isDark ? "bg-slate-900/50 text-white focus:bg-slate-900" : "bg-amber-50/50 text-slate-800 focus:bg-white focus:ring-4 ring-amber-100"}`} />
              <button onClick={generateBraille} disabled={generating || !inputText.trim()} className="mt-4 w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-[1.5rem] font-black shadow-lg shadow-amber-500/30 transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-3"><Keyboard size={20} /> Generate Braille Dots</button>
            </section>
            <div className={`p-8 rounded-[3rem] border transition-all relative overflow-hidden ${isDark ? "bg-slate-900 border-slate-700 text-slate-100 shadow-xl" : "bg-white border-amber-200 text-slate-800 shadow-xl shadow-amber-900/5"}`}>
              <div className="flex justify-between items-start mb-6">
                <span className={`text-[11px] uppercase font-black tracking-[0.3em] ${isDark ? 'text-amber-500' : 'text-amber-600'}`}>Braille Output</span>
                {generatedBraille && (
                  <div className="flex gap-2">
                    <button onClick={downloadBrailleAsImage} className={`p-3 rounded-2xl transition-all active:scale-90 ${isDark ? 'bg-slate-800 text-amber-500' : 'bg-amber-50 text-amber-600'}`} title="Download as Image"><Download size={20} /></button>
                    <button onClick={() => copyToClipboard(generatedBraille, setGenCopied)} className={`p-3 rounded-2xl transition-all active:scale-90 ${isDark ? 'bg-slate-800 text-amber-500' : 'bg-amber-50 text-amber-600'}`} title="Copy Braille Text">{genCopied ? <Check size={20} /> : <Copy size={20} />}</button>
                  </div>
                )}
              </div>
              <div className="text-5xl md:text-7xl font-black leading-tight break-words tracking-widest">{generatedBraille || <span className="opacity-10">⠃⠗⠁⠊⠇⠇⠑</span>}</div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;