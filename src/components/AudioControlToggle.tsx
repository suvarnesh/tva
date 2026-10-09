"use client";

import React, { useEffect, useState } from "react";
import { tvaAudio } from "@/lib/tvaAudio";

export const AudioControlToggle: React.FC<{ className?: string }> = ({ className = "" }) => {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setIsMuted(tvaAudio.getMuted());
    const unsubscribe = tvaAudio.subscribe((muted) => {
      setIsMuted(muted);
    });
    return unsubscribe;
  }, []);

  const handleToggle = () => {
    tvaAudio.unlock();
    tvaAudio.toggleMute();
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`px-2.5 py-1 rounded border font-mono text-[11px] font-bold tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
        isMuted
          ? "bg-[#180d09] text-[#805039] border-[#3f1910] hover:text-[#d97706] hover:border-[#b45309]"
          : "bg-[#2b120a] text-[#fbbf24] border-[#d97706] shadow-[0_0_8px_rgba(217,119,6,0.35)] hover:bg-[#3f190e]"
      } ${className}`}
      title={isMuted ? "Click to enable retro CRT acoustics" : "Click to mute audio"}
    >
      <span>{isMuted ? "🔇" : "🔊"}</span>
      <span>{isMuted ? "AUDIO: OFF" : "AUDIO: ON"}</span>
    </button>
  );
};
