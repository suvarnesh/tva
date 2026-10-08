"use client";

import React from "react";

interface AmbiguityModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalQuery: string;
  suggestions: string[];
  onSelectSuggestion: (suggestion: string) => void;
}

export const AmbiguityModal: React.FC<AmbiguityModalProps> = ({
  isOpen,
  onClose,
  originalQuery,
  suggestions,
  onSelectSuggestion,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#140a08] border-2 border-[#d97706] rounded-2xl p-5 shadow-[0_0_35px_rgba(217,119,6,0.4)] flex flex-col gap-4 font-mono">
        <div className="flex items-center justify-between border-b border-[#3d1a14] pb-2 text-xs">
          <span className="text-[#f59e0b] font-bold flex items-center gap-2">
            <span>⚠</span>
            <span>TEMPORAL AMBIGUITY RESOLUTION</span>
          </span>
          <button
            onClick={onClose}
            className="text-[#86513a] hover:text-[#fff]"
          >
            [DISMISS]
          </button>
        </div>

        <div>
          <h3 className="text-sm sm:text-base font-bold text-[#fff2da]">
            The query &quot;{originalQuery}&quot; matches multiple historical nexus points.
          </h3>
          <p className="text-xs text-[#b87652] mt-1">
            To preserve historical integrity without inventing arbitrary timelines, please select the exact historical event you wish to explore:
          </p>
        </div>

        <div className="flex flex-col gap-2 my-1">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onSelectSuggestion(suggestion);
                onClose();
              }}
              className="text-left p-3 rounded-lg bg-[#200e0a] border border-[#522115] hover:border-[#f59e0b] hover:bg-[#32150e] text-[#ffdcb2] text-xs transition-colors flex items-center justify-between cursor-pointer"
            >
              <span>{suggestion}</span>
              <span className="text-[#f59e0b]">▶</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#7a4833] border-t border-[#301610] pt-2">
          <span>TVA ACCURACY PROTOCOL 4-B</span>
          <button
            onClick={onClose}
            className="underline hover:text-[#e0a980]"
          >
            Cancel & Re-enter Event
          </button>
        </div>
      </div>
    </div>
  );
};
