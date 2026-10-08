"use client";

import React, { useState } from "react";
import {
  TimelineDetectionResult,
  TimelineBranch,
  TimelineEvent,
} from "@/types/timeline";

interface BranchDetailInspectorProps {
  data: TimelineDetectionResult;
  selectedBranchId: string | null;
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
  onOpenComparison: () => void;
}

export const BranchDetailInspector: React.FC<BranchDetailInspectorProps> = ({
  data,
  selectedBranchId,
  selectedEventId,
  onSelectEvent,
  onOpenComparison,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "causal" | "consequences" | "sources">("overview");

  const isBaseline = selectedBranchId === null;
  const currentBranch: TimelineBranch | undefined = isBaseline
    ? undefined
    : data.alternatives.find((b) => b.id === selectedBranchId);

  // Selected event details if one is selected
  const allEvents: TimelineEvent[] = isBaseline
    ? data.baseline.events
    : [
        ...data.baseline.events.filter(
          (e) => currentBranch && e.year <= currentBranch.pointOfDivergence.year
        ),
        ...(currentBranch ? currentBranch.events : []),
      ];

  const highlightedEvent = selectedEventId
    ? allEvents.find((e) => e.id === selectedEventId)
    : null;

  return (
    <div className="flex flex-col bg-[#110907] border-2 border-[#451e16] rounded-xl p-3 sm:p-5 gap-4 shadow-xl">
      {/* Top Inspector Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#3d1a14]">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded ${
                isBaseline
                  ? "bg-[#16301a] text-[#4ade80] border border-[#22c55e]"
                  : "bg-[#3f190e] text-[#fbbf24] border border-[#d97706]"
              }`}
            >
              {isBaseline ? "ACTUAL HISTORY" : "HYPOTHETICAL TIMELINE"}
            </span>

            {!isBaseline && currentBranch && (
              <span className="text-xs font-mono text-[#b3704d]">
                VARIANCE: {currentBranch.varianceScore.toFixed(1)}% {" // "} {currentBranch.divergenceThreshold}
              </span>
            )}
          </div>

          <h2 className="text-base sm:text-xl font-bold font-mono text-[#fff1d6] mt-1">
            {isBaseline ? data.baseline.title : currentBranch?.title}
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {!isBaseline && (
            <button
              type="button"
              onClick={onOpenComparison}
              className="px-3 py-1.5 rounded bg-[#2b120d] border border-[#d97706] hover:bg-[#421b12] text-[#fef3c7] text-xs font-mono font-bold transition-all shadow-[0_0_10px_rgba(217,119,6,0.3)] cursor-pointer"
            >
              ⚖ COMPARE WITH ACTUAL HISTORY
            </button>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap gap-2 text-xs font-mono border-b border-[#301610] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`px-3 py-1 rounded transition-colors cursor-pointer ${
            activeTab === "overview"
              ? "bg-[#803112] text-[#fff] font-bold"
              : "bg-[#180d09] text-[#a86e50] hover:text-[#f3caa0]"
          }`}
        >
          [1] {isBaseline ? "BASELINE OVERVIEW" : "DIVERGENCE & ASSUMPTIONS"}
        </button>

        {!isBaseline && (
          <button
            type="button"
            onClick={() => setActiveTab("causal")}
            className={`px-3 py-1 rounded transition-colors cursor-pointer ${
              activeTab === "causal"
                ? "bg-[#803112] text-[#fff] font-bold"
                : "bg-[#180d09] text-[#a86e50] hover:text-[#f3caa0]"
            }`}
          >
            [2] CAUSAL CHAIN & 4 EVENTS
          </button>
        )}

        {!isBaseline && (
          <button
            type="button"
            onClick={() => setActiveTab("consequences")}
            className={`px-3 py-1 rounded transition-colors cursor-pointer ${
              activeTab === "consequences"
                ? "bg-[#803112] text-[#fff] font-bold"
                : "bg-[#180d09] text-[#a86e50] hover:text-[#f3caa0]"
            }`}
          >
            [3] CONSEQUENCES & UNCERTAINTY
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab("sources")}
          className={`px-3 py-1 rounded transition-colors cursor-pointer ${
            activeTab === "sources"
              ? "bg-[#803112] text-[#fff] font-bold"
              : "bg-[#180d09] text-[#a86e50] hover:text-[#f3caa0]"
          }`}
        >
          [{isBaseline ? "2" : "4"}] VERIFIED SOURCES & INTEGRITY
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-4 text-xs sm:text-sm font-mono leading-relaxed">
          {isBaseline ? (
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-[#170e0b] border border-[#3f1f18] rounded-lg">
                <span className="text-[#f59e0b] font-bold uppercase block mb-1">
                  HISTORICAL SUMMARY:
                </span>
                <p className="text-[#eed6b0]">{data.baseline.summary}</p>
              </div>

              <div className="text-[11px] text-[#aa6b4f]">
                ERA SPAN: {data.baseline.dateRange} {" // "} VERIFICATION: {data.sourceVerificationStatus}
              </div>
            </div>
          ) : currentBranch ? (
            <div className="flex flex-col gap-4">
              {/* Point of Divergence Callout */}
              <div className="p-3.5 bg-[#25100a] border-2 border-[#b45309] rounded-lg shadow-inner">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[#fbbf24] font-bold text-xs uppercase flex items-center gap-1.5">
                    <span>⚡ POINT OF DIVERGENCE (POD):</span>
                    <span>{currentBranch.pointOfDivergence.dateStr}</span>
                  </span>
                  <span className="text-[10px] text-[#8c5036] uppercase font-bold">
                    CHANGED HISTORICAL CONDITION
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#fff2da] mb-1">
                  {currentBranch.pointOfDivergence.title}
                </h4>
                <p className="text-[#eed4ae] mb-2">
                  <strong className="text-[#f59e0b]">Divergent Reality: </strong>
                  {currentBranch.pointOfDivergence.changedCondition}
                </p>
                <p className="text-[#a87458] text-xs border-t border-[#4a2219] pt-2">
                  <strong className="text-[#96634a]">Actual History Baseline: </strong>
                  {currentBranch.pointOfDivergence.historicalFact}
                </p>
              </div>

              {/* Explicit Assumptions */}
              <div className="p-3 bg-[#150d0a] border border-[#3d1f18] rounded-lg">
                <span className="text-[#f59e0b] font-bold uppercase block mb-2 text-xs">
                  EXPLICIT HISTORICAL ASSUMPTIONS:
                </span>
                <ul className="list-disc list-inside space-y-1.5 text-[#e5caa6] text-xs">
                  {currentBranch.explicitAssumptions.map((assump, idx) => (
                    <li key={idx} className="leading-snug">
                      {assump}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Comparison with Actual History Quick Card */}
              <div className="p-3 bg-[#180e0b] border border-[#381a14] rounded-lg">
                <span className="text-[#e29334] font-bold uppercase block mb-1 text-xs">
                  COMPARISON WITH ACTUAL HISTORY:
                </span>
                <p className="text-[#e0c8a6] text-xs leading-relaxed">
                  {currentBranch.comparisonWithActualHistory}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Tab 2: Causal Chain & 4 Events */}
      {activeTab === "causal" && currentBranch && (
        <div className="flex flex-col gap-4 text-xs sm:text-sm font-mono">
          {/* Causal Chain Walkthrough */}
          <div className="p-3 bg-[#1c0e0b] border border-[#522319] rounded-lg">
            <span className="text-[#fbbf24] font-bold uppercase block mb-1.5 text-xs">
              CAUSAL LOGIC (HOW ONE EVENT LED TO THE NEXT):
            </span>
            <p className="text-[#ffe0b2] text-xs mb-3 italic">
              {currentBranch.causalChain.summary}
            </p>
            <div className="space-y-2 border-t border-[#3e1b15] pt-2">
              {currentBranch.causalChain.steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-[#eed6b0]">
                  <span className="text-[#f59e0b] font-bold">STEP {idx + 1}:</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Exactly 4 Chronological Events */}
          <div>
            <span className="text-[#f5caa0] font-bold uppercase block mb-2 text-xs">
              FOUR CHRONOLOGICAL HYPOTHETICAL EVENTS:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {currentBranch.events.map((ev, idx) => {
                const isSelected = selectedEventId === ev.id;
                return (
                  <div
                    key={ev.id}
                    onClick={() => onSelectEvent(ev.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#38170e] border-[#f59e0b] shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                        : "bg-[#140b08] border-[#361913] hover:border-[#63271b]"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-[#aa6b4f] mb-1">
                      <span className="text-[#f59e0b] font-bold">
                        EVENT 0{idx + 1} {" // "} {ev.eventNumber}
                      </span>
                      <span>{ev.date}</span>
                    </div>
                    <h5 className="font-bold text-[#fff3dc] text-xs mb-1">
                      {ev.title}
                    </h5>
                    <p className="text-[#ddbe9d] text-[11px] mb-2 leading-relaxed">
                      {ev.description}
                    </p>
                    {ev.causalLink && (
                      <div className="text-[10px] text-[#a3684d] border-t border-[#2e130e] pt-1">
                        <strong className="text-[#c97c55]">Causal Bridge: </strong>
                        {ev.causalLink}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Consequences & Uncertainty */}
      {activeTab === "consequences" && currentBranch && (
        <div className="flex flex-col gap-3.5 text-xs sm:text-sm font-mono">
          <div className="p-3 bg-[#180e0b] border border-[#3f1f18] rounded-lg">
            <span className="text-[#f59e0b] font-bold uppercase block mb-1 text-xs">
              IMMEDIATE CONSEQUENCES:
            </span>
            <p className="text-[#eed6b0] text-xs leading-relaxed">
              {currentBranch.immediateConsequences}
            </p>
          </div>

          <div className="p-3 bg-[#180e0b] border border-[#3f1f18] rounded-lg">
            <span className="text-[#f59e0b] font-bold uppercase block mb-1 text-xs">
              LONGER-TERM CONSEQUENCES:
            </span>
            <p className="text-[#eed6b0] text-xs leading-relaxed">
              {currentBranch.longerTermConsequences}
            </p>
          </div>

          <div className="p-3 bg-[#1c110c] border border-[#5c2b1e] rounded-lg">
            <span className="text-[#e29334] font-bold uppercase block mb-1 text-xs">
              UNCERTAINTY & SENSITIVITY ANALYSIS:
            </span>
            <p className="text-[#fcd34d] text-xs leading-relaxed">
              {currentBranch.uncertaintyAnalysis}
            </p>
          </div>
        </div>
      )}

      {/* Tab 4: Sources & Content Integrity */}
      {activeTab === "sources" && (
        <div className="flex flex-col gap-3 text-xs sm:text-sm font-mono">
          <div className="p-3 bg-[#150d0a] border border-[#3f1f18] rounded-lg">
            <span className="text-[#4ade80] font-bold uppercase block mb-1 text-xs">
              VERIFIABLE SOURCES FOR ACTUAL HISTORICAL BASELINE:
            </span>
            <p className="text-[11px] text-[#aa6b4f] mb-3">
              Actual historical facts are referenced against established historical archives. Note that alternative branches are entirely fictional models and do not claim support from these historical sources.
            </p>

            <div className="space-y-2">
              {data.baseline.verifiedSources.map((src, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded bg-[#0d0705] border border-[#2b130e]"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-[#fef3c7]">
                    <span>{src.title}</span>
                    {src.url && (
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#f59e0b] hover:underline text-[10px]"
                      >
                        [OPEN ARCHIVE]
                      </a>
                    )}
                  </div>
                  <div className="text-[10px] text-[#b3795a] mt-0.5">
                    Publisher: {src.authorOrPublisher}
                  </div>
                  <div className="text-[10px] text-[#86513a] italic mt-0.5">
                    {src.citation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Selected Event Detail Overlay if clicked */}
      {highlightedEvent && (
        <div className="p-3 bg-[#261009] border-2 border-[#f59e0b] rounded-lg text-xs font-mono">
          <div className="flex items-center justify-between text-[#f5caa0] mb-1">
            <span className="font-bold text-[#fbbf24]">
              SELECTED EVENT INSPECTION: {highlightedEvent.eventNumber}
            </span>
            <button
              onClick={() => onSelectEvent("")}
              className="text-[#a0684f] hover:text-[#fff]"
            >
              [CLOSE]
            </button>
          </div>
          <div className="text-[#fff2da] font-bold text-sm">
            {highlightedEvent.title}
          </div>
          <div className="text-[10px] text-[#a87053] mb-1.5">
            DATE: {highlightedEvent.date} {" // "} TIME: {highlightedEvent.time} {" // "} LOCATION: {highlightedEvent.location}
          </div>
          <p className="text-[#e2caa8] leading-relaxed">
            {highlightedEvent.description}
          </p>
        </div>
      )}
    </div>
  );
};
