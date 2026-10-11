"use client";

import React, { useState, useRef, useMemo } from "react";
import { TimelineDetectionResult, TimelineBranch } from "@/types/timeline";
import { tvaAudio } from "@/lib/tvaAudio";

interface TvaClassifiedDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TimelineDetectionResult;
  selectedBranchId: string | null;
  prunedBranchIds: string[];
}

export const TvaClassifiedDossierModal: React.FC<TvaClassifiedDossierModalProps> = ({
  isOpen,
  onClose,
  data,
  selectedBranchId,
  prunedBranchIds,
}) => {
  // Allow user to switch branch inside dossier modal (defaults to selectedBranchId or first branch)
  const [activeBranchId, setActiveBranchId] = useState<string | null>(
    selectedBranchId ?? data.alternatives[0]?.id ?? null
  );
  const [dossierTheme, setDossierTheme] = useState<"manila" | "crt">("manila");
  const [copiedAscii, setCopiedAscii] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync activeBranchId if modal reopens with a different selectedBranchId
  React.useEffect(() => {
    if (isOpen) {
      setActiveBranchId(selectedBranchId ?? data.alternatives[0]?.id ?? null);
      tvaAudio.playDossierStampSound();
    }
  }, [isOpen, selectedBranchId, data.alternatives]);

  const activeBranch: TimelineBranch | undefined = useMemo(() => {
    return data.alternatives.find((b) => b.id === activeBranchId);
  }, [data.alternatives, activeBranchId]);

  const isPruned = activeBranch ? prunedBranchIds.includes(activeBranch.id) : false;

  // Case ID formatted like TVA archival records
  const caseId = useMemo(() => {
    const raw = data.query.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const hash = Math.abs(
      data.query.split("").reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
    )
      .toString()
      .slice(0, 5);
    return `TVA-ARC-${hash || "77492"}-${raw.slice(0, 4) || "NEXS"}`;
  }, [data.query]);

  // Generate ASCII Dossier text for clipboard
  const generateAsciiDossier = (): string => {
    const divider = "═".repeat(74);
    const thinDivider = "─".repeat(74);
    const branchTitle = activeBranch ? activeBranch.title.toUpperCase() : "SACRED TIMELINE BASELINE";
    const branchNum = activeBranch ? `0${activeBranch.branchNumber}` : "00 (BASELINE)";
    const variance = activeBranch ? `${activeBranch.varianceScore.toFixed(1)}%` : "0.0% (SACRED TIMELINE)";
    const statusStr = isPruned
      ? "PURGED // RESET CHARGE DETONATED"
      : activeBranch
      ? "ACTIVE TEMPORAL ANOMALY"
      : "CANONICAL BASELINE // PROTECTED";

    const varianceBarLen = activeBranch ? Math.round((activeBranch.varianceScore / 100) * 20) : 0;
    const varianceBar = `[${"█".repeat(varianceBarLen)}${"░".repeat(20 - varianceBarLen)}]`;

    const eventsList = (activeBranch ? activeBranch.events : data.baseline.events)
      .map(
        (ev, i) =>
          `  [${i + 1}] ${ev.date} // ${ev.location.toUpperCase()}\n` +
          `      EVENT : ${ev.title.toUpperCase()}\n` +
          `      DETAIL: ${ev.description}`
      )
      .join("\n\n");

    return `
╔${divider}╗
║                    T I M E   V A R I A N C E   A U T H O R I T Y             ║
║                  OFFICE OF TEMPORAL ANOMALY INVESTIGATION                    ║
║                   CLASSIFIED CASE FILE // RESTRICTED ACCESS                  ║
╠${divider}╣
║ CASE FILE ID    : ${caseId.padEnd(24)} DIVISION  : ARCHIVES-SECTOR-17G ║
║ NEXUS EVENT     : "${data.query.toUpperCase().padEnd(22)}" CLEARANCE : LEVEL 6 (EYES ONLY)  ║
║ TIMELINE STATUS : ${statusStr.padEnd(46)} ║
╠${divider}╣
║ TARGET BRANCH   : BRANCH ${branchNum} - ${branchTitle.slice(0, 42).padEnd(42)} ║
║ VARIANCE GAUGE  : ${varianceBar} ${variance.padEnd(20)} ║
║ DIVERGENCE THOLD: ${(activeBranch?.divergenceThreshold || "DELTA-0.00").padEnd(46)} ║
╠${divider}╣
║ POINT OF DIVERGENCE:                                                         ║
║ CHANGED COND: ${(activeBranch?.pointOfDivergence.changedCondition || "N/A").slice(0, 60)}...
║ HISTORIC FACT: ${(activeBranch?.pointOfDivergence.historicalFact || "Canonical chronology preserved.").slice(0, 60)}...
╠${thinDivider}╣
║ CHRONOLOGICAL ANOMALY CASCADE:                                               ║
${eventsList}
╠${thinDivider}╣
║ FIELD NOTES & ASSESSMENT:                                                    ║
║ ${activeBranch ? activeBranch.immediateConsequences.slice(0, 70) : data.baseline.summary.slice(0, 70)}...
║ LONG-TERM: ${activeBranch ? activeBranch.longerTermConsequences.slice(0, 65) : "Canonical progression undisturbed."}...
╠${divider}╣
║ AUTH: MOBIUS M. MOBIUS // INVESTIGATOR B-15    "FOR ALL TIME. ALWAYS."       ║
╚${divider}╝
`.trim();
  };

  // Handle Copy ASCII
  const handleCopyAscii = async () => {
    tvaAudio.playTeletypeClick();
    const asciiText = generateAsciiDossier();
    try {
      await navigator.clipboard.writeText(asciiText);
      setCopiedAscii(true);
      setTimeout(() => setCopiedAscii(false), 2400);
    } catch {
      // Fallback
    }
  };

  // Print Dossier
  const handlePrintDossier = () => {
    tvaAudio.playDossierStampSound();
    window.print();
  };

  // High-Resolution PNG Canvas Generator
  const handleExportPng = () => {
    tvaAudio.playDossierStampSound();
    setIsExportingPng(true);

    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 860;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsExportingPng(false);
      return;
    }

    const isManila = dossierTheme === "manila";

    // 1. Background
    if (isManila) {
      ctx.fillStyle = "#e8ded0"; // Vintage aged manila folder paper
      ctx.fillRect(0, 0, 1200, 860);

      // Subtle paper grid / grain texture simulation
      ctx.strokeStyle = "rgba(180, 160, 140, 0.25)";
      ctx.lineWidth = 1;
      for (let x = 0; x < 1200; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 860);
        ctx.stroke();
      }
      for (let y = 0; y < 860; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1200, y);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = "#120e0a"; // CRT phosphor dark background
      ctx.fillRect(0, 0, 1200, 860);

      // CRT Scanlines
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      for (let y = 0; y < 860; y += 4) {
        ctx.fillRect(0, y, 1200, 2);
      }
    }

    // 2. Archival Double Border
    ctx.strokeStyle = isManila ? "#5c3d2e" : "#e67e22";
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 30, 1140, 800);
    ctx.lineWidth = 1;
    ctx.strokeRect(36, 36, 1128, 788);

    // 3. Header Section
    ctx.font = "bold 28px 'Courier New', monospace";
    ctx.fillStyle = isManila ? "#3d2214" : "#f39c12";
    ctx.fillText("TIME VARIANCE AUTHORITY", 60, 80);

    ctx.font = "14px 'Courier New', monospace";
    ctx.fillStyle = isManila ? "#6b4733" : "#fcd34d";
    ctx.fillText("OFFICE OF TEMPORAL ANOMALY INVESTIGATION // SECTOR 17-G", 60, 105);

    // Top Right Archival Barcode & Serial
    ctx.font = "bold 13px 'Courier New', monospace";
    ctx.fillStyle = isManila ? "#3d2214" : "#fbbf24";
    ctx.fillText(`CASE ID: ${caseId}`, 840, 75);
    ctx.fillText("CLEARANCE: LEVEL 6 (EYES ONLY)", 840, 95);

    // Simulated Barcode lines
    const barcodeX = 840;
    const barcodeY = 108;
    ctx.fillStyle = isManila ? "#3d2214" : "#f39c12";
    const barWidths = [3, 1, 4, 2, 1, 3, 5, 2, 1, 4, 2, 3, 1, 5, 2, 1, 3, 4, 2, 1, 3, 2];
    let currX = barcodeX;
    barWidths.forEach((w) => {
      ctx.fillRect(currX, barcodeY, w, 24);
      currX += w + 2;
    });

    // Divider Line
    ctx.strokeStyle = isManila ? "#8c5d43" : "#d97706";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 145);
    ctx.lineTo(1140, 145);
    ctx.stroke();

    // 4. Primary Anomaly Info
    ctx.font = "bold 16px 'Courier New', monospace";
    ctx.fillStyle = isManila ? "#2b1408" : "#fef3c7";
    ctx.fillText(`PRIMARY NEXUS EVENT: "${data.query.toUpperCase()}"`, 60, 180);

    const branchName = activeBranch ? `BRANCH 0${activeBranch.branchNumber} - ${activeBranch.title}` : "SACRED TIMELINE";
    ctx.fillText(`TARGET TIMELINE   : ${branchName}`, 60, 210);

    // Variance Meter Box
    if (activeBranch) {
      ctx.font = "14px 'Courier New', monospace";
      ctx.fillStyle = isManila ? "#6b4733" : "#f59e0b";
      ctx.fillText(`VARIANCE RATING   : ${activeBranch.varianceScore.toFixed(1)}% // ${activeBranch.divergenceThreshold}`, 60, 240);

      // Variance Bar
      ctx.fillStyle = isManila ? "#d4c5b3" : "#2a150c";
      ctx.fillRect(440, 226, 260, 18);
      ctx.fillStyle = activeBranch.varianceScore > 90 ? "#dc2626" : isManila ? "#b45309" : "#f59e0b";
      ctx.fillRect(440, 226, (activeBranch.varianceScore / 100) * 260, 18);
      ctx.strokeStyle = isManila ? "#5c3d2e" : "#f59e0b";
      ctx.lineWidth = 1;
      ctx.strokeRect(440, 226, 260, 18);
    }

    // 5. Point of Divergence Card Box
    ctx.fillStyle = isManila ? "rgba(220, 205, 190, 0.45)" : "rgba(35, 18, 10, 0.7)";
    ctx.fillRect(60, 270, 1080, 100);
    ctx.strokeStyle = isManila ? "#a8826c" : "#78350f";
    ctx.strokeRect(60, 270, 1080, 100);

    ctx.font = "bold 14px 'Courier New', monospace";
    ctx.fillStyle = isManila ? "#7c2d12" : "#fbbf24";
    ctx.fillText("POINT OF TEMPORAL DIVERGENCE (TRIGGER EVENT):", 75, 295);

    ctx.font = "13px 'Courier New', monospace";
    ctx.fillStyle = isManila ? "#331c10" : "#fed7aa";
    const changedTxt = activeBranch ? activeBranch.pointOfDivergence.changedCondition : "Canonical baseline flow intact.";
    ctx.fillText(`ALTERED CONDITION: ${changedTxt.slice(0, 110)}`, 75, 325);
    const histTxt = activeBranch ? activeBranch.pointOfDivergence.historicalFact : data.baseline.summary;
    ctx.fillText(`HISTORICAL FACT  : ${histTxt.slice(0, 110)}`, 75, 350);

    // 6. Chronological Incident Steps
    ctx.font = "bold 15px 'Courier New', monospace";
    ctx.fillStyle = isManila ? "#2b1408" : "#f39c12";
    ctx.fillText("OBSERVED ANOMALY CASCADE (CHRONOLOGICAL INCIDENTS):", 60, 410);

    const eventsToDraw = activeBranch ? activeBranch.events : data.baseline.events.slice(0, 4);
    eventsToDraw.forEach((ev, idx) => {
      const stepY = 445 + idx * 72;
      ctx.fillStyle = isManila ? "#432818" : "#fbbf24";
      ctx.font = "bold 13px 'Courier New', monospace";
      ctx.fillText(`[INCIDENT 0${idx + 1}] ${ev.date} - ${ev.location.toUpperCase()}: ${ev.title}`, 80, stepY);

      ctx.fillStyle = isManila ? "#2b1810" : "#fed7aa";
      ctx.font = "12px 'Courier New', monospace";
      ctx.fillText(`${ev.description.slice(0, 125)}`, 80, stepY + 22);
    });

    // 7. Footer / Clearance
    ctx.strokeStyle = isManila ? "#8c5d43" : "#d97706";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 750);
    ctx.lineTo(1140, 750);
    ctx.stroke();

    ctx.font = "12px 'Courier New', monospace";
    ctx.fillStyle = isManila ? "#6b4733" : "#f59e0b";
    ctx.fillText("APPROVED: MOBIUS M. MOBIUS // TIME-KEEPERS DIRECTIVE // CLASSIFIED CASE RECORD", 60, 780);
    ctx.fillText("\"FOR ALL TIME. ALWAYS.\"", 930, 780);

    // 8. VINTAGE RUBBER STAMPS (Rotated in canvas)
    ctx.save();
    if (isPruned) {
      // PURGED STAMP (Red)
      ctx.translate(880, 310);
      ctx.rotate((-12 * Math.PI) / 180);
      ctx.strokeStyle = "#b91c1c";
      ctx.lineWidth = 4;
      ctx.strokeRect(-160, -45, 320, 90);
      ctx.font = "bold 26px 'Courier New', monospace";
      ctx.fillStyle = "#b91c1c";
      ctx.textAlign = "center";
      ctx.fillText("RESET CHARGE PURGED", 0, -8);
      ctx.font = "bold 15px 'Courier New', monospace";
      ctx.fillText("ANOMALY DISINTEGRATED", 0, 22);
    } else if (activeBranch && activeBranch.varianceScore > 88) {
      // CRITICAL NEXUS STAMP (Red)
      ctx.translate(880, 310);
      ctx.rotate((-10 * Math.PI) / 180);
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 4;
      ctx.strokeRect(-150, -40, 300, 80);
      ctx.font = "bold 26px 'Courier New', monospace";
      ctx.fillStyle = "#dc2626";
      ctx.textAlign = "center";
      ctx.fillText("NEXUS EVENT REDLINE", 0, -6);
      ctx.font = "bold 14px 'Courier New', monospace";
      ctx.fillText("IMMEDIATE PRUNE ADVISORY", 0, 20);
    } else {
      // CONFIDENTIAL STAMP
      ctx.translate(880, 310);
      ctx.rotate((-14 * Math.PI) / 180);
      ctx.strokeStyle = isManila ? "#991b1b" : "#ef4444";
      ctx.lineWidth = 4;
      ctx.strokeRect(-140, -40, 280, 80);
      ctx.font = "bold 26px 'Courier New', monospace";
      ctx.fillStyle = isManila ? "#991b1b" : "#ef4444";
      ctx.textAlign = "center";
      ctx.fillText("CONFIDENTIAL", 0, -6);
      ctx.font = "bold 14px 'Courier New', monospace";
      ctx.fillText("TIME-KEEPERS ONLY", 0, 20);
    }
    ctx.restore();

    // Trigger Download
    setTimeout(() => {
      canvas.toBlob((blob) => {
        if (!blob) {
          setIsExportingPng(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const safeQuery = data.query.toLowerCase().replace(/[^a-z0-9]/g, "_");
        const branchTag = activeBranch ? `branch0${activeBranch.branchNumber}` : "baseline";
        a.href = url;
        a.download = `tva_case_file_${safeQuery}_${branchTag}.png`;
        a.click();
        URL.revokeObjectURL(url);
        setIsExportingPng(false);
      }, "image/png");
    }, 200);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border-2 border-[#e67e22] shadow-[0_0_50px_rgba(230,126,34,0.45)] overflow-hidden font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar (Classification & Actions) */}
        <div className="bg-[#18110b] border-b-2 border-[#e67e22] px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs z-10">
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-bold">📁 TVA ARCHIVAL CASE FILE:</span>
            <span className="text-amber-200 font-semibold">{caseId}</span>
          </div>

          {/* Theme switcher & Export actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Theme Toggle: Manila vs CRT */}
            <div className="flex rounded border border-[#e67e22]/50 p-0.5 bg-[#120a06]">
              <button
                onClick={() => {
                  tvaAudio.playBeep(900, 0.04);
                  setDossierTheme("manila");
                }}
                className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition-all cursor-pointer ${
                  dossierTheme === "manila"
                    ? "bg-[#d4a373] text-[#2b1810]"
                    : "text-[#d4a373] hover:text-[#fefae0]"
                }`}
              >
                MANILA PAPER
              </button>
              <button
                onClick={() => {
                  tvaAudio.playBeep(900, 0.04);
                  setDossierTheme("crt");
                }}
                className={`px-2 py-0.5 rounded text-[10.5px] font-bold transition-all cursor-pointer ${
                  dossierTheme === "crt"
                    ? "bg-[#e67e22] text-[#120a06]"
                    : "text-[#e67e22] hover:text-[#fefae0]"
                }`}
              >
                CRT RASTER
              </button>
            </div>

            {/* PNG Image Download */}
            <button
              onClick={handleExportPng}
              disabled={isExportingPng}
              className="px-3 py-1 bg-[#2e180d] hover:bg-[#452313] border border-[#f59e0b] text-[#fbbf24] rounded text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(245,158,11,0.2)] cursor-pointer disabled:opacity-50"
              title="Download high-resolution classified case file image for Hack Club Scrapbook / Discord"
            >
              <span>{isExportingPng ? "RENDERING..." : "📸 DOWNLOAD PNG"}</span>
            </button>

            {/* Copy ASCII Teletype */}
            <button
              onClick={handleCopyAscii}
              className="px-3 py-1 bg-[#1a1c12] hover:bg-[#282d1c] border border-[#a3e635] text-[#bef264] rounded text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Copy retro monospace ASCII case file to clipboard"
            >
              <span>{copiedAscii ? "✓ COPIED ASCII!" : "📋 COPY ASCII"}</span>
            </button>

            {/* Print / PDF */}
            <button
              onClick={handlePrintDossier}
              className="px-2.5 py-1 bg-[#1a1412] hover:bg-[#2d221e] border border-[#d6d3d1] text-[#e7e5e4] rounded text-[11px] font-bold transition-all cursor-pointer"
              title="Print or save as PDF"
            >
              🖨️ PRINT
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="px-2.5 py-1 bg-[#3a1515] hover:bg-[#521c1c] border border-[#ef4444] text-[#fca5a5] rounded text-[11px] font-bold transition-all cursor-pointer"
            >
              ✕ CLOSE
            </button>
          </div>
        </div>

        {/* Branch Selector Sub-bar inside Dossier */}
        <div className="bg-[#120d09] border-b border-[#e67e22]/40 px-4 py-2 flex items-center justify-between text-xs overflow-x-auto gap-2">
          <span className="text-[#a87452] text-[11px] font-bold whitespace-nowrap">
            EXAMINE SUBJECT:
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                tvaAudio.playBeep(850, 0.04);
                setActiveBranchId(null);
              }}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeBranchId === null
                  ? "bg-[#e67e22] text-[#120a06]"
                  : "bg-[#1c120c] text-[#cca080] border border-[#522b1b]"
              }`}
            >
              SACRED BASELINE
            </button>
            {data.alternatives.map((b) => {
              const pruned = prunedBranchIds.includes(b.id);
              return (
                <button
                  key={b.id}
                  onClick={() => {
                    tvaAudio.playBeep(850, 0.04);
                    setActiveBranchId(b.id);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeBranchId === b.id
                      ? pruned
                        ? "bg-[#451212] text-[#fca5a5] border border-[#ef4444] line-through"
                        : "bg-[#e67e22] text-[#120a06]"
                      : pruned
                      ? "bg-[#1f0d0d] text-[#7f2d2d] border border-[#3b1515] line-through"
                      : "bg-[#1c120c] text-[#cca080] border border-[#522b1b]"
                  }`}
                >
                  BRANCH 0{b.branchNumber} {pruned ? "✕" : ""}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dossier Body Card (Manila or CRT theme) */}
        <div
          className={`p-4 sm:p-8 overflow-y-auto flex-1 relative transition-colors ${
            dossierTheme === "manila"
              ? "bg-[#ede2d1] text-[#2c170d]"
              : "bg-[#130f0a] text-[#f39c12] crt-scanlines"
          }`}
        >
          {/* Manila Top Tab & Watermark */}
          {dossierTheme === "manila" && (
            <div className="absolute top-0 right-12 w-48 h-5 bg-[#d4c3aa] rounded-b border-b border-x border-[#8b684c] text-[9px] text-[#553825] font-bold text-center tracking-widest uppercase">
              CONFIDENTIAL CLASSIFICATION
            </div>
          )}

          {/* VINTAGE RUBBER STAMP (CSS Overlay) */}
          <div className="absolute top-10 right-6 sm:right-16 pointer-events-none select-none z-20">
            {isPruned ? (
              <div className="border-4 border-[#b91c1c] text-[#b91c1c] font-black uppercase text-xl sm:text-2xl px-4 py-2 tracking-widest -rotate-12 rounded shadow-[0_0_10px_rgba(185,28,28,0.3)] bg-[#b91c1c]/10 text-center">
                RESET CHARGE DETONATED
                <div className="text-[10px] tracking-normal mt-0.5">PURGED BY TVA MINUTE-MEN</div>
              </div>
            ) : activeBranch && activeBranch.varianceScore > 88 ? (
              <div className="border-4 border-[#dc2626] text-[#dc2626] font-black uppercase text-lg sm:text-xl px-4 py-2 tracking-wider -rotate-6 rounded bg-[#dc2626]/10 text-center">
                NEXUS EVENT REDLINE
                <div className="text-[10px] tracking-normal mt-0.5">CRITICAL MULTIVERSAL THREAT</div>
              </div>
            ) : (
              <div
                className={`border-4 ${
                  dossierTheme === "manila" ? "border-[#991b1b] text-[#991b1b]" : "border-[#ef4444] text-[#ef4444]"
                } font-black uppercase text-xl sm:text-2xl px-5 py-2 tracking-widest -rotate-12 rounded bg-red-900/10 text-center`}
              >
                TOP SECRET
                <div className="text-[10px] tracking-normal mt-0.5">FOR TIME-KEEPERS EYES ONLY</div>
              </div>
            )}
          </div>

          {/* Dossier Header */}
          <div className="border-b-2 pb-4 mb-5 border-current flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="text-xl sm:text-2xl font-black tracking-tight uppercase">
                TIME VARIANCE AUTHORITY
              </div>
              <div className="text-xs sm:text-sm font-semibold opacity-80 mt-0.5">
                SPECIAL OPERATIONS DIVISION // TEMPORAL DEVIANCE REPORT
              </div>
              <div className="text-[11px] opacity-70 mt-1">
                SECTOR: 17-G CITADEL // ARCHIVE RECORD: {caseId}
              </div>
            </div>

            <div className="text-right text-[11px] opacity-80">
              <div>STAMP DATE: 1973.10.14-09:22 UTC</div>
              <div>SECURITY STATUS: CLEARANCE ALPHA-6</div>
            </div>
          </div>

          {/* Primary Subject & Variance Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div
              className={`p-3.5 rounded-lg border ${
                dossierTheme === "manila"
                  ? "bg-[#e2d5c1] border-[#a9876f]"
                  : "bg-[#1d120a] border-[#e67e22]/60"
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                PRIMARY HISTORICAL NEXUS
              </span>
              <span className="text-base sm:text-lg font-bold block mt-0.5">
                &quot;{data.query}&quot;
              </span>
              <span className="text-xs opacity-80 mt-1 block">
                {activeBranch
                  ? `ANOMALOUS BRANCH 0${activeBranch.branchNumber}: ${activeBranch.title}`
                  : `CANONICAL SACRED TIMELINE BASELINE`}
              </span>
            </div>

            <div
              className={`p-3.5 rounded-lg border ${
                dossierTheme === "manila"
                  ? "bg-[#e2d5c1] border-[#a9876f]"
                  : "bg-[#1d120a] border-[#e67e22]/60"
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                TEMPORAL VARIANCE TELEMETRY
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-bold">
                  {activeBranch ? `${activeBranch.varianceScore.toFixed(1)}% VARIANCE` : "0.0% (SACRED TIMELINE)"}
                </span>
                <span className="text-xs opacity-75">
                  {activeBranch ? activeBranch.divergenceThreshold : "STABLE"}
                </span>
              </div>
              {/* Variance Meter Bar */}
              {activeBranch && (
                <div className="w-full h-3 bg-black/20 rounded mt-2 overflow-hidden border border-current">
                  <div
                    className={`h-full ${
                      activeBranch.varianceScore > 90
                        ? "bg-[#dc2626]"
                        : dossierTheme === "manila"
                        ? "bg-[#b45309]"
                        : "bg-[#f59e0b]"
                    }`}
                    style={{ width: `${activeBranch.varianceScore}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Point of Divergence Section */}
          <div
            className={`p-4 rounded-lg border mb-6 ${
              dossierTheme === "manila"
                ? "bg-[#dfd0bb] border-[#9c755a]"
                : "bg-[#21140b] border-[#e67e22]"
            }`}
          >
            <div className="text-xs font-black uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>POINT OF DIVERGENCE (CATALYTIC INCIDENT):</span>
              <span className="text-[10px] font-mono opacity-80">
                {activeBranch?.pointOfDivergence.dateStr || "CANONICAL TIME"}
              </span>
            </div>
            <div className="space-y-2 text-xs leading-relaxed">
              <div>
                <strong className="opacity-90">DEVIATION FROM RECORD:</strong>{" "}
                <span>
                  {activeBranch
                    ? activeBranch.pointOfDivergence.changedCondition
                    : "No temporal deviation detected. Baseline chronology proceeding as ordained."}
                </span>
              </div>
              <div>
                <strong className="opacity-90">SACRED TIMELINE CANON:</strong>{" "}
                <span>
                  {activeBranch
                    ? activeBranch.pointOfDivergence.historicalFact
                    : data.baseline.summary}
                </span>
              </div>
            </div>
          </div>

          {/* Chronological Ripple Cascade */}
          <div className="mb-6">
            <div className="text-xs font-black uppercase tracking-wider mb-3">
              TEMPORAL INCIDENT LOG (OBSERVED ANOMALOUS CASCADE):
            </div>
            <div className="space-y-2.5">
              {(activeBranch ? activeBranch.events : data.baseline.events).map((ev, idx) => (
                <div
                  key={ev.id || idx}
                  className={`p-3 rounded border text-xs ${
                    dossierTheme === "manila"
                      ? "bg-[#e5d9c7] border-[#b09279]"
                      : "bg-[#18100a] border-[#e67e22]/50"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-1 font-bold mb-1">
                    <span className="text-[11px] opacity-90">
                      INCIDENT #{idx + 1} // {ev.date} [{ev.time || "00:00"}]
                    </span>
                    <span className="text-[10px] opacity-75 uppercase">{ev.location}</span>
                  </div>
                  <div className="font-bold mb-0.5">{ev.title}</div>
                  <div className="opacity-85 text-[11px] leading-relaxed">{ev.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Field Assessment & Sign-off */}
          <div
            className={`p-3.5 rounded border mb-4 text-xs ${
              dossierTheme === "manila"
                ? "bg-[#dcd0bd] border-[#9c755a]"
                : "bg-[#19110b] border-[#e67e22]/40"
            }`}
          >
            <div className="font-bold uppercase text-[11px] mb-1.5">
              CASE DISPOSITION & MINUTE-MEN ACTION DIRECTIVE:
            </div>
            <p className="opacity-85 text-[11px] leading-relaxed mb-2">
              {activeBranch
                ? isPruned
                  ? "Minute-Men Team dispatched to temporal coordinates. TVA Reset Charge armed and successfully deployed. Branch matter ionization complete; alternate reality timeline collapsed."
                  : activeBranch.immediateConsequences + " " + activeBranch.longerTermConsequences
                : data.baseline.summary}
            </p>
            <div className="flex flex-wrap items-center justify-between text-[10px] opacity-75 pt-2 border-t border-current">
              <span>INVESTIGATING AGENT: MOBIUS M. MOBIUS</span>
              <span>DIRECTIVE: &quot;FOR ALL TIME. ALWAYS.&quot;</span>
            </div>
          </div>
        </div>

        {/* Hidden Canvas for High-Resolution PNG Rendering */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};
