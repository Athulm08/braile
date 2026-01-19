import React, { useState } from 'react';
import axios from 'axios';
import {
  Upload,
  Cpu,
  Sparkles,
  FileText,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';

function App() {
  // Common state
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mode, setMode] = useState("Digital/Black Dots");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Theme state
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

    try {
      const response = await axios.post(
        'http://localhost:8000/translate',
        formData
      );
      setResult(response.data);
    } catch (error) {
      console.error("Backend unreachable", error);
      alert("Make sure backend/src/main.py is running!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={
        isDark
          ? "min-h-screen bg-slate-950 text-white p-4 md:p-8 font-sans relative overflow-hidden"
          : "min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-rose-50 text-slate-900 p-4 md:p-8 font-sans relative overflow-hidden"
      }
    >
      {/* Backgrounds */}
      {isDark ? (
        <>
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-40 -left-24 h-80 w-80 bg-gradient-to-br from-pink-500/40 via-purple-500/40 to-indigo-500/40 blur-3xl opacity-60" />
            <div className="absolute -bottom-40 -right-24 h-80 w-80 bg-gradient-to-tr from-indigo-500/40 via-sky-500/40 to-emerald-500/40 blur-3xl opacity-60" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#1e293b_0,_#020617_55%,_#000_100%)]" />
          </div>
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07] bg-[radial-gradient(circle_at_1px_1px,#64748b_1px,transparent_0)] [background-size:24px_24px]" />
        </>
      ) : (
        <>
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-40 -left-24 h-80 w-80 bg-gradient-to-br from-sky-300/70 via-indigo-300/60 to-violet-300/70 blur-3xl opacity-70" />
            <div className="absolute -bottom-40 -right-24 h-80 w-80 bg-gradient-to-tr from-rose-300/70 via-amber-200/60 to-emerald-200/70 blur-3xl opacity-70" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.2)_0,_transparent_55%),radial-gradient(circle_at_bottom,_rgba(248,250,252,0.85)_0,_#f1f5f9_60%)]" />
          </div>
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.08] bg-[radial-gradient(circle_at_1px_1px,#cbd5f5_1px,transparent_0)] [background-size:22px_22px]" />
        </>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Theme toggle bar */}
        <div className="flex items-center justify-between mb-4">
          <span className={`text-xs md:text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-500"}`}>
            Theme
          </span>

          <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={`relative inline-flex h-8 w-16 items-center rounded-full border transition
              ${isDark ? "bg-slate-800 border-slate-600" : "bg-sky-100 border-sky-300"}
            `}
          >
            <span
              className={`absolute h-6 w-6 rounded-full bg-white shadow-md flex items-center justify-center text-xs transition-transform
                ${isDark ? "translate-x-7" : "translate-x-1"}
              `}
            >
              {isDark ? "🌙" : "☀️"}
            </span>
            <span className="sr-only">Toggle theme</span>
          </button>
        </div>

        {/* Header Section */}
        <header className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div
              className={
                isDark
                  ? "inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-1 backdrop-blur"
                  : "inline-flex items-center gap-3 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 backdrop-blur shadow-sm"
              }
            >
              <span className={isDark ? "text-pink-400 text-lg" : "text-rose-500 text-lg"}>🧠</span>
              <span className="text-[11px] uppercase tracking-[0.2em] text-slate-300">
                Braille Intelligence Studio
              </span>
            </div>
            <h1 className={`mt-4 text-3xl md:text-4xl font-semibold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              Intelligent{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-indigo-500 to-rose-500">
                Braille‑to‑Text
              </span>{" "}
              Workflow
            </h1>
            <p className={`mt-3 text-sm md:text-base max-w-xl ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Upload any Braille script, segment dots with AI, and refine the transcription using large language models while automatically building your own training dataset.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 text-xs">
            <div
              className={
                isDark
                  ? "inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-400/30 px-3 py-1 backdrop-blur"
                  : "inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 backdrop-blur shadow-sm"
              }
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Backend status:{" "}
                <span className={isDark ? "font-medium text-emerald-300" : "font-medium text-emerald-700"}>
                  Awaiting request
                </span>
              </span>
            </div>
            <span className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Tip: Use high‑contrast images for best segmentation quality.
            </span>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT PANEL */}
          <div className="space-y-6">
            {/* Upload Section */}
            <div
              className={
                isDark
                  ? "relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_18px_45px_rgba(15,23,42,0.8)] backdrop-blur-xl"
                  : "relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-[0_18px_45px_rgba(148,163,184,0.25)] backdrop-blur-xl"
              }
            >
              <div className="absolute inset-px rounded-[1rem] border border-white/60 pointer-events-none" />
              <div className="relative p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div
                    className={
                      isDark
                        ? "bg-indigo-600/80 text-white p-1.5 rounded-lg shadow-lg shadow-indigo-500/40"
                        : "bg-sky-500 text-white p-1.5 rounded-lg shadow-md shadow-sky-200"
                    }
                  >
                    <ImageIcon size={18} />
                  </div>
                  <span className={`font-semibold uppercase text-[10px] tracking-[0.18em] ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                    Upload Braille Script
                  </span>
                </div>

                {/* Upload Box */}
                <label
                  className={
                    isDark
                      ? "group border border-dashed border-slate-600/80 rounded-xl h-52 flex flex-col items-center justify-center relative overflow-hidden bg-slate-900/60 hover:border-indigo-400/80 hover:bg-slate-900/80 transition-all cursor-pointer"
                      : "group border border-dashed border-slate-300 rounded-xl h-52 flex flex-col items-center justify-center relative overflow-hidden bg-slate-50/80 hover:border-sky-400 hover:bg-sky-50/80 transition-all cursor-pointer"
                  }
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt="preview"
                      className={isDark ? "h-full w-full object-contain bg-slate-900/40" : "h-full w-full object-contain bg-slate-50"}
                    />
                  ) : (
                    <>
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          <div
                            className={
                              isDark
                                ? "absolute inset-0 rounded-full bg-indigo-500/40 blur-xl opacity-60 group-hover:opacity-100 transition"
                                : "absolute inset-0 rounded-full bg-sky-300/50 blur-xl opacity-60 group-hover:opacity-100 transition"
                            }
                          />
                          <Upload
                            className={
                              isDark
                                ? "relative text-slate-300 group-hover:text-indigo-300 group-hover:scale-110 transition-transform"
                                : "relative text-slate-500 group-hover:text-sky-600 group-hover:scale-110 transition-transform"
                            }
                            size={28}
                          />
                        </div>
                        <div className="text-center space-y-1">
                          <span className={isDark ? "block text-sm font-medium text-slate-100" : "block text-sm font-medium text-slate-800"}>
                            Click to upload image
                          </span>
                          <span className={isDark ? "block text-xs text-slate-400" : "block text-xs text-slate-500"}>
                            PNG, JPG up to 10MB. Clear, high‑contrast scans recommended.
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                  />
                </label>
              </div>
            </div>

            {/* Scan Mode Section */}
            <div
              className={
                isDark
                  ? "relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl"
                  : "relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 backdrop-blur-xl"
              }
            >
              <div className="absolute inset-px rounded-[1rem] border border-white/60 pointer-events-none" />
              <div className="relative p-6 space-y-4">
                <span
                  className={
                    isDark
                      ? "bg-indigo-500/15 border border-indigo-400/40 text-[10px] font-semibold uppercase tracking-[0.18em] px-3 py-1 rounded-full text-indigo-200 inline-flex items-center gap-2"
                      : "bg-sky-50 border border-sky-200 text-[10px] font-semibold uppercase tracking-[0.18em] px-3 py-1 rounded-full text-sky-700 inline-flex items-center gap-2"
                  }
                >
                  <Cpu size={13} />
                  Scan Mode
                </span>

                <p className={`text-xs ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                  Choose the capture style so the system can adjust preprocessing and dot detection thresholds.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {["Digital/Black Dots", "Real Photo (Embossed)"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMode(m)}
                      className={`flex items-center justify-between gap-3 py-3 px-3 rounded-xl text-sm font-medium border transition-all text-left
                        ${
                          isDark
                            ? mode === m
                              ? "bg-indigo-600/80 border-indigo-300/80 text-white shadow-[0_12px_30px_rgba(37,99,235,0.45)]"
                              : "bg-slate-900/60 border-slate-700/80 text-slate-300 hover:border-indigo-400/70 hover:bg-slate-900"
                            : mode === m
                              ? "bg-sky-500 text-white border-sky-500 shadow-[0_12px_30px_rgba(56,189,248,0.45)]"
                              : "bg-slate-50 border-slate-200 text-slate-700 hover:border-sky-300 hover:bg-sky-50"
                        }`}
                    >
                      <span>{m}</span>
                      <span
                        className={`text-[10px] uppercase tracking-[0.18em] ${
                          isDark
                            ? mode === m
                              ? "text-slate-100/90"
                              : "text-slate-400"
                            : mode === m
                              ? "text-sky-100/90"
                              : "text-slate-400"
                        }`}
                      >
                        {m === "Digital/Black Dots" ? "Scans" : "Camera"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Process Button */}
            <button
              onClick={processScript}
              disabled={!file || loading}
              className={`group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-rose-500 py-4 font-semibold text-lg text-white shadow-[0_18px_45px_rgba(56,189,248,0.6)] transition-all
                ${
                  !file || loading
                    ? "disabled:from-slate-500 disabled:via-slate-600 disabled:to-slate-700 disabled:text-slate-300 disabled:shadow-none"
                    : ""
                }`}
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-[radial-gradient(circle_at_10%_20%,rgba(248,250,252,0.4)_0,transparent_55%),radial-gradient(circle_at_80%_0,rgba(248,250,252,0.35)_0,transparent_50%)] transition-opacity" />
              <div className="relative flex items-center justify-center gap-3">
                {loading ? (
                  <Loader2 className="animate-spin" size={22} />
                ) : (
                  <Cpu size={22} />
                )}
                <span>{loading ? "Processing Braille..." : "Process Script"}</span>
              </div>
            </button>
          </div>

          {/* RIGHT PANEL */}
          <div className="space-y-6">
            {/* Segmentation Result */}
            <div
              className={
                isDark
                  ? "relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_18px_45px_rgba(15,23,42,0.8)] backdrop-blur-xl min-h-[260px]"
                  : "relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 shadow-[0_18px_45px_rgba(148,163,184,0.25)] backdrop-blur-xl min-h-[260px]"
              }
            >
              <div className="absolute inset-px rounded-[1rem] border border-white/60 pointer-events-none" />
              <div className="relative p-6 space-y-4">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={
                        isDark
                          ? "bg-indigo-600/80 text-white p-1.5 rounded-lg shadow-lg shadow-indigo-500/40"
                          : "bg-sky-500 text-white p-1.5 rounded-lg shadow-md shadow-sky-200"
                      }
                    >
                      <Sparkles size={18} />
                    </div>
                    <span className={`font-semibold uppercase text-[10px] tracking-[0.18em] ${isDark ? "text-slate-300" : "text-slate-500"}`}>
                      AI Dot Segmentation
                    </span>
                  </div>
                  <span className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Visual feedback of detected Braille cells
                  </span>
                </div>

                <div
                  className={
                    isDark
                      ? "bg-slate-950/80 border border-slate-800/80 rounded-xl overflow-hidden flex items-center justify-center min-h-[170px] relative"
                      : "bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center min-h-[170px] relative"
                  }
                >
                  <div
                    className={
                      isDark
                        ? "pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_0_0,#1d4ed8_0,transparent_50%),radial-gradient(circle_at_100%_100%,#a855f7_0,transparent_55%)]"
                        : "pointer-events-none absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_0_0,rgba(56,189,248,0.18)_0,transparent_55%),radial-gradient(circle_at_100%_100%,rgba(244,114,182,0.2)_0,transparent_60%)]"
                    }
                  />
                  {result?.image ? (
                    <img
                      src={result.image}
                      alt="segmented"
                      className="relative max-h-[220px] w-full object-contain"
                    />
                  ) : (
                    <span
                      className={
                        isDark
                          ? "relative text-slate-400 text-sm italic"
                          : "relative text-slate-400 text-sm italic"
                      }
                    >
                      Segmented Braille dots will appear here after processing.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Text Outputs */}
            <div className="grid grid-cols-1 gap-4">
              {/* Raw Output */}
              <div
                className={
                  isDark
                    ? "relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl"
                    : "relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 backdrop-blur-xl"
                }
              >
                <div className="absolute inset-px rounded-[1rem] border border-white/60 pointer-events-none" />
                <div className="relative p-4 space-y-3">
                  <span
                    className={
                      isDark
                        ? "bg-slate-900/80 border border-slate-700/80 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.18em] inline-flex items-center gap-2 text-slate-200"
                        : "bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.18em] inline-flex items-center gap-2 text-slate-600"
                    }
                  >
                    <FileText size={13} />
                    Raw Detection
                  </span>
                  <p className={`text-[11px] ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Direct Braille cell decoding before any language‑level correction.
                  </p>
                  <div
                    className={
                      isDark
                        ? "bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl min-h-[72px] text-base font-mono text-slate-100 whitespace-pre-wrap"
                        : "bg-slate-50 border border-slate-200 p-3 rounded-xl min-h-[72px] text-base font-mono text-slate-800 whitespace-pre-wrap"
                    }
                  >
                    {result?.raw || "..."}
                  </div>
                </div>
              </div>

              {/* AI Refined Output */}
              <div
                className={
                  isDark
                    ? "relative overflow-hidden rounded-2xl border border-indigo-400/40 bg-gradient-to-br from-indigo-500/25 via-purple-500/20 to-slate-900/80 backdrop-blur-xl"
                    : "relative overflow-hidden rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 via-indigo-50 to-rose-50 backdrop-blur-xl"
                }
              >
                <div className="absolute inset-px rounded-[1rem] border border-white/70 pointer-events-none" />
                <div className="relative p-4 space-y-3">
                  <span
                    className={
                      isDark
                        ? "bg-indigo-500/25 border border-indigo-300/60 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.18em] inline-flex items-center gap-2 text-indigo-100"
                        : "bg-sky-100 border border-sky-200 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.18em] inline-flex items-center gap-2 text-sky-700"
                    }
                  >
                    <Sparkles size={13} />
                    AI Refined Text
                  </span>
                  <p className={isDark ? "text-[11px] text-indigo-100/80" : "text-[11px] text-sky-700/80"}>
                    Clean, human‑readable text after grammar fixes, punctuation, and context‑aware corrections.
                  </p>
                  <div
                    className={
                      isDark
                        ? "bg-slate-950/70 border border-indigo-300/40 p-3 rounded-xl min-h-[72px] text-lg text-indigo-100 font-semibold leading-relaxed whitespace-pre-wrap"
                        : "bg-white/90 border border-sky-200 p-3 rounded-xl min-h-[72px] text-lg text-slate-900 font-semibold leading-relaxed whitespace-pre-wrap"
                    }
                  >
                    {result?.ai || "..."}
                  </div>
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
