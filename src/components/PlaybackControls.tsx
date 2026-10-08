"use client";

import React from "react";

interface PlaybackControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onRestart: () => void;
  playbackProgress: number; // 0.0 to 1.0
  onScrub: (progress: number) => void;
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
  currentYear: number;
  startYear: number;
  endYear: number;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onRestart,
  playbackProgress,
  onScrub,
  playbackSpeed,
  onChangeSpeed,
  currentYear,
  startYear,
  endYear,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-[#120a07] border border-[#3f1c16] rounded-lg text-xs font-mono">
      {/* Play, Pause, Restart buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onTogglePlay}
          className="px-3 py-1.5 rounded bg-[#2c130d] border border-[#78350f] hover:bg-[#441c13] hover:border-[#f59e0b] text-[#fef3c7] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Play / Pause Timeline (Space)"
        >
          <span>{isPlaying ? "❚❚ PAUSE" : "▶ PLAY"}</span>
          <span className="text-[10px] text-[#b45309] hidden sm:inline">[SPACE]</span>
        </button>

        <button
          type="button"
          onClick={onRestart}
          className="px-2.5 py-1.5 rounded bg-[#1e0e0a] border border-[#482017] hover:bg-[#2d140e] hover:border-[#853e2a] text-[#d69f7e] transition-colors cursor-pointer"
          title="Restart Scrubber to Beginning"
        >
          |◀ RESTART
        </button>

        {/* Speed toggle */}
        <div className="flex items-center rounded border border-[#3e1b15] overflow-hidden">
          {[1, 2].map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => onChangeSpeed(spd)}
              className={`px-2 py-1 text-[10px] font-mono transition-colors cursor-pointer ${
                playbackSpeed === spd
                  ? "bg-[#853215] text-[#fff]"
                  : "bg-[#160c08] text-[#a06852] hover:text-[#d69f7e]"
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Scrubber Range Slider */}
      <div className="flex-1 min-w-[200px] flex items-center gap-2">
        <span className="text-[10px] text-[#8a573f]">{startYear}</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(playbackProgress * 100)}
          onChange={(e) => onScrub(parseFloat(e.target.value) / 100)}
          className="w-full h-1.5 bg-[#2a130d] rounded-lg appearance-none cursor-pointer accent-[#f59e0b] focus:outline-none"
          aria-label="Timeline Scrubber"
        />
        <span className="text-[10px] text-[#8a573f]">{endYear}</span>
      </div>

      {/* Temporal Coordinate Year Readout */}
      <div className="flex items-center gap-2">
        <div className="px-2.5 py-1 rounded bg-[#1f0f0a] border border-[#522319] text-[#fbbf24] font-bold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse" />
          <span>YEAR: {currentYear}</span>
        </div>
      </div>
    </div>
  );
};
