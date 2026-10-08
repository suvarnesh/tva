"use client";

import React from "react";
import { TimelineDetectionResult, TimelineBranch } from "@/types/timeline";

interface BranchSelectorBarProps {
  data: TimelineDetectionResult;
  selectedBranchId: string | null;
  onSelectBranch: (branchId: string | null) => void;
}

export const BranchSelectorBar: React.FC<BranchSelectorBarProps> = ({
  data,
  selectedBranchId,
  onSelectBranch,
}) => {
  const isBaselineSelected = selectedBranchId === null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs font-mono text-[#aa6c4c]">
        <span className="flex items-center gap-2">
          <span className="text-[#f59e0b]">■</span>
          <span className="font-bold tracking-wider text-[#f5caa0] uppercase">
            SELECT TIMELINE TO ISOLATE:
          </span>
          <span className="text-[10px] text-[#86513a] hidden sm:inline">
            (Press 0 for Actual, 1-4 for Branches)
          </span>
        </span>
        <span className="text-[10px] text-[#8a573f]">
          CURRENT:{" "}
          <span className="text-[#fbbf24] font-bold">
            {isBaselineSelected
              ? "ACTUAL HISTORY (BASELINE)"
              : data.alternatives.find((b) => b.id === selectedBranchId)?.shortTag ||
                "BRANCH"}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {/* Actual History Tab Button */}
        <button
          type="button"
          onClick={() => onSelectBranch(null)}
          className={`flex flex-col text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
            isBaselineSelected
              ? "bg-[#33140d] border-[#f59e0b] shadow-[0_0_12px_rgba(245,158,11,0.35)]"
              : "bg-[#140b08] border-[#3d1e18] hover:border-[#7c3222] hover:bg-[#1f100c]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                isBaselineSelected
                  ? "bg-[#f59e0b] text-[#140b08]"
                  : "bg-[#29130d] text-[#c47f5a]"
              }`}
            >
              [0] BASELINE
            </span>
            <span className="text-[10px] font-mono text-[#34d399]">
              0.0% VAR
            </span>
          </div>
          <span className="text-xs font-bold text-[#fff2da] mt-1.5 line-clamp-1">
            ACTUAL HISTORY
          </span>
          <span className="text-[10px] text-[#b07857] mt-0.5">
            Real timeline archive
          </span>
        </button>

        {/* 4 Alternative Branch Tab Buttons */}
        {data.alternatives.map((branch: TimelineBranch) => {
          const isSelected = selectedBranchId === branch.id;
          return (
            <button
              key={branch.id}
              type="button"
              onClick={() => onSelectBranch(branch.id)}
              className={`flex flex-col text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#35160c] border-[#f59e0b] shadow-[0_0_14px_rgba(245,158,11,0.4)]"
                  : "bg-[#140b08] border-[#3d1e18] hover:border-[#7c3222] hover:bg-[#1f100c]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                    isSelected
                      ? "bg-[#fbbf24] text-[#140b08]"
                      : "bg-[#24110b] text-[#b87652]"
                  }`}
                >
                  [{branch.branchNumber}] HYPOTHETICAL
                </span>
                <span className="text-[10px] font-mono text-[#f59e0b]">
                  {branch.varianceScore.toFixed(1)}% VAR
                </span>
              </div>
              <span className="text-xs font-bold text-[#fff2da] mt-1.5 line-clamp-1">
                {branch.shortTag}
              </span>
              <span className="text-[10px] text-[#b07857] mt-0.5 flex items-center justify-between">
                <span>POD: {branch.pointOfDivergence.year}</span>
                <span className="uppercase text-[9px] text-[#855038]">
                  {branch.position}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
