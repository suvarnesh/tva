export interface TimelineEvent {
  id: string;
  eventNumber: string; // TVA format like "46465109-703"
  year: number;
  date: string; // e.g. "07.20.1969"
  time: string; // e.g. "20:17:40"
  location: string;
  title: string;
  description: string;
  causalLink?: string;
  isDivergencePoint?: boolean;
  isBaseline?: boolean;
  branchId?: string;
}

export interface PointOfDivergence {
  year: number;
  dateStr: string;
  title: string;
  changedCondition: string;
  historicalFact: string;
}

export interface CausalChain {
  summary: string;
  steps: string[];
}

export type BranchPosition =
  | "top-outer" // Alt 01 (above 1)
  | "top-inner" // Alt 02 (above 2)
  | "bottom-inner" // Alt 03 (below 1)
  | "bottom-outer"; // Alt 04 (below 2)

export interface TimelineBranch {
  id: string; // "branch-01", "branch-02", etc.
  branchNumber: 1 | 2 | 3 | 4;
  position: BranchPosition;
  title: string;
  shortTag: string;
  divergenceThreshold: string; // e.g. "DELTA-7.42"
  varianceScore: number; // e.g. 88.5
  pointOfDivergence: PointOfDivergence;
  explicitAssumptions: string[];
  events: [TimelineEvent, TimelineEvent, TimelineEvent, TimelineEvent]; // Exactly 4 chronological events
  causalChain: CausalChain;
  immediateConsequences: string;
  longerTermConsequences: string;
  uncertaintyAnalysis: string;
  comparisonWithActualHistory: string;
}

export interface VerifiedSource {
  title: string;
  authorOrPublisher: string;
  citation: string;
  url?: string;
}

export interface HistoricalBaseline {
  id: string;
  title: string;
  dateRange: string;
  summary: string;
  verifiedSources: VerifiedSource[];
  events: TimelineEvent[];
}

export interface CompressedGap {
  startYear: number;
  endYear: number;
  label: string;
}

export interface TimelineDetectionResult {
  query: string;
  detectionTimestamp: string;
  isDemoMode?: boolean;
  isAiGenerated: boolean;
  sourceVerificationStatus: "VERIFIED_PRIMARY_SOURCE" | "ESTIMATED_BASELINE_ONLY" | "UNVERIFIED_ARBITRARY";
  baseline: HistoricalBaseline;
  alternatives: [TimelineBranch, TimelineBranch, TimelineBranch, TimelineBranch]; // Exactly 4
  timeSpan: {
    startYear: number;
    endYear: number;
    compressedGaps: CompressedGap[];
  };
}

export interface TimelineDetectionState {
  currentResult: TimelineDetectionResult | null;
  selectedBranchId: string | null; // null means ACTUAL HISTORY (baseline) selected
  selectedEventId: string | null;
  isPlaying: boolean;
  playbackProgress: number; // 0.0 to 1.0 (corresponds to time across timeline)
  playbackSpeed: number; // 1x, 2x, etc.
  loadingStatus: string | null;
  error: string | null;
  ambiguityPrompt: {
    originalQuery: string;
    suggestedOptions: string[];
  } | null;
}
