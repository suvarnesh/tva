import { TimelineDetectionResult, TimelineBranch, TimelineEvent } from "@/types/timeline";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateTimelineDetectionResult(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    return { isValid: false, errors: ["Data must be a non-null object."] };
  }

  const result = data as Partial<TimelineDetectionResult>;

  if (!result.query || typeof result.query !== "string") {
    errors.push("Missing or invalid 'query' string.");
  }

  // Baseline validation
  if (!result.baseline || typeof result.baseline !== "object") {
    errors.push("Missing 'baseline' historical object.");
  } else {
    if (!result.baseline.title) errors.push("Baseline missing title.");
    if (!result.baseline.summary) errors.push("Baseline missing summary.");
    if (!Array.isArray(result.baseline.events) || result.baseline.events.length < 2) {
      errors.push("Baseline must contain at least 2 historical events.");
    } else {
      // Validate ordering
      let prevYear = -999999;
      for (let i = 0; i < result.baseline.events.length; i++) {
        const ev = result.baseline.events[i];
        if (!ev.id || !ev.title || !ev.description || !ev.year) {
          errors.push(`Baseline event [${i}] is missing required fields (id, title, description, year).`);
        }
        if (ev.year < prevYear) {
          errors.push(`Baseline event [${i}] (${ev.year}) is out of chronological order.`);
        }
        prevYear = ev.year;
      }
    }
  }

  // Alternatives validation: EXACTLY 4
  if (!Array.isArray(result.alternatives)) {
    errors.push("Missing 'alternatives' array.");
  } else if (result.alternatives.length !== 4) {
    errors.push(`Must contain exactly 4 alternative branches, received ${result.alternatives.length}.`);
  } else {
    const branchIds = new Set<string>();
    const allEventIds = new Set<string>();

    // Register baseline event IDs
    result.baseline?.events?.forEach((e) => allEventIds.add(e.id));

    result.alternatives.forEach((branch: TimelineBranch, idx: number) => {
      const bPrefix = `Branch [${idx + 1}] (${branch.title || "unnamed"})`;

      if (!branch.id) {
        errors.push(`${bPrefix} missing unique ID.`);
      } else if (branchIds.has(branch.id)) {
        errors.push(`${bPrefix} duplicate branch ID '${branch.id}'.`);
      } else {
        branchIds.add(branch.id);
      }

      if (!branch.title) errors.push(`${bPrefix} missing title.`);
      if (!branch.shortTag) errors.push(`${bPrefix} missing shortTag.`);

      // Point of divergence
      if (!branch.pointOfDivergence || typeof branch.pointOfDivergence !== "object") {
        errors.push(`${bPrefix} missing pointOfDivergence object.`);
      } else {
        const pod = branch.pointOfDivergence;
        if (!pod.year || !pod.title || !pod.changedCondition || !pod.historicalFact) {
          errors.push(`${bPrefix} pointOfDivergence missing required fields (year, title, changedCondition, historicalFact).`);
        }
      }

      // Explicit assumptions
      if (!Array.isArray(branch.explicitAssumptions) || branch.explicitAssumptions.length === 0) {
        errors.push(`${bPrefix} must have at least one explicit assumption.`);
      }

      // Exactly four chronological hypothetical events
      if (!Array.isArray(branch.events) || branch.events.length !== 4) {
        errors.push(`${bPrefix} must contain exactly 4 hypothetical chronological events.`);
      } else {
        let prevYear = branch.pointOfDivergence?.year || -999999;
        branch.events.forEach((ev: TimelineEvent, eIdx: number) => {
          if (!ev.id || !ev.title || !ev.description || !ev.year) {
            errors.push(`${bPrefix} event [${eIdx + 1}] missing required fields.`);
          }
          if (allEventIds.has(ev.id)) {
            errors.push(`${bPrefix} event [${eIdx + 1}] has duplicate ID '${ev.id}'.`);
          } else {
            allEventIds.add(ev.id);
          }
          if (ev.year < prevYear) {
            errors.push(`${bPrefix} event [${eIdx + 1}] year (${ev.year}) precedes divergence or previous event (${prevYear}).`);
          }
          prevYear = ev.year;
        });
      }

      // Causal chain
      if (!branch.causalChain || !branch.causalChain.summary) {
        errors.push(`${bPrefix} missing causalChain.`);
      }

      // Consequences and comparisons
      if (!branch.immediateConsequences) errors.push(`${bPrefix} missing immediateConsequences.`);
      if (!branch.longerTermConsequences) errors.push(`${bPrefix} missing longerTermConsequences.`);
      if (!branch.comparisonWithActualHistory) errors.push(`${bPrefix} missing comparisonWithActualHistory.`);
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
