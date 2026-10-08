"use client";

import React from "react";
import { TimelineDetectionResult, TimelineBranch } from "@/types/timeline";

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TimelineDetectionResult;
  selectedBranchId: string | null;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  onClose,
  data,
  selectedBranchId,
}) => {
  if (!isOpen) return null;

  const branch: TimelineBranch | undefined = data.alternatives.find(
    (b) => b.id === (selectedBranchId || "branch-01")
  );

  if (!branch) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-[#130907] border-2 border-[#b45309] rounded-2xl shadow-[0_0_40px_rgba(245,158,11,0.4)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-4 py-3 bg-[#240e0a] border-b border-[#4d1f16] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[#f59e0b] font-bold text-sm">⚖</span>
            <span className="font-bold text-[#fff3dc] text-sm uppercase">
              COMPARATIVE TIMELINE ANALYSIS
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded bg-[#3d180f] text-[#fcd34d] hover:bg-[#522115] text-xs font-bold"
          >
            ✕ CLOSE [ESC]
          </button>
        </div>

        {/* Comparison Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 font-mono text-xs sm:text-sm">
          {/* Side-by-side comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Column 1: Actual History */}
            <div className="p-4 bg-[#0e1810] border-2 border-[#15803d] rounded-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#14532d] text-[#86efac]">
                  ACTUAL HISTORY
                </span>
                <span className="text-[10px] text-[#4ade80]">0.0% VARIANCE</span>
              </div>
              <h3 className="font-bold text-[#dcfce7] text-base">
                {data.baseline.title}
              </h3>
              <p className="text-[#bbf7d0] text-xs leading-relaxed">
                {data.baseline.summary}
              </p>

              <div className="border-t border-[#166534] pt-3">
                <span className="text-[11px] font-bold text-[#86efac] uppercase block mb-1">
                  HISTORICAL CONDITION AT DIVERGENCE:
                </span>
                <p className="text-[#bbf7d0] text-xs">
                  {branch.pointOfDivergence.historicalFact}
                </p>
              </div>
            </div>

            {/* Column 2: Selected Alternative */}
            <div className="p-4 bg-[#230f0a] border-2 border-[#d97706] rounded-xl flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#78350f] text-[#fef08a]">
                  HYPOTHETICAL TIMELINE
                </span>
                <span className="text-[10px] text-[#f59e0b]">
                  {branch.varianceScore.toFixed(1)}% VARIANCE
                </span>
              </div>
              <h3 className="font-bold text-[#fef08a] text-base">
                {branch.title}
              </h3>
              <p className="text-[#fde68a] text-xs leading-relaxed">
                {branch.causalChain.summary}
              </p>

              <div className="border-t border-[#92400e] pt-3">
                <span className="text-[11px] font-bold text-[#fef08a] uppercase block mb-1">
                  POINT OF DIVERGENCE ({branch.pointOfDivergence.dateStr}):
                </span>
                <p className="text-[#fde68a] text-xs">
                  {branch.pointOfDivergence.changedCondition}
                </p>
              </div>
            </div>
          </div>

          {/* Direct Comparative Analysis Summary */}
          <div className="p-4 bg-[#180d09] border border-[#441f17] rounded-xl">
            <h4 className="text-sm font-bold text-[#f59e0b] uppercase mb-2">
              SYNTHESIS OF COUNTERFACTUAL DEVIATION:
            </h4>
            <p className="text-[#eed6b0] text-xs leading-relaxed">
              {branch.comparisonWithActualHistory}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
