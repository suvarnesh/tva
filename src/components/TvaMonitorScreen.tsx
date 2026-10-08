"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { TimelineDetectionResult, TimelineBranch } from "@/types/timeline";
import {
  MAIN_TIMELINE_SEGMENTS,
  MAIN_RIBBON_PATH,
  MAIN_CENTERLINE_PATH,
  BRANCH_GEOMETRIES,
  BASELINE_EVENT_POSITIONS,
  mainRibbonWidthFn,
  branchWidthFn,
  generatePartialRibbonPath,
} from "@/lib/timelineRibbon";

interface TvaMonitorScreenProps {
  data: TimelineDetectionResult;
  onResetToPrompt: () => void;
}

export const TvaMonitorScreen: React.FC<TvaMonitorScreenProps> = ({
  data,
  onResetToPrompt,
}) => {
  // Currently selected branch (null = The Sacred Timeline / Actual History)
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(null);

  // Sequential growth animation state
  // Phase 1: Main branch grows from zero to full branch (0s -> 1.35s)
  // Phase 2: All sub-branches sprout outward from roots to full tips (1.35s -> 2.25s)
  const isReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const [animKey, setAnimKey] = useState<number>(0);
  const [mainGrowth, setMainGrowth] = useState<number>(() => (isReducedMotion ? 1 : 0));
  const [branchesGrowth, setBranchesGrowth] = useState<number>(() => (isReducedMotion ? 1 : 0));
  const [isAnimationDone, setIsAnimationDone] = useState<boolean>(() => isReducedMotion);

  useEffect(() => {
    if (isReducedMotion) return;

    let startTime: number | null = null;
    let rafId: number;

    const durationMain = 1350; // 1.35s main timeline growth
    const durationBranches = 900; // 0.9s sub-branches growth
    const totalDuration = durationMain + durationBranches;

    // Cubic easing functions
    const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);
    const easeInOutCubic = (x: number): number =>
      x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

    const frame = (now: number) => {
      if (startTime === null) startTime = now;
      const elapsed = now - startTime;

      if (elapsed < durationMain) {
        // Main branch grows from 0 to 1
        const p = elapsed / durationMain;
        setMainGrowth(easeInOutCubic(p));
        setBranchesGrowth(0);
        rafId = requestAnimationFrame(frame);
      } else if (elapsed < totalDuration) {
        // Main branch is fully grown; sub-branches sprout from 0 to 1
        setMainGrowth(1);
        const bp = (elapsed - durationMain) / durationBranches;
        setBranchesGrowth(easeOutCubic(bp));
        rafId = requestAnimationFrame(frame);
      } else {
        // Animation complete: lock to full precomputed paths
        setMainGrowth(1);
        setBranchesGrowth(1);
        setIsAnimationDone(true);
      }
    };

    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [animKey, isReducedMotion]);

  const handleReplayAnimation = () => {
    setMainGrowth(0);
    setBranchesGrowth(0);
    setIsAnimationDone(false);
    setAnimKey((k) => k + 1);
  };

  // Hover state for interactive exploration
  const [hoveredBranchIndex, setHoveredBranchIndex] = useState<number | null>(null);
  const [hoveredEvent, setHoveredEvent] = useState<{
    branchIndex: number | null; // null for baseline
    eventIndex: number;
    title: string;
    date: string;
  } | null>(null);

  // JSON modal state
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonCopyFeedback, setJsonCopyFeedback] = useState(false);
  const [jsonTab, setJsonTab] = useState<"all" | "baseline" | "branch">("all");

  const selectedBranch: TimelineBranch | undefined = data.alternatives.find(
    (b) => b.id === selectedBranchId
  );

  const handleSelectBranch = useCallback((branchId: string | null) => {
    setSelectedBranchId(branchId);
    setSelectedEventIndex(null);
  }, []);

  const handleSelectEvent = useCallback((branchId: string, eventIndex: number) => {
    setSelectedBranchId(branchId);
    setSelectedEventIndex(eventIndex);
  }, []);

  const handleCopyJson = async () => {
    const jsonContent =
      jsonTab === "all"
        ? JSON.stringify(data, null, 2)
        : jsonTab === "baseline"
        ? JSON.stringify(data.baseline, null, 2)
        : JSON.stringify(selectedBranch || data.alternatives[0], null, 2);

    try {
      await navigator.clipboard.writeText(jsonContent);
      setJsonCopyFeedback(true);
      setTimeout(() => setJsonCopyFeedback(false), 2000);
    } catch (e) {
      console.error("Clipboard copy failed:", e);
    }
  };

  const handleDownloadJson = () => {
    const jsonContent =
      jsonTab === "all"
        ? JSON.stringify(data, null, 2)
        : jsonTab === "baseline"
        ? JSON.stringify(data.baseline, null, 2)
        : JSON.stringify(selectedBranch || data.alternatives[0], null, 2);

    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${data.query.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${jsonTab}_timeline.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Keyboard navigation for branch switching and modal close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "Escape") {
        if (isJsonModalOpen) {
          setIsJsonModalOpen(false);
        } else {
          handleSelectBranch(null);
        }
        return;
      }

      if (e.key === "1") {
        if (data.alternatives[0]) handleSelectBranch(data.alternatives[0].id);
      } else if (e.key === "2") {
        if (data.alternatives[1]) handleSelectBranch(data.alternatives[1].id);
      } else if (e.key === "3") {
        if (data.alternatives[2]) handleSelectBranch(data.alternatives[2].id);
      } else if (e.key === "4") {
        if (data.alternatives[3]) handleSelectBranch(data.alternatives[3].id);
      } else if (e.key === "0") {
        handleSelectBranch(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [data.alternatives, handleSelectBranch, isJsonModalOpen]);

  // Procedural ribbon paths during growth animation
  const currentMainRibbonPath = useMemo(() => {
    if (isAnimationDone) return MAIN_RIBBON_PATH;
    return generatePartialRibbonPath(MAIN_TIMELINE_SEGMENTS, mainRibbonWidthFn, 65, mainGrowth);
  }, [isAnimationDone, mainGrowth]);

  const currentBranchPaths = useMemo(() => {
    if (isAnimationDone) {
      return BRANCH_GEOMETRIES.map((g) => g.ribbonPath);
    }
    if (branchesGrowth <= 0.002) {
      return ["", "", "", ""];
    }
    return BRANCH_GEOMETRIES.map((g) =>
      generatePartialRibbonPath(g.segments, branchWidthFn(g.baseWidth), 50, branchesGrowth)
    );
  }, [isAnimationDone, branchesGrowth]);

  return (
    <div className="w-full max-w-[1440px] mx-auto p-2 sm:p-4 md:p-6 font-mono text-[#f39c12] select-none">
      {/* Outer TVA Terminal HUD (Matching Reference Image) */}
      <div className="relative w-full bg-[#12100b] border-[3.5px] border-[#e67e22] rounded-3xl p-3 sm:p-6 md:p-8 shadow-[0_0_50px_rgba(230,126,34,0.35),inset_0_0_40px_rgba(0,0,0,0.95)] tva-hud-grid overflow-hidden min-h-[640px] flex flex-col justify-between">
        
        {/* Subtle Scanline Overlay */}
        <div className="crt-scanlines absolute inset-0 pointer-events-none opacity-20 z-0" />

        {/* Top Control Bar (Branch Switchers & Replay) */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pb-3 mb-2 border-b border-[#e67e22]/30 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#e67e22] font-bold">STATUS:</span>
            <span className="text-[#fef3c7] font-semibold">
              {selectedBranchId === null ? "SACRED TIMELINE LOCKED" : "BRANCH DETECTED"}
            </span>
            <span className="text-[10px] text-[#aa6b4f]">
              {" // "} EVENT: &quot;{data.query}&quot;
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => handleSelectBranch(null)}
              className={`px-2.5 py-1 rounded border text-[11px] font-bold transition-all cursor-pointer ${
                selectedBranchId === null
                  ? "bg-[#e67e22] text-[#090604] border-[#f39c12] shadow-[0_0_10px_rgba(230,126,34,0.6)]"
                  : "bg-[#180d09] text-[#e0a980] border-[#54271c] hover:border-[#e67e22]"
              }`}
              title="Shortcut: Press 0 or Esc"
            >
              SACRED TIMELINE
            </button>

            {data.alternatives.map((b, i) => (
              <button
                key={b.id}
                onClick={() => handleSelectBranch(b.id)}
                className={`px-2.5 py-1 rounded border text-[11px] font-bold transition-all cursor-pointer ${
                  selectedBranchId === b.id
                    ? "bg-[#e67e22] text-[#090604] border-[#f39c12] shadow-[0_0_10px_rgba(230,126,34,0.6)]"
                    : "bg-[#180d09] text-[#e0a980] border-[#54271c] hover:border-[#e67e22]"
                }`}
                title={`Shortcut: Press ${i + 1}`}
              >
                BRANCH 0{b.branchNumber}
              </button>
            ))}

            <button
              onClick={handleReplayAnimation}
              title="Replay timeline & branch growth animation"
              className="ml-1 px-2.5 py-1 rounded bg-[#2a130b] border border-[#d35400] hover:bg-[#3d1a0e] text-[#ffd384] text-[11px] font-bold transition-colors cursor-pointer"
            >
              ⟳ REPLAY
            </button>

            <button
              onClick={() => setIsJsonModalOpen(true)}
              title="Inspect and copy generated timeline JSON"
              className="ml-1 px-2.5 py-1 rounded bg-[#1d120a] border border-[#e67e22] hover:bg-[#351b0f] text-[#f39c12] text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>{'{ }'}</span>
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* Center Grid: Left = Organic Timeline Ribbon SVG, Right = Info Panels */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 flex-1 items-center my-auto">
          
          {/* LEFT AREA: Centered Timeline Ribbon Visualization (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center relative p-2 sm:p-4 my-auto min-h-[360px] sm:min-h-[440px]">
            <svg
              viewBox="0 0 960 360"
              className="w-full h-auto max-h-[440px] drop-shadow-[0_0_16px_rgba(243,156,18,0.3)] outline-none focus:outline-none select-none"
              style={{ outline: "none" }}
            >
              <defs>
                {/* Restrained Amber Bloom Filter */}
                <filter id="restrained-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 1. Restrained Amber Bloom Layer (Warm soft underglow beneath ribbons) */}
              <g opacity="0.45" filter="url(#restrained-glow)">
                {currentMainRibbonPath && (
                  <path d={currentMainRibbonPath} fill="#e67e22" />
                )}
                {BRANCH_GEOMETRIES.map((geom, idx) => {
                  const bPath = currentBranchPaths[idx];
                  if (!bPath) return null;
                  const alt = data.alternatives[idx];
                  if (!alt) return null;
                  const isSelected = selectedBranchId === alt.id;
                  return (
                    <path
                      key={`glow-${alt.id}`}
                      d={bPath}
                      fill={isSelected ? "#f59e0b" : "#e67e22"}
                      opacity={isSelected ? 0.75 : 0.4}
                    />
                  );
                })}
              </g>

              {/* 2. Crisp Warm Cream Ribbon Core */}
              <g fill="#fdf8ea">
                {/* Main Sacred Timeline Ribbon (Phase 1: grows from zero to full branch) */}
                {currentMainRibbonPath && (
                  <path
                    d={currentMainRibbonPath}
                    fill={selectedBranchId === null ? "#ffffff" : "#fdf8ea"}
                    opacity={selectedBranchId === null ? 1 : 0.75}
                    className="transition-colors duration-200"
                  />
                )}

                {/* 4 Alternative Sub-Branches (Phase 2: sprout outward from main branch roots) */}
                {BRANCH_GEOMETRIES.map((geom, idx) => {
                  const bPath = currentBranchPaths[idx];
                  if (!bPath) return null;
                  const alt = data.alternatives[idx];
                  if (!alt) return null;
                  const isSelected = selectedBranchId === alt.id;
                  const isHovered = hoveredBranchIndex === idx;

                  return (
                    <path
                      key={`core-${alt.id}`}
                      d={bPath}
                      fill={isSelected ? "#ffffff" : isHovered ? "#fffdf5" : "#fdf8ea"}
                      opacity={selectedBranchId !== null && !isSelected ? 0.5 : 0.95}
                      className="transition-colors duration-200"
                    />
                  );
                })}
              </g>

              {/* 3. Invisible Hit Paths (Wide paths for comfortable click/hover interaction) */}
              {/* Sacred Timeline Hit Path */}
              <path
                d={MAIN_CENTERLINE_PATH}
                fill="none"
                stroke="transparent"
                strokeWidth="32"
                className="cursor-pointer outline-none focus:outline-none"
                style={{ outline: "none" }}
                onClick={() => handleSelectBranch(null)}
                onMouseEnter={() => setHoveredBranchIndex(-1)}
                onMouseLeave={() => setHoveredBranchIndex(null)}
                tabIndex={0}
                role="button"
                aria-label="Select The Sacred Timeline"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleSelectBranch(null);
                }}
              />

              {/* 4 Alternative Branches Hit Paths */}
              {BRANCH_GEOMETRIES.map((geom, idx) => {
                const alt = data.alternatives[idx];
                if (!alt) return null;

                return (
                  <path
                    key={`hit-${alt.id}`}
                    d={geom.centerlinePath}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="32"
                    className="cursor-pointer outline-none focus:outline-none"
                    style={{ outline: "none" }}
                    onClick={() => handleSelectBranch(alt.id)}
                    onMouseEnter={() => setHoveredBranchIndex(idx)}
                    onMouseLeave={() => setHoveredBranchIndex(null)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Select Branch 0${alt.branchNumber}: ${alt.title}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") handleSelectBranch(alt.id);
                    }}
                  />
                );
              })}

              {/* 4. Small Event Indicators - REVEALED ONLY ON HOVER, FOCUS, OR SELECTION */}
              {/* Baseline Milestones: only revealed if specific event is hovered */}
              {BASELINE_EVENT_POSITIONS.map((pos, i) => {
                const ev = data.baseline.events[i];
                if (!ev) return null;
                const isHovered =
                  hoveredEvent?.branchIndex === null && hoveredEvent?.eventIndex === i;

                return (
                  <g
                    key={`base-ev-${i}`}
                    className="cursor-pointer"
                    onMouseEnter={() =>
                      setHoveredEvent({
                        branchIndex: null,
                        eventIndex: i,
                        title: ev.title,
                        date: ev.date,
                      })
                    }
                    onMouseLeave={() => setHoveredEvent(null)}
                  >
                    {/* Generous invisible hit target */}
                    <circle cx={pos.x} cy={pos.y} r="18" fill="transparent" />

                    {/* Small indicator revealed ONLY on hover */}
                    {isHovered && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="4.5"
                        fill="#ffffff"
                        stroke="#e67e22"
                        strokeWidth="1.5"
                        className="animate-fade-in-node"
                      />
                    )}
                  </g>
                );
              })}

              {/* Alternative Branch Event Markers: revealed ONLY when that event is hovered, focused, or selected */}
              {BRANCH_GEOMETRIES.map((geom, idx) => {
                const alt = data.alternatives[idx];
                if (!alt) return null;
                const isBranchSelected = selectedBranchId === alt.id;

                return (
                  <g key={`markers-${alt.id}`}>
                    {geom.eventPositions.map((pos, eventIdx) => {
                      const ev = alt.events[eventIdx];
                      if (!ev) return null;
                      const isEventSelected =
                        isBranchSelected && selectedEventIndex === eventIdx;
                      const isHoveredThisEvent =
                        hoveredEvent?.branchIndex === alt.branchNumber &&
                        hoveredEvent?.eventIndex === eventIdx;

                      // Reveal only if hovered or selected
                      const isVisible = isEventSelected || isHoveredThisEvent;

                      return (
                        <g
                          key={`node-${alt.id}-${eventIdx}`}
                          className="cursor-pointer outline-none focus:outline-none"
                          style={{ outline: "none" }}
                          onClick={() => handleSelectEvent(alt.id, eventIdx)}
                          onMouseEnter={() =>
                            setHoveredEvent({
                              branchIndex: alt.branchNumber,
                              eventIndex: eventIdx,
                              title: ev.title,
                              date: ev.date,
                            })
                          }
                          onMouseLeave={() => setHoveredEvent(null)}
                          tabIndex={0}
                          role="button"
                          aria-label={`Event 0${eventIdx + 1}: ${ev.title}`}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              handleSelectEvent(alt.id, eventIdx);
                            }
                          }}
                        >
                          {/* Generous invisible hit target */}
                          <circle cx={pos.x} cy={pos.y} r="18" fill="transparent" />

                          {/* Revealed Indicator */}
                          {isVisible && (
                            <>
                              {isEventSelected && (
                                <circle
                                  cx={pos.x}
                                  cy={pos.y}
                                  r="7.5"
                                  fill="none"
                                  stroke="#ffffff"
                                  strokeWidth="1.2"
                                  opacity="0.8"
                                />
                              )}
                              <circle
                                cx={pos.x}
                                cy={pos.y}
                                r={isEventSelected ? "4.5" : "3.5"}
                                fill={isEventSelected ? "#ffffff" : "#ffd384"}
                                stroke="#e67e22"
                                strokeWidth="1.2"
                                className="animate-fade-in-node"
                              />
                            </>
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </svg>

            {/* Footer Instruction */}
            <div className="text-[10px] sm:text-xs text-[#a0684f] mt-3 text-center h-5 flex items-center justify-center font-bold tracking-wider">
              {hoveredEvent ? (
                <span className="text-[#ffd384]">
                  {hoveredEvent.branchIndex === null
                    ? `▶ SACRED TIMELINE RECORD (${hoveredEvent.date}): "${hoveredEvent.title}"`
                    : `▶ BRANCH 0${hoveredEvent.branchIndex} // EVENT 0${hoveredEvent.eventIndex + 1} (${hoveredEvent.date}): "${hoveredEvent.title}"`}
                </span>
              ) : (
                <span>SELECT A BRANCH TO EXPLORE AN ALTERNATIVE HISTORY</span>
              )}
            </div>
          </div>

          {/* RIGHT AREA: Boxed TVA HUD Panels (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3 sm:gap-4 h-full justify-center">
            
            {/* Box 1 (Top): Title Box with Rounded Orange Border */}
            <div className="w-full bg-[#120c09] border-2 border-[#e67e22] rounded-xl px-4 py-3 sm:py-3.5 text-center shadow-[0_0_15px_rgba(230,126,34,0.25)]">
              <span className="text-sm sm:text-base font-bold text-[#f39c12] tracking-widest uppercase glow-amber-text block">
                {selectedBranchId === null
                  ? "THE SACRED TIMELINE (ACTUAL HISTORY)"
                  : selectedBranch
                  ? `BRANCH 0${selectedBranch.branchNumber}: ${selectedBranch.shortTag}`
                  : "BRANCH DETECTED"}
              </span>
            </div>

            {/* Box 2 (Bottom): Detailed Information Box with Rounded Orange Border */}
            <div className="w-full bg-[#120c09] border-2 border-[#e67e22] rounded-xl p-4 sm:p-5 shadow-[0_0_20px_rgba(230,126,34,0.25)] flex flex-col gap-3 min-h-[300px] sm:min-h-[360px] max-h-[460px] overflow-hidden">
              
              {/* Box Header: Title, Date Badge & JSON Button */}
              <div className="flex items-center justify-between border-b border-[#52251a] pb-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#e67e22] tracking-wider uppercase">
                    {selectedBranchId === null ? "ACTUAL HISTORY" : "BRANCH HISTORY"}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2e150d] text-[#ffd384] border border-[#52251a] font-mono">
                    {selectedBranchId === null
                      ? data.baseline.dateRange
                      : `POD: ${selectedBranch?.pointOfDivergence.dateStr}`}
                  </span>
                </div>

                <button
                  onClick={() => setIsJsonModalOpen(true)}
                  className="px-2 py-0.5 rounded text-[10px] bg-[#22120a] hover:bg-[#3d1a0e] text-[#f39c12] border border-[#e67e22]/60 font-bold transition-colors cursor-pointer flex items-center gap-1"
                  title="Inspect and copy generated JSON data"
                >
                  <span>{'{ }'}</span>
                  <span>JSON</span>
                </button>
              </div>

              {/* Scrollable Content Body */}
              <div className="overflow-y-auto pr-1 text-xs leading-relaxed text-[#ffd384] space-y-3 flex-1">
                {selectedBranchId === null ? (
                  // Baseline Actual History: Concise Date + Description format
                  <div className="space-y-3">
                    {/* Primary Incident Card */}
                    <div className="p-3 bg-[#190e09] rounded-lg border border-[#e67e22]/50 shadow-[0_0_10px_rgba(230,126,34,0.15)]">
                      <div className="flex items-center justify-between text-[#e67e22] text-[11px] font-bold mb-1">
                        <span>HISTORICAL INCIDENT</span>
                        <span className="text-[#fef08a] font-mono">[{data.baseline.dateRange}]</span>
                      </div>
                      <p className="text-[#fffdf0] text-xs leading-snug">
                        {data.baseline.summary}
                      </p>
                    </div>

                    {/* Milestone Incidents Timeline */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[#e67e22] font-bold text-[10.5px] tracking-wider uppercase block">
                        AUTHENTIC INCIDENTS ({data.baseline.events.length}):
                      </span>
                      <div className="space-y-1.5">
                        {data.baseline.events.map((ev, i) => (
                          <div
                            key={ev.id}
                            onMouseEnter={() =>
                              setHoveredEvent({
                                branchIndex: null,
                                eventIndex: i,
                                title: ev.title,
                                date: ev.date,
                              })
                            }
                            onMouseLeave={() => setHoveredEvent(null)}
                            className="p-2 bg-[#140b08] hover:bg-[#20100a] rounded border border-[#3e1b14] hover:border-[#853e2a] text-[11px] transition-colors"
                          >
                            <div className="flex items-center justify-between text-[#fef08a] font-bold text-[10.5px] mb-0.5">
                              <span className="truncate pr-2">{ev.title}</span>
                              <span className="font-mono text-[#e67e22] shrink-0">[{ev.date}]</span>
                            </div>
                            <p className="text-[#e0b994] text-[10.5px] leading-snug">
                              {ev.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : selectedBranch ? (
                  // Selected Branch: Concise Divergence & Sub-Branch Incidents
                  <div className="space-y-3">
                    {/* Point of Divergence Incident Card */}
                    <div className="p-3 bg-[#1c0f0a] rounded-lg border border-[#e67e22]/70 shadow-[0_0_12px_rgba(230,126,34,0.2)]">
                      <div className="flex items-center justify-between text-[#f39c12] text-[11px] font-bold mb-1">
                        <span>POINT OF DIVERGENCE</span>
                        <span className="text-[#fef08a] font-mono">[{selectedBranch.pointOfDivergence.dateStr}]</span>
                      </div>
                      <p className="text-[#fffdf0] text-xs leading-snug font-medium">
                        {selectedBranch.pointOfDivergence.changedCondition}
                      </p>
                      <div className="text-[10px] text-[#a0684f] mt-1.5 pt-1.5 border-t border-[#3e1b14] flex items-center justify-between">
                        <span>Baseline: {selectedBranch.pointOfDivergence.historicalFact}</span>
                      </div>
                    </div>

                    {/* Sub-Branch Chronological Incidents */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[#e67e22] font-bold text-[10.5px] tracking-wider uppercase">
                          BRANCH INCIDENTS ({selectedBranch.events.length}):
                        </span>
                        <span className="text-[9.5px] text-[#aa6b4f]">
                          CLICK EVENT TO LOCATE
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {selectedBranch.events.map((ev, i) => {
                          const isEvActive = selectedEventIndex === i;
                          return (
                            <div
                              key={ev.id}
                              onClick={() => setSelectedEventIndex(i)}
                              onMouseEnter={() =>
                                setHoveredEvent({
                                  branchIndex: selectedBranch.branchNumber,
                                  eventIndex: i,
                                  title: ev.title,
                                  date: ev.date,
                                })
                              }
                              onMouseLeave={() => setHoveredEvent(null)}
                              className={`p-2 rounded border text-[11px] cursor-pointer transition-all ${
                                isEvActive
                                  ? "bg-[#33170e] border-[#f39c12] text-white shadow-[0_0_10px_rgba(243,156,18,0.3)]"
                                  : "bg-[#140b08] border-[#3e1b14] text-[#ffd89b] hover:border-[#853e2a] hover:bg-[#1f100a]"
                              }`}
                            >
                              <div className="flex items-center justify-between text-[#f39c12] font-bold text-[10.5px] mb-0.5">
                                <span className="truncate pr-2">0{i + 1}. {ev.title}</span>
                                <span className="font-mono text-[#fef08a] shrink-0">[{ev.date}]</span>
                              </div>
                              <p className="text-[#e0b994] text-[10.5px] leading-snug">
                                {ev.description}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Bottom variance status */}
              <div className="text-[10px] text-[#7a4933] border-t border-[#3a1a14] pt-2 flex items-center justify-between">
                <span>VARIANCE: {selectedBranch ? `${selectedBranch.varianceScore.toFixed(1)}%` : "0.0%"}</span>
                <span>STATUS: COUNTERFACTUAL QUANTUM MODEL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row (Matching Reference Image) */}
        <div className="relative z-10 flex items-center justify-between pt-4 mt-2 border-t border-[#e67e22]/30">
          
          {/* Bottom Left: ATDS Badge */}
          <div className="flex items-center">
            <div className="px-3 py-1 bg-[#8b1515] border border-[#d92222] text-[#ffba5a] font-extrabold tracking-widest text-xs sm:text-sm rounded shadow-[0_0_8px_rgba(217,34,34,0.4)]">
              ATDS
            </div>
          </div>

          {/* Bottom Center: OVERTHROW TIME KEEPERS Red Pill Button */}
          <div>
            <button
              onClick={onResetToPrompt}
              className="px-5 sm:px-8 py-2 bg-[#8b1515] hover:bg-[#a51919] active:scale-[0.98] border border-[#d92222] rounded-lg text-white font-mono font-bold text-xs sm:text-sm tracking-wider uppercase shadow-[0_0_12px_rgba(217,34,34,0.4)] transition-all cursor-pointer"
            >
              OVERTHROW TIME KEEPERS
            </button>
          </div>

          {/* Bottom Right: Iconic TVA Stylized Emblem */}
          <div className="flex items-center">
            <span className="text-3xl sm:text-4xl font-black text-[#c05a18] tracking-wider select-none font-sans drop-shadow-[0_0_8px_rgba(192,90,24,0.5)]">
              TVA
            </span>
          </div>
        </div>
      </div>

      {/* TVA JSON Inspection Modal */}
      {isJsonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-[#0e0906] border-2 border-[#e67e22] rounded-2xl shadow-[0_0_40px_rgba(230,126,34,0.4)] flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-[#52251a] bg-[#170e09]">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-[#f39c12] tracking-wider uppercase">
                  TVA TIMELINE GENERATION JSON
                </span>
                <span className="text-[10px] text-[#aa6b4f] font-mono">
                  [QUERY: {data.query}]
                </span>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setIsJsonModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#26130b] text-[#ffd384] hover:bg-[#3d1a0e] text-xs font-bold border border-[#52251a] cursor-pointer transition-colors"
                title="Close (Esc)"
              >
                ✕
              </button>
            </div>

            {/* Modal Subheader: Scope Tabs + Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-[#120a07] border-b border-[#3e1b14] text-xs">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setJsonTab("all")}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                    jsonTab === "all"
                      ? "bg-[#e67e22] text-black"
                      : "bg-[#1c0f0a] text-[#b07856] hover:text-[#ffd384]"
                  }`}
                >
                  FULL RESULT
                </button>
                <button
                  onClick={() => setJsonTab("baseline")}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                    jsonTab === "baseline"
                      ? "bg-[#e67e22] text-black"
                      : "bg-[#1c0f0a] text-[#b07856] hover:text-[#ffd384]"
                  }`}
                >
                  ACTUAL HISTORY
                </button>
                <button
                  onClick={() => setJsonTab("branch")}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                    jsonTab === "branch"
                      ? "bg-[#e67e22] text-black"
                      : "bg-[#1c0f0a] text-[#b07856] hover:text-[#ffd384]"
                  }`}
                >
                  SELECTED BRANCH
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyJson}
                  className="px-3 py-1 rounded bg-[#2a130b] hover:bg-[#3d1a0e] border border-[#d35400] text-[#ffd384] text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1.5"
                >
                  <span>{jsonCopyFeedback ? "✓" : "📋"}</span>
                  <span>{jsonCopyFeedback ? "COPIED TO CLIPBOARD!" : "COPY JSON"}</span>
                </button>
                <button
                  onClick={handleDownloadJson}
                  className="px-3 py-1 rounded bg-[#e67e22] hover:bg-[#f39c12] text-black text-[11px] font-bold cursor-pointer transition-all"
                >
                  ↓ DOWNLOAD .JSON
                </button>
              </div>
            </div>

            {/* Modal Code Viewer */}
            <div className="p-3 sm:p-4 flex-1 overflow-auto bg-[#070403]">
              <pre className="font-mono text-[11px] sm:text-xs leading-relaxed text-[#ffd89b] select-text">
                {jsonTab === "all"
                  ? JSON.stringify(data, null, 2)
                  : jsonTab === "baseline"
                  ? JSON.stringify(data.baseline, null, 2)
                  : JSON.stringify(selectedBranch || data.alternatives[0], null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
