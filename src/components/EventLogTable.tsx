"use client";

import React, { useMemo } from "react";
import {
  TimelineDetectionResult,
} from "@/types/timeline";

interface EventLogTableProps {
  data: TimelineDetectionResult;
  selectedBranchId: string | null;
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
  currentPlaybackYear: number;
}

export const EventLogTable: React.FC<EventLogTableProps> = ({
  data,
  selectedBranchId,
  selectedEventId,
  onSelectEvent,
  currentPlaybackYear,
}) => {
  // Determine which events to show:
  // If baseline is selected, show baseline events.
  // If a branch is selected, show baseline events up to divergence point + the 4 branch events!
  const displayEvents = useMemo(() => {
    if (selectedBranchId === null) {
      return data.baseline.events.map((e) => ({
        ...e,
        branchLabel: "ACTUAL BASELINE",
        isFictional: false,
      }));
    }

    const branch = data.alternatives.find((b) => b.id === selectedBranchId);
    if (!branch) return [];

    const podYear = branch.pointOfDivergence.year;

    // Preserved shared baseline history before POD
    const sharedPreDivergenceEvents = data.baseline.events
      .filter((e) => e.year <= podYear)
      .map((e) => ({
        ...e,
        branchLabel: "SHARED BASELINE",
        isFictional: false,
      }));

    // Branch events
    const branchEvents = branch.events.map((e) => ({
      ...e,
      branchLabel: `ALT 0${branch.branchNumber} [HYPOTHETICAL]`,
      isFictional: true,
    }));

    // Combine and sort chronologically
    return [...sharedPreDivergenceEvents, ...branchEvents].sort(
      (a, b) => a.year - b.year
    );
  }, [data, selectedBranchId]);

  return (
    <div className="flex flex-col bg-[#0d0705] border-2 border-[#421b14] rounded-xl overflow-hidden shadow-[inset_0_0_20px_rgba(0,0,0,0.9)]">
      {/* Table Section Header with Double Amber Lines */}
      <div className="px-3 sm:px-4 py-2 bg-[#1b0a0a] border-b border-[#522118] flex flex-wrap items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-[#f59e0b] font-bold">▼</span>
          <span className="text-[#f5caa0] font-bold uppercase tracking-wider">
            CHRONOLOGICAL EVENT LOG // TEMPORAL REGISTRY
          </span>
          <span className="text-[10px] text-[#86513a]">
            [{displayEvents.length} RECORDED ENTRIES]
          </span>
        </div>
        <div className="text-[10px] text-[#9a6449]">
          FORMAT: TVA-ISO-6809 // DOUBLE CLICK TO INSPECT
        </div>
      </div>

      {/* Scrollable Monospace Table styled after the reference screenshot */}
      <div className="max-h-64 sm:max-h-72 overflow-y-auto">
        <table className="w-full text-left font-mono text-[11px] sm:text-xs">
          <thead className="sticky top-0 bg-[#160a08] border-b-2 border-[#57271d] text-[#e0986e] text-[10px] sm:text-[11px] tracking-wider uppercase select-none z-10">
            <tr>
              <th className="py-2 px-3">EVENT#</th>
              <th className="py-2 px-2.5">DATE</th>
              <th className="py-2 px-2.5 hidden sm:table-cell">TIME</th>
              <th className="py-2 px-3">LOCATION</th>
              <th className="py-2 px-2.5 hidden md:table-cell">BRANCH</th>
              <th className="py-2 px-3">SUMMARY / DESIGNATION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a130f]">
            {displayEvents.map((ev) => {
              const isSelected = selectedEventId === ev.id;
              const hasOccurred = ev.year <= currentPlaybackYear;

              return (
                <tr
                  key={ev.id}
                  onClick={() => onSelectEvent(ev.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[#3e190f] text-[#ffffff] font-semibold"
                      : hasOccurred
                      ? "hover:bg-[#1f0d09] text-[#ffdcb2]"
                      : "hover:bg-[#180907] text-[#a0684f] opacity-60"
                  }`}
                >
                  {/* Event Number */}
                  <td className="py-2 px-3 whitespace-nowrap text-[#f59e0b] font-bold">
                    <span className="flex items-center gap-1.5">
                      {isSelected ? (
                        <span className="text-[#fbbf24] text-xs">▶</span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#78350f]" />
                      )}
                      <span>{ev.eventNumber}</span>
                    </span>
                  </td>

                  {/* Date */}
                  <td className="py-2 px-2.5 whitespace-nowrap text-[#e0a982]">
                    {ev.date}
                  </td>

                  {/* Time */}
                  <td className="py-2 px-2.5 whitespace-nowrap text-[#aa7356] hidden sm:table-cell">
                    {ev.time || "00:00:00"}
                  </td>

                  {/* Location */}
                  <td className="py-2 px-3 whitespace-nowrap text-[#f5caa0] max-w-[140px] truncate">
                    {ev.location}
                  </td>

                  {/* Branch Tag */}
                  <td className="py-2 px-2.5 whitespace-nowrap hidden md:table-cell">
                    <span
                      className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold ${
                        ev.isFictional
                          ? "bg-[#34180d] text-[#fbbf24] border border-[#6b2c14]"
                          : "bg-[#182319] text-[#4ade80] border border-[#14532d]"
                      }`}
                    >
                      {ev.isFictional ? "HYPOTHETICAL" : "ACTUAL"}
                    </span>
                  </td>

                  {/* Summary / Title */}
                  <td className="py-2 px-3 text-[#eed6b0] max-w-[280px] sm:max-w-[360px] truncate">
                    <span className="font-bold text-[#fff2db] mr-1">
                      {ev.title}:
                    </span>
                    <span className="text-[#c99572]">{ev.description}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
