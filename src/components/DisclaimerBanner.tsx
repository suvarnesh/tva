"use client";

import React from "react";

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="p-3 bg-[#130907] border border-[#421d15] rounded-lg text-center font-mono text-[11px] sm:text-xs text-[#b87652] leading-snug">
      <div className="text-[#f59e0b] font-bold tracking-wide uppercase mb-0.5">
        &quot;An exploration of alternative history, not a prediction or discovery of real timelines.&quot;
      </div>
      <div className="text-[#844e36] text-[10px]">
        Actual baseline events are verified against historical documentary archives. All alternative branches, changed conditions, and subsequent events are fiction designed for counterfactual analysis.
      </div>
    </div>
  );
};
