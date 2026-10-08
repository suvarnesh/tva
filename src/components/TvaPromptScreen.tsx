"use client";

import React, { useState } from "react";

interface TvaPromptScreenProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  errorMessage: string | null;
}

export const TvaPromptScreen: React.FC<TvaPromptScreenProps> = ({
  onSearch,
  isLoading,
  errorMessage,
}) => {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch(inputValue.trim());
    }
  };

  const handlePreset = (preset: string) => {
    setInputValue(preset);
    onSearch(preset);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-4 sm:p-8 font-mono">
      {/* Outer TVA Border matching the HUD reference */}
      <div className="w-full bg-[#0c0806] border-[3px] border-[#e67e22] rounded-3xl p-6 sm:p-10 shadow-[0_0_40px_rgba(230,126,34,0.35),inset_0_0_30px_rgba(0,0,0,0.85)] tva-hud-grid relative overflow-hidden">
        
        {/* CRT Scanline overlay */}
        <div className="crt-scanlines absolute inset-0 pointer-events-none opacity-30" />

        {/* Top Header Badge */}
        <div className="flex flex-col items-center text-center gap-2 mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#f39c12] tracking-widest drop-shadow-[0_0_12px_rgba(243,156,18,0.8)]">
              TVA
            </span>
            <span className="text-xs sm:text-sm text-[#e67e22] tracking-widest border-l-2 border-[#d35400] pl-3 py-1">
              TIME VARIANCE AUTHORITY
            </span>
          </div>

          <h1 className="text-xl sm:text-3xl font-extrabold tracking-wider text-[#ffba5a] glow-amber-text uppercase mt-2">
            ALTERNATIVE TIMELINE DETECTION SYSTEM
          </h1>

          <p className="text-xs sm:text-sm text-[#c07d50] max-w-lg">
            Scan the Sacred Timeline for points of divergence and calculate four counterfactual quantum branches.
          </p>
        </div>

        {/* Error notification if any */}
        {errorMessage && (
          <div className="mb-6 p-3.5 bg-[#260e0d]/90 border-2 border-[#ef4444] rounded-xl text-xs text-[#fca5a5] flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <span>⚠</span>
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => onSearch(inputValue || "APOLLO 11")}
              className="px-2.5 py-1 bg-[#ef4444] text-black font-bold rounded hover:bg-[#f87171] cursor-pointer"
            >
              RETRY
            </button>
          </div>
        )}

        {/* Main Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10 max-w-2xl mx-auto">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="historical-event-input"
              className="text-sm sm:text-base font-bold tracking-widest text-[#f5caa0] uppercase flex items-center gap-2"
            >
              <span className="text-[#f39c12]">▶</span>
              <span>ENTER HISTORICAL EVENT</span>
            </label>

            <div className="relative">
              <input
                id="historical-event-input"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="E.G., 'APOLLO 11', 'FALL OF BERLIN WALL'..."
                disabled={isLoading}
                autoFocus
                className="w-full bg-[#140a07] border-2 border-[#d35400] focus:border-[#f39c12] focus:outline-none px-5 py-4 rounded-xl text-base sm:text-lg font-mono text-[#fff3db] placeholder-[#805039] shadow-[inset_0_0_15px_rgba(0,0,0,0.8)] transition-all disabled:opacity-50"
              />
              {inputValue && (
                <button
                  type="button"
                  onClick={() => setInputValue("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#805039] hover:text-[#f3caa0]"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="w-full py-4 px-6 bg-gradient-to-r from-[#b83811] via-[#d35400] to-[#b83811] hover:from-[#c93f13] hover:to-[#be3b12] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed text-[#fff3dc] font-mono font-bold text-sm sm:text-base tracking-wider uppercase rounded-xl border border-[#f39c12] shadow-[0_0_20px_rgba(230,126,34,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>CALCULATING QUANTUM MANIFOLD (GEMINI AI)...</span>
              </>
            ) : (
              <>
                <span>DETECT ALTERNATIVE TIMELINES</span>
                <span className="text-lg">⚡</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Historical Suggestions */}
        <div className="mt-8 pt-6 border-t border-[#3e1f18] flex flex-col items-center gap-3 relative z-10">
          <span className="text-xs text-[#a0684f] uppercase tracking-wider">
            SAMPLE HISTORICAL EVENTS (EXPLORE WITH GEMINI AI):
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { name: "APOLLO 11 LUNAR MISSION", query: "APOLLO 11" },
              { name: "CUBAN MISSILE CRISIS (1962)", query: "CUBAN MISSILE CRISIS" },
              { name: "FALL OF THE BERLIN WALL (1989)", query: "FALL OF THE BERLIN WALL" },
              { name: "SINKING OF THE RMS TITANIC (1912)", query: "TITANIC" },
            ].map((item) => (
              <button
                key={item.query}
                type="button"
                onClick={() => handlePreset(item.query)}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-lg bg-[#1a0e0a] border border-[#54271c] hover:border-[#e67e22] hover:bg-[#2b140d] text-[#e0a980] text-xs font-mono transition-colors cursor-pointer"
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom TVA Bar */}
        <div className="mt-8 flex items-center justify-between text-[11px] text-[#7a4933] border-t border-[#2d140e] pt-3 relative z-10">
          <span className="text-[#c0392b] font-bold">ATDS</span>
          <span>&quot;An exploration of alternative history, not a prediction of real timelines.&quot;</span>
          <span className="text-[#e67e22] font-bold">TVA-SYS</span>
        </div>
      </div>
    </div>
  );
};
