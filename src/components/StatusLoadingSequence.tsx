"use client";

import React, { useEffect, useState } from "react";

interface StatusLoadingSequenceProps {
  isLoading: boolean;
  query: string;
}

const STATUS_STEPS = [
  "TEMPORAL FREQUENCY LOCK ACQUIRED...",
  "ISOLATING BASELINE HISTORICAL DATA...",
  "IDENTIFYING CRITICAL POINTS OF DIVERGENCE (POD)...",
  "CALCULATING 4 COUNTERFACTUAL QUANTUM BRANCHES...",
  "STABILIZING TIMELINE MANIFOLD & VERIFYING CHRONOLOGY...",
];

export const StatusLoadingSequence: React.FC<StatusLoadingSequenceProps> = ({
  isLoading,
  query,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < STATUS_STEPS.length - 1 ? prev + 1 : prev));
    }, 550);

    return () => {
      clearInterval(interval);
      setCurrentStep(0);
    };
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div className="p-4 sm:p-6 bg-[#1a0a07] border-2 border-[#f59e0b] rounded-xl flex flex-col items-center justify-center gap-4 text-center font-mono my-2 shadow-[0_0_25px_rgba(245,158,11,0.3)]">
      {/* Animated Oscilloscope Wave Loader */}
      <div className="flex items-center gap-1.5 h-6">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="w-1.5 bg-[#f59e0b] rounded-full animate-bounce"
            style={{
              animationDelay: `${i * 120}ms`,
              height: `${12 + (i % 3) * 8}px`,
            }}
          />
        ))}
      </div>

      <div>
        <div className="text-xs text-[#b87652] uppercase tracking-wider">
          SCANNING HISTORICAL NEXUS: &quot;{query}&quot;
        </div>
        <div className="text-sm sm:text-base font-bold text-[#fef3c7] glow-amber-text mt-1">
          {STATUS_STEPS[currentStep]}
        </div>
      </div>

      {/* Progress Bars */}
      <div className="w-full max-w-md h-2 bg-[#2d120a] rounded-full overflow-hidden border border-[#522115]">
        <div
          className="h-full bg-gradient-to-r from-[#b45309] to-[#f59e0b] transition-all duration-300 rounded-full"
          style={{ width: `${((currentStep + 1) / STATUS_STEPS.length) * 100}%` }}
        />
      </div>

      <div className="text-[10px] text-[#86513a]">
        STAGE {currentStep + 1} OF {STATUS_STEPS.length} {" // "} ALL CHRONOLOGICAL PARADOXES MONITORED
      </div>
    </div>
  );
};
