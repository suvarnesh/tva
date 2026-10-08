"use client";

import React, { useMemo } from "react";
import {
  TimelineDetectionResult,
  TimelineBranch,
  TimelineEvent,
} from "@/types/timeline";

interface TimelineSvgProps {
  data: TimelineDetectionResult;
  selectedBranchId: string | null; // null = Actual History
  selectedEventId: string | null;
  onSelectBranch: (branchId: string | null) => void;
  onSelectEvent: (eventId: string) => void;
  playbackProgress: number; // 0.0 to 1.0
  onScrubberClick?: (progress: number) => void;
}

export const TimelineSvg: React.FC<TimelineSvgProps> = ({
  data,
  selectedBranchId,
  selectedEventId,
  onSelectBranch,
  onSelectEvent,
  playbackProgress,
  onScrubberClick,
}) => {
  // SVG viewport geometry
  const SVG_WIDTH = 1000;
  const SVG_HEIGHT = 350;
  const PADDING_LEFT = 80;
  const PADDING_RIGHT = 60;
  const USABLE_WIDTH = SVG_WIDTH - PADDING_LEFT - PADDING_RIGHT;

  const BASELINE_Y = 175; // Center horizontal line
  const BRANCH_Y_MAP: Record<string, number> = {
    "top-outer": 45, // Alt 01
    "top-inner": 105, // Alt 02
    "bottom-inner": 245, // Alt 03
    "bottom-outer": 305, // Alt 04
  };

  const { startYear, endYear, compressedGaps } = data.timeSpan;
  const yearSpan = Math.max(endYear - startYear, 1);

  // Map a year to an X coordinate
  const getXForYear = useMemo(() => {
    return (year: number) => {
      const clampedYear = Math.max(startYear, Math.min(endYear, year));
      const ratio = (clampedYear - startYear) / yearSpan;
      return PADDING_LEFT + ratio * USABLE_WIDTH;
    };
  }, [startYear, endYear, yearSpan, PADDING_LEFT, USABLE_WIDTH]);

  // Current playhead X coordinate
  const playheadX = PADDING_LEFT + playbackProgress * USABLE_WIDTH;
  const currentScrubYear = Math.round(startYear + playbackProgress * yearSpan);

  // Generate grid years
  const gridYears = useMemo(() => {
    const years: number[] = [];
    const step = yearSpan > 40 ? 10 : yearSpan > 15 ? 5 : 2;
    for (let y = startYear; y <= endYear; y += step) {
      years.push(y);
    }
    if (!years.includes(endYear)) years.push(endYear);
    return years;
  }, [startYear, endYear, yearSpan]);

  // Handle clicking on timeline background to move scrubber
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onScrubberClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const svgClickX = (clickX / rect.width) * SVG_WIDTH;

    if (svgClickX >= PADDING_LEFT && svgClickX <= PADDING_LEFT + USABLE_WIDTH) {
      const newProgress = (svgClickX - PADDING_LEFT) / USABLE_WIDTH;
      onScrubberClick(Math.max(0, Math.min(1, newProgress)));
    }
  };

  return (
    <div className="relative w-full overflow-hidden bg-[#0a0706] border border-[#3e1b15] rounded-xl shadow-[inset_0_0_30px_rgba(0,0,0,0.85)] crt-grid select-none">
      
      {/* SVG Canvas */}
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full h-auto cursor-crosshair block"
        onClick={handleSvgClick}
        aria-label="Interactive Historical Counterfactual Timeline"
      >
        <defs>
          {/* Phosphor Glow Filters */}
          <filter id="amber-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="6" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="ivory-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur1" />
            <feGaussianBlur stdDeviation="8" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="node-pulse" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Compressed Gap Diagonal Pattern */}
          <pattern
            id="compressed-gap-pattern"
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="8" stroke="#f59e0b" strokeWidth="1" opacity="0.25" />
          </pattern>
        </defs>

        {/* 1. Background Grid & Oscilloscope Crosshairs */}
        <g className="grid-layer" opacity="0.4">
          {gridYears.map((year) => {
            const x = getXForYear(year);
            return (
              <g key={`grid-y-${year}`}>
                <line
                  x1={x}
                  y1={25}
                  x2={x}
                  y2={SVG_HEIGHT - 25}
                  stroke="#57281c"
                  strokeWidth="1"
                  strokeDasharray="2 4"
                />
                <text
                  x={x}
                  y={SVG_HEIGHT - 10}
                  fill="#9e5e3f"
                  fontSize="9"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {year}
                </text>
              </g>
            );
          })}

          {/* Horizontal Reference Guideline Rails */}
          {[45, 105, 175, 245, 305].map((y) => (
            <line
              key={`guide-${y}`}
              x1={PADDING_LEFT - 20}
              y1={y}
              x2={SVG_WIDTH - PADDING_RIGHT + 20}
              y2={y}
              stroke="#2e140f"
              strokeWidth="0.8"
              strokeDasharray="4 8"
            />
          ))}
        </g>

        {/* 2. Compressed Time Gaps Zones */}
        {compressedGaps.map((gap, idx) => {
          const x1 = getXForYear(gap.startYear);
          const x2 = getXForYear(gap.endYear);
          const width = Math.max(x2 - x1, 10);
          return (
            <g key={`gap-${idx}`} opacity="0.75">
              <rect
                x={x1}
                y={30}
                width={width}
                height={SVG_HEIGHT - 60}
                fill="url(#compressed-gap-pattern)"
                stroke="#d97706"
                strokeWidth="0.8"
                strokeDasharray="3 3"
              />
              <text
                x={x1 + width / 2}
                y={40}
                fill="#d97706"
                fontSize="8"
                fontFamily="monospace"
                textAnchor="middle"
                className="select-none uppercase"
              >
                {gap.label}
              </text>
            </g>
          );
        })}

        {/* 3. Central Line: ACTUAL HISTORY (Baseline) */}
        <g
          className="baseline-group cursor-pointer"
          onClick={() => onSelectBranch(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelectBranch(null);
            }
          }}
          aria-label="Select Baseline Actual History Timeline"
        >
          {/* Baseline Outer Glow */}
          <line
            x1={PADDING_LEFT}
            y1={BASELINE_Y}
            x2={SVG_WIDTH - PADDING_RIGHT}
            y2={BASELINE_Y}
            stroke="#b45309"
            strokeWidth={selectedBranchId === null ? "10" : "5"}
            opacity={selectedBranchId === null ? "0.6" : "0.35"}
            filter="url(#amber-glow)"
          />

          {/* Baseline Warm Amber Core */}
          <line
            x1={PADDING_LEFT}
            y1={BASELINE_Y}
            x2={SVG_WIDTH - PADDING_RIGHT}
            y2={BASELINE_Y}
            stroke="#f59e0b"
            strokeWidth={selectedBranchId === null ? "4.5" : "3"}
            opacity="0.9"
          />

          {/* Baseline Luminous Ivory Filament */}
          <line
            x1={PADDING_LEFT}
            y1={BASELINE_Y}
            x2={SVG_WIDTH - PADDING_RIGHT}
            y2={BASELINE_Y}
            stroke="#fffdf7"
            strokeWidth={selectedBranchId === null ? "2.5" : "1.5"}
            filter={selectedBranchId === null ? "url(#ivory-glow)" : undefined}
          />

          {/* Baseline Left Label Pill */}
          <g transform={`translate(${PADDING_LEFT - 65}, ${BASELINE_Y})`}>
            <rect
              x="-12"
              y="-10"
              width="72"
              height="20"
              rx="4"
              fill={selectedBranchId === null ? "#421809" : "#1e0c08"}
              stroke={selectedBranchId === null ? "#f59e0b" : "#612a1c"}
              strokeWidth="1.5"
            />
            <text
              x="24"
              y="3"
              fill={selectedBranchId === null ? "#fff4e0" : "#a86d4e"}
              fontSize="8.5"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              ACTUAL
            </text>
          </g>
        </g>

        {/* 4. Alternative Timeline Branches (Curving from Point of Divergence) */}
        {data.alternatives.map((branch: TimelineBranch) => {
          const isSelected = selectedBranchId === branch.id;
          const targetY = BRANCH_Y_MAP[branch.position] || BASELINE_Y;
          const podYear = branch.pointOfDivergence.year;
          const podX = getXForYear(podYear);
          const endX = SVG_WIDTH - PADDING_RIGHT;

          // Branch Curve Path:
          // Starts at (podX, BASELINE_Y) and curves smoothly to (targetX, targetY)
          // Then continues straight to endX.
          const curveSpreadX = Math.min(100, (endX - podX) * 0.45);
          const cp1X = podX + curveSpreadX * 0.5;
          const cp1Y = BASELINE_Y;
          const cp2X = podX + curveSpreadX * 0.5;
          const cp2Y = targetY;
          const afterCurveX = podX + curveSpreadX;

          const branchPathData = `M ${podX} ${BASELINE_Y} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${afterCurveX} ${targetY} L ${endX} ${targetY}`;

          return (
            <g
              key={branch.id}
              className="branch-group cursor-pointer"
              onClick={() => onSelectBranch(branch.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectBranch(branch.id);
                }
              }}
              aria-label={`Select branch ${branch.shortTag}`}
            >
              {/* Divergence Point Marker on Central Baseline */}
              <circle
                cx={podX}
                cy={BASELINE_Y}
                r={isSelected ? "5" : "3.5"}
                fill={isSelected ? "#f59e0b" : "#b45309"}
                stroke="#fff"
                strokeWidth="1"
              />

              {/* Branch Outer Glow */}
              <path
                d={branchPathData}
                fill="none"
                stroke={isSelected ? "#f59e0b" : "#78350f"}
                strokeWidth={isSelected ? "8" : "3"}
                opacity={isSelected ? "0.65" : "0.25"}
                filter="url(#amber-glow)"
              />

              {/* Branch Main Amber Path */}
              <path
                d={branchPathData}
                fill="none"
                stroke={isSelected ? "#fbbf24" : "#b45309"}
                strokeWidth={isSelected ? "3.5" : "1.8"}
                opacity={isSelected ? "1" : "0.55"}
              />

              {/* Branch Luminous Core (Ivory when selected) */}
              {isSelected && (
                <path
                  d={branchPathData}
                  fill="none"
                  stroke="#fffdf0"
                  strokeWidth="1.8"
                  filter="url(#ivory-glow)"
                />
              )}

              {/* Branch Tag Label at right */}
              <g transform={`translate(${endX + 6}, ${targetY})`}>
                <text
                  x="0"
                  y="3"
                  fill={isSelected ? "#ffcf70" : "#73432e"}
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight={isSelected ? "bold" : "normal"}
                  opacity={isSelected ? 1 : 0.75}
                >
                  {`ALT 0${branch.branchNumber}`}
                </text>
              </g>

              {/* Hypothetical Event Nodes on this branch */}
              {branch.events.map((ev: TimelineEvent, eIdx: number) => {
                // Ensure event X is past the curve
                const rawX = getXForYear(ev.year);
                const evX = Math.max(afterCurveX + eIdx * 15, rawX);
                const isEventSelected = selectedEventId === ev.id;
                const isPassed = evX <= playheadX;

                return (
                  <g
                    key={ev.id}
                    className="event-node cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectBranch(branch.id);
                      onSelectEvent(ev.id);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        e.preventDefault();
                        onSelectBranch(branch.id);
                        onSelectEvent(ev.id);
                      }
                    }}
                    aria-label={`Event: ${ev.title}`}
                  >
                    {/* Event Outer Aura */}
                    <circle
                      cx={evX}
                      cy={targetY}
                      r={isEventSelected ? "9" : isSelected ? "6" : "4.5"}
                      fill={
                        isEventSelected
                          ? "#f59e0b"
                          : isPassed
                          ? "#d97706"
                          : "#451a03"
                      }
                      opacity={isSelected ? (isPassed ? "0.9" : "0.5") : "0.3"}
                      filter="url(#node-pulse)"
                    />

                    {/* Event Center Core */}
                    <circle
                      cx={evX}
                      cy={targetY}
                      r={isEventSelected ? "5" : isSelected ? "3.5" : "2.5"}
                      fill={
                        isEventSelected
                          ? "#ffffff"
                          : isSelected && isPassed
                          ? "#fef3c7"
                          : "#92400e"
                      }
                      stroke={isSelected ? "#d97706" : "#451a03"}
                      strokeWidth="1"
                    />

                    {/* Node Year / Label Tooltip on Selection */}
                    {isSelected && (
                      <text
                        x={evX}
                        y={targetY - 10}
                        fill={isEventSelected ? "#fff3db" : "#f59e0b"}
                        fontSize="8"
                        fontFamily="monospace"
                        fontWeight={isEventSelected ? "bold" : "normal"}
                        textAnchor="middle"
                        className="pointer-events-none drop-shadow"
                      >
                        {ev.year}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* 5. Actual Baseline Event Nodes (on central horizontal line) */}
        {data.baseline.events.map((ev: TimelineEvent) => {
          const evX = getXForYear(ev.year);
          const isEventSelected = selectedEventId === ev.id;
          const isPassed = evX <= playheadX;
          const isBaselineSelected = selectedBranchId === null;

          return (
            <g
              key={ev.id}
              className="baseline-event-node cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onSelectBranch(null);
                onSelectEvent(ev.id);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  e.preventDefault();
                  onSelectBranch(null);
                  onSelectEvent(ev.id);
                }
              }}
              aria-label={`Actual history event: ${ev.title}`}
            >
              {/* Outer Glow Halo */}
              <circle
                cx={evX}
                cy={BASELINE_Y}
                r={isEventSelected ? "9" : isBaselineSelected ? "6.5" : "5"}
                fill={
                  isEventSelected
                    ? "#f59e0b"
                    : isPassed
                    ? "#b45309"
                    : "#2e1208"
                }
                opacity={isBaselineSelected ? "0.9" : "0.45"}
                filter="url(#node-pulse)"
              />

              {/* Core Node Dot */}
              <circle
                cx={evX}
                cy={BASELINE_Y}
                r={isEventSelected ? "5.5" : isBaselineSelected ? "4" : "3"}
                fill={
                  isEventSelected
                    ? "#ffffff"
                    : isBaselineSelected && isPassed
                    ? "#fff8db"
                    : "#d97706"
                }
                stroke="#78350f"
                strokeWidth="1"
              />

              {/* Node Year Tag */}
              {isBaselineSelected && (
                <text
                  x={evX}
                  y={BASELINE_Y + 18}
                  fill={isEventSelected ? "#fff3db" : "#fcd34d"}
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight={isEventSelected ? "bold" : "normal"}
                  textAnchor="middle"
                  className="pointer-events-none"
                >
                  {ev.year}
                </text>
              )}
            </g>
          );
        })}

        {/* 6. Dynamic Playhead / Scrubber Beam */}
        <g className="playhead-layer pointer-events-none">
          {/* Vertical Playhead Glow Line */}
          <line
            x1={playheadX}
            y1={15}
            x2={playheadX}
            y2={SVG_HEIGHT - 20}
            stroke="#f59e0b"
            strokeWidth="3.5"
            opacity="0.35"
            filter="url(#amber-glow)"
          />
          <line
            x1={playheadX}
            y1={15}
            x2={playheadX}
            y2={SVG_HEIGHT - 20}
            stroke="#ffeedd"
            strokeWidth="1.2"
            opacity="0.9"
          />

          {/* Top Playhead Capsule Indicator */}
          <g transform={`translate(${playheadX}, 18)`}>
            <polygon
              points="-6,-10 6,-10 0,-1"
              fill="#f59e0b"
              stroke="#fff"
              strokeWidth="0.8"
            />
            <rect
              x="-24"
              y="-22"
              width="48"
              height="13"
              rx="2"
              fill="#2e1008"
              stroke="#f59e0b"
              strokeWidth="1"
            />
            <text
              x="0"
              y="-13"
              fill="#fff"
              fontSize="8"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              {currentScrubYear}
            </text>
          </g>

          {/* Bottom Playhead Arrow */}
          <polygon
            points={`${playheadX - 5},${SVG_HEIGHT - 18} ${playheadX + 5},${
              SVG_HEIGHT - 18
            } ${playheadX},${SVG_HEIGHT - 25}`}
            fill="#f59e0b"
          />
        </g>
      </svg>

      {/* Interactive Helper Banner Under Canvas */}
      <div className="absolute top-2 right-2 pointer-events-none bg-[#18090b]/80 border border-[#521c17] px-2 py-0.5 rounded text-[10px] font-mono text-[#e0986e] flex items-center gap-1.5 backdrop-blur-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-ping" />
        <span>TEMPORAL MANIFOLD ACTIVE // 4 DIVERGENT BRANCHES</span>
      </div>
    </div>
  );
};
