"use client";

import React from "react";
import { VerifiedSource } from "@/types/timeline";

interface HelpManualModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourcesOnly?: boolean;
  verifiedSources?: VerifiedSource[];
}

export const HelpManualModal: React.FC<HelpManualModalProps> = ({
  isOpen,
  onClose,
  sourcesOnly = false,
  verifiedSources = [],
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#130807] border-2 border-[#b45309] rounded-2xl p-5 shadow-[0_0_35px_rgba(245,158,11,0.4)] flex flex-col gap-4 font-mono max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#3d1912] pb-2 text-xs">
          <span className="text-[#f59e0b] font-bold flex items-center gap-2">
            <span>📖</span>
            <span>
              {sourcesOnly
                ? "TVA HISTORICAL ARCHIVES & VERIFIED SOURCES"
                : "TVA FIELD MANUAL // TERMINAL OPERATION INSTRUCTIONS"}
            </span>
          </span>
          <button
            onClick={onClose}
            className="text-[#86513a] hover:text-[#fff] px-2 py-0.5 rounded bg-[#2a110a]"
          >
            [CLOSE ESC]
          </button>
        </div>

        {sourcesOnly ? (
          <div className="space-y-4 text-xs text-[#eed6b0]">
            <p className="text-[#b3704d]">
              The Alternative Timeline Detection System adheres to strict content integrity rules. Actual historical facts are grounded in recognized primary documentation:
            </p>

            <div className="space-y-2">
              {verifiedSources.map((src, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded bg-[#1c0e0b] border border-[#3e1b15]"
                >
                  <div className="text-[#fef3c7] font-bold text-sm">
                    {src.title}
                  </div>
                  <div className="text-[11px] text-[#e0986e] mt-0.5">
                    Publisher / Authority: {src.authorOrPublisher}
                  </div>
                  <div className="text-[10px] text-[#8c5237] italic mt-1">
                    {src.citation}
                  </div>
                  {src.url && (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#f59e0b] hover:underline text-[10px] block mt-1"
                    >
                      Verify Document Online →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs text-[#eed6b0]">
            <div>
              <h4 className="text-sm font-bold text-[#f59e0b] uppercase mb-1">
                KEYBOARD SHORTCUTS:
              </h4>
              <ul className="space-y-1 text-xs text-[#d8b08b]">
                <li>
                  <kbd className="bg-[#2d130c] px-1.5 py-0.5 rounded text-[#fef3c7] border border-[#522115]">
                    SPACE
                  </kbd>{" "}
                  : Play / Pause Scrubber Playhead
                </li>
                <li>
                  <kbd className="bg-[#2d130c] px-1.5 py-0.5 rounded text-[#fef3c7] border border-[#522115]">
                    0
                  </kbd>{" "}
                  or{" "}
                  <kbd className="bg-[#2d130c] px-1.5 py-0.5 rounded text-[#fef3c7] border border-[#522115]">
                    A
                  </kbd>{" "}
                  : Select Actual Baseline History
                </li>
                <li>
                  <kbd className="bg-[#2d130c] px-1.5 py-0.5 rounded text-[#fef3c7] border border-[#522115]">
                    1
                  </kbd>{" "}
                  –{" "}
                  <kbd className="bg-[#2d130c] px-1.5 py-0.5 rounded text-[#fef3c7] border border-[#522115]">
                    4
                  </kbd>{" "}
                  : Select Alternative Branch 01 through 04
                </li>
                <li>
                  <kbd className="bg-[#2d130c] px-1.5 py-0.5 rounded text-[#fef3c7] border border-[#522115]">
                    ←
                  </kbd>{" "}
                  /{" "}
                  <kbd className="bg-[#2d130c] px-1.5 py-0.5 rounded text-[#fef3c7] border border-[#522115]">
                    →
                  </kbd>{" "}
                  : Step timeline playhead backward / forward
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#f59e0b] uppercase mb-1">
                SYSTEM CONCEPT & ARCHITECTURE:
              </h4>
              <p className="leading-relaxed text-[#c49673]">
                The central horizontal line charts verified actual historical reality. Exactly four hypothetical branches diverge from plausible historical turning points (Points of Divergence), preserving shared history before the split.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#f59e0b] uppercase mb-1">
                LOCAL STORAGE PERSISTENCE:
              </h4>
              <p className="leading-relaxed text-[#c49673]">
                Your last explored historical counterfactual is automatically stored locally in your browser so you never lose your progress between sessions.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
