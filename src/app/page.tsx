"use client";

import React, { useState, useEffect } from "react";
import { TimelineDetectionResult } from "@/types/timeline";
import { TvaPromptScreen } from "@/components/TvaPromptScreen";
import { TvaMonitorScreen } from "@/components/TvaMonitorScreen";
import { tvaAudio } from "@/lib/tvaAudio";

const STORAGE_KEY = "tva_atds_last_exploration";

export default function Home() {
  // Screen state: "prompt" (Screen 1) or "monitor" (Screen 2)
  const [screen, setScreen] = useState<"prompt" | "monitor">("prompt");
  
  // Unlock audio on first user interaction anywhere
  useEffect(() => {
    let unlocked = false;
    const handleFirstInteraction = () => {
      if (!unlocked) {
        unlocked = true;
        tvaAudio.unlock();
        tvaAudio.playCrtBoot();
      }
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };

    window.addEventListener("click", handleFirstInteraction, { once: true });
    window.addEventListener("keydown", handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("keydown", handleFirstInteraction);
    };
  }, []);
  
  // Timeline Data (Live AI Generated)
  const [data, setData] = useState<TimelineDetectionResult | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.baseline && parsed?.alternatives?.length === 4) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn("Could not load from localStorage:", e);
      }
    }
    return null;
  });

  // Request State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Handle Event Detection (Moves from Screen 1 to Screen 2)
  const handleDetectTimeline = async (query: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/detect-timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const resJson = await response.json();

      if (resJson.success && resJson.data) {
        setData(resJson.data);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(resJson.data));
        } catch {
          // ignore localStorage error
        }
        setScreen("monitor");
      } else if (resJson.isAmbiguous && resJson.ambiguitySuggestions?.length) {
        setErrorMessage(
          `AMBIGUITY DETECTED: '${query}' matches multiple events. Try: ${resJson.ambiguitySuggestions.slice(0, 2).join(" or ")}`
        );
      } else {
        setErrorMessage(
          resJson.error || `TEMPORAL SCAN FAILED for "${query}". Try 'MOON LANDING'.`
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setErrorMessage(`COMMUNICATION ERROR: ${msg}.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070504] flex flex-col items-center justify-center p-2 sm:p-4 md:p-6 transition-all">
      {screen === "monitor" && data ? (
        // SCREEN 2: TVA Monitor (Main line draws, branches generate)
        <TvaMonitorScreen
          data={data}
          onResetToPrompt={() => setScreen("prompt")}
        />
      ) : (
        // SCREEN 1: First screen asks "ENTER HISTORICAL EVENT"
        <TvaPromptScreen
          onSearch={handleDetectTimeline}
          isLoading={isLoading}
          errorMessage={errorMessage}
        />
      )}
    </main>
  );
}
