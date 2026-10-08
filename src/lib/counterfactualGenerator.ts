import {
  TimelineDetectionResult,
  TimelineBranch,
  BranchPosition,
  TimelineEvent,
} from "@/types/timeline";
import { validateTimelineDetectionResult } from "./validation";

// Ambiguity dictionary to request user clarification rather than inventing a baseline
const AMBIGUOUS_TERMS: Record<string, string[]> = {
  WAR: [
    "World War I (1914–1918)",
    "World War II (1939–1945)",
    "American Civil War (1861–1865)",
    "Vietnam War (1955–1975)",
  ],
  REVOLUTION: [
    "French Revolution (1789)",
    "American Revolution (1776)",
    "Russian Revolution (1917)",
    "Industrial Revolution (1760)",
  ],
  ASSASSINATION: [
    "Assassination of Archduke Franz Ferdinand (1914)",
    "Assassination of Abraham Lincoln (1865)",
    "Assassination of Julius Caesar (44 BCE)",
    "Assassination of John F. Kennedy (1963)",
  ],
  INVASION: [
    "Normandy Landings / D-Day (1944)",
    "Invasion of Poland (1939)",
    "Bay of Pigs Invasion (1961)",
    "Roman Invasion of Britain (43 CE)",
  ],
  CRISIS: [
    "Cuban Missile Crisis (1962)",
    "Suez Crisis (1956)",
    "1929 Wall Street Crash",
    "2008 Financial Crisis",
  ],
};

export interface DetectionResponse {
  success: boolean;
  data?: TimelineDetectionResult;
  isAmbiguous?: boolean;
  ambiguitySuggestions?: string[];
  message?: string;
  error?: string;
}

export async function detectTimeline(query: string): Promise<DetectionResponse> {
  const cleanQuery = query.trim().toUpperCase();

  if (!cleanQuery) {
    return {
      success: false,
      error: "TEMPORAL COORDINATE ERROR: Historical event parameter is blank.",
    };
  }

  // 1. Check for ambiguous generic single-word terms
  if (AMBIGUOUS_TERMS[cleanQuery]) {
    return {
      success: false,
      isAmbiguous: true,
      ambiguitySuggestions: AMBIGUOUS_TERMS[cleanQuery],
      message: `TEMPORAL AMBIGUITY DETECTED: Query '${cleanQuery}' matches multiple major historical nexus points. Please clarify the specific event.`,
    };
  }

  // 2. Direct AI Generation with Google Gemini API
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (geminiKey) {
    try {
      const aiResult = await generateWithGemini(cleanQuery, geminiKey);
      if (aiResult) {
        const validation = validateTimelineDetectionResult(aiResult);
        if (validation.isValid) {
          return { success: true, data: aiResult };
        } else {
          console.warn("Gemini Generation failed validation:", validation.errors);
        }
      }
    } catch (err) {
      console.error("Gemini Generation error:", err);
    }
  }

  if (groqKey) {
    try {
      const aiResult = await generateWithGroq(cleanQuery, groqKey);
      if (aiResult) {
        const validation = validateTimelineDetectionResult(aiResult);
        if (validation.isValid) {
          return { success: true, data: aiResult };
        } else {
          console.warn("Groq Generation failed validation:", validation.errors);
        }
      }
    } catch (err) {
      console.error("Groq Generation error:", err);
    }
  }

  if (openRouterKey) {
    try {
      const aiResult = await generateWithOpenRouter(cleanQuery, openRouterKey);
      if (aiResult) {
        const validation = validateTimelineDetectionResult(aiResult);
        if (validation.isValid) {
          return { success: true, data: aiResult };
        } else {
          console.warn("OpenRouter Generation failed validation:", validation.errors);
        }
      }
    } catch (err) {
      console.error("OpenRouter Generation error:", err);
    }
  }

  // 4. Intelligent Deterministic Historical Counterfactual Generator
  // Generates high quality counterfactual structure for arbitrary events
  const syntheticResult = generateDeterministicHistoricalResult(cleanQuery);
  const validation = validateTimelineDetectionResult(syntheticResult);
  if (validation.isValid) {
    return { success: true, data: syntheticResult };
  }

  return {
    success: false,
    error: `UNABLE TO ISOLATE TEMPORAL BASELINE for '${cleanQuery}'. Ensure the event is a recognizable historical occurrence.`,
  };
}

function getAiPrompt(query: string): string {
  return `You are the TVA Alternative Timeline Detection System.
Given the historical event "${query}", generate a bold, highly imaginative, dramatic counterfactual exploration JSON object. The user specifically loves bold "WHAT IF" divergent realities, fantasy twists, and epic alternate history scenarios!

THE 4 ALTERNATIVE BRANCH THEMES (MANDATORY):
Each of the 4 branches MUST represent a distinct, bold, high-concept alternate reality:
- Branch 1 (position: "top-outer"): "TOTAL AVERSION / THE EVENT NEVER OCCURRED"
  The incident/disaster NEVER happened at all! (e.g. For "tsunami 2004": The tectonic fault never ruptured; peaceful flourishing coastlines, thriving maritime economy, zero casualties, but underground tectonic pressure secretly builds for millennia).
- Branch 2 (position: "top-inner"): "THE HYPER-CATACLYSM / DESTRUCTION ABOVE ALL"
  The event was an apocalyptic super-catastrophe far worse than actual history! (e.g. A 100-meter megatsunami that submerged entire coastal subcontinents, cracked oceanic plates, shifted the Earth's rotational axis, and displaced global climates).
- Branch 3 (position: "bottom-inner"): "FANTASY / MYTHIC / BIZARRE ANOMALY DISCOVERY"
  The event uncovered or unleashed something fantastical, mythical, or alien! (e.g. As the ocean receded miles, the sunken monolithic ruins of an ancient pre-human civilization/Atlantis were revealed, or an ancient slumbering anomaly awakened).
- Branch 4 (position: "bottom-outer"): "RADICAL SCI-FI / UTOPIAN/DYSTOPIAN CIVILIZATION SHIFT"
  The event forced humanity into a radical new era or civilization shift! (e.g. Nations abandoned the dangerous mainland coasts and built floating high-tech oceanic city-states, or formed a unified global geo-engineering defense network).

CRITICAL INSTRUCTION - KEEP TEXT SHORT AND CRISP:
All incident descriptions must be SHORT and concise (1-2 sentences maximum).
- In actual history: provide the real primary incident date (MM.DD.YYYY) and a short description, plus 4 chronological baseline events with exact dates and short descriptions.
- In branch history: provide the divergence date (MM.DD.YYYY) and a short description of the changed condition, plus exactly 4 chronological hypothetical events each with exact date and short description.

Rules:
1. Treat all counterfactuals as dramatic alternate fiction.
2. "baseline": actual historical facts with 4-5 chronological events, summary (1-2 sentences), and citations of real historical sources.
3. "alternatives": EXACTLY FOUR fictional alternative branches matching the 4 themes above.
   - Positions must be: "top-outer", "top-inner", "bottom-inner", "bottom-outer".
   - Each branch must have a specific "pointOfDivergence" (year, dateStr, title, changedCondition, historicalFact).
   - Each branch must have "explicitAssumptions" (array of 2 short strings).
   - Each branch must have EXACTLY 4 chronological hypothetical events (id, eventNumber like "47012340-901", year, date, time, location, title, description, causalLink).
   - Each branch must have "causalChain" (summary and steps array).
   - Each branch must have "immediateConsequences", "longerTermConsequences", "uncertaintyAnalysis", and "comparisonWithActualHistory" (each 1-2 short sentences).
4. Output strictly valid JSON without markdown fences conforming to this schema:
{
  "query": "${query}",
  "detectionTimestamp": "${new Date().toISOString()}",
  "isDemoMode": false,
  "isAiGenerated": true,
  "sourceVerificationStatus": "ESTIMATED_BASELINE_ONLY",
  "timeSpan": { "startYear": 1900, "endYear": 2000, "compressedGaps": [] },
  "baseline": {
    "id": "baseline-id",
    "title": "Title (ACTUAL HISTORY)",
    "dateRange": "Years",
    "summary": "Short 1-2 sentence description of the actual historical incident.",
    "verifiedSources": [{ "title": "Source", "authorOrPublisher": "Pub", "citation": "Cite" }],
    "events": [
      {
        "id": "base-1",
        "eventNumber": "46101111-001",
        "year": 1961,
        "date": "05.25.1961",
        "time": "12:00:00",
        "location": "Location",
        "title": "Short Title",
        "description": "Short 1-sentence description.",
        "isBaseline": true
      }
    ]
  },
  "alternatives": [
    {
      "id": "branch-01",
      "branchNumber": 1,
      "position": "top-outer",
      "title": "Short Branch Title",
      "shortTag": "TAG",
      "divergenceThreshold": "POD-1960.01.01",
      "varianceScore": 85.0,
      "pointOfDivergence": {
        "year": 1960,
        "dateStr": "01.01.1960",
        "title": "Divergence Title",
        "changedCondition": "Short 1-sentence changed condition.",
        "historicalFact": "Short 1-sentence actual historical fact."
      },
      "explicitAssumptions": ["Assumption 1", "Assumption 2"],
      "events": [
        {
          "id": "b1-ev-1",
          "eventNumber": "48102341-901",
          "year": 1961,
          "date": "03.12.1961",
          "time": "08:30:00",
          "location": "Location",
          "title": "Incident Title",
          "description": "Short 1-sentence description of the incident.",
          "causalLink": "Short causal link."
        }
      ],
      "causalChain": { "summary": "Short chain summary", "steps": ["Step 1", "Step 2"] },
      "immediateConsequences": "Short 1-sentence consequence.",
      "longerTermConsequences": "Short 1-sentence consequence.",
      "uncertaintyAnalysis": "Short uncertainty note.",
      "comparisonWithActualHistory": "Short 1-sentence comparison."
    }
  ]
}`;
}

const GEMINI_MODELS = [
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-1.5-flash",
];

function cleanJsonText(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/\s*```$/, "");
  }
  return cleaned.trim();
}

function normalizeAiTimelineResult(
  raw: Record<string, unknown>,
  query: string
): TimelineDetectionResult {
  const positions: BranchPosition[] = [
    "top-outer",
    "top-inner",
    "bottom-inner",
    "bottom-outer",
  ];

  const nowIso = new Date().toISOString();
  const detectionTimestamp =
    typeof raw?.detectionTimestamp === "string" ? raw.detectionTimestamp : nowIso;

  // 1. Normalize baseline
  const rawBaseline = (raw?.baseline || {}) as Record<string, unknown>;
  const baseTitle = typeof rawBaseline.title === "string" ? rawBaseline.title : `${query} (ACTUAL HISTORY)`;
  const baseSummary =
    typeof rawBaseline.summary === "string"
      ? rawBaseline.summary
      : `In actual history, ${query} occurred as established in official historical records.`;
  const baseDateRange = typeof rawBaseline.dateRange === "string" ? rawBaseline.dateRange : "HISTORICAL ERA";

  const rawBaseEvents = Array.isArray(rawBaseline.events)
    ? (rawBaseline.events as Record<string, unknown>[])
    : [];

  let currentBaseYear = 1945;
  const normalizedBaseEvents = (rawBaseEvents.length >= 2 ? rawBaseEvents : [
    {
      id: "base-ev-1",
      eventNumber: "48001011-001",
      year: 1961,
      date: "05.25.1961",
      time: "12:00:00",
      location: "Historical Epicenter",
      title: `Escalation of ${query}`,
      description: `Conditions reached critical threshold leading to the primary incident of ${query}.`,
      isBaseline: true,
    },
    {
      id: "base-ev-2",
      eventNumber: "48001012-002",
      year: 1969,
      date: "07.20.1969",
      time: "20:17:40",
      location: "Primary Theater",
      title: `Apex of ${query}`,
      description: `The central defining event occurred according to verified historical record.`,
      isBaseline: true,
    },
  ]).map((ev: Record<string, unknown>, idx: number) => {
    let year = typeof ev.year === "number" ? ev.year : parseInt(String(ev.year || ""), 10);
    if (isNaN(year) || year === 0) {
      const match = String(ev.date || "").match(/\b(1[0-9]{3}|20[0-2][0-9])\b/);
      year = match ? parseInt(match[1], 10) : currentBaseYear + idx;
    }
    currentBaseYear = year;
    return {
      id: `base-ev-${idx + 1}`,
      eventNumber: typeof ev.eventNumber === "string" ? ev.eventNumber : `4800101${idx + 1}-00${idx + 1}`,
      year,
      date: typeof ev.date === "string" ? ev.date : `01.01.${year}`,
      time: typeof ev.time === "string" ? ev.time : "12:00:00",
      location: typeof ev.location === "string" ? ev.location : "Historical Location",
      title: typeof ev.title === "string" ? ev.title : `Milestone ${idx + 1}`,
      description: typeof ev.description === "string" ? ev.description : `Verified historical occurrence during ${query}.`,
      isBaseline: true,
    };
  });

  normalizedBaseEvents.sort((a, b) => a.year - b.year);

  // 2. Normalize 4 alternatives
  const rawAlternatives = Array.isArray(raw?.alternatives) ? (raw.alternatives as Record<string, unknown>[]) : [];
  const normalizedAlternatives = positions.map((pos, bIdx) => {
    const rawBranch = (rawAlternatives[bIdx] || {}) as Record<string, unknown>;
    const branchId = `branch-0${bIdx + 1}`;
    const branchNumber = (bIdx + 1) as 1 | 2 | 3 | 4;
    const title = typeof rawBranch.title === "string" ? rawBranch.title : `Alternative Timeline 0${branchNumber}: Divergence at ${query}`;
    const shortTag = typeof rawBranch.shortTag === "string" ? rawBranch.shortTag : `BRANCH 0${branchNumber}`;

    // POD normalization
    const rawPod = (rawBranch.pointOfDivergence || {}) as Record<string, unknown>;
    let podYear = typeof rawPod.year === "number" ? rawPod.year : parseInt(String(rawPod.year || ""), 10);
    if (isNaN(podYear) || podYear === 0) {
      const match = String(rawPod.dateStr || rawPod.date || "").match(/\b(1[0-9]{3}|20[0-2][0-9])\b/);
      podYear = match ? parseInt(match[1], 10) : normalizedBaseEvents[0]?.year || 1965;
    }

    const podDateStr = typeof rawPod.dateStr === "string" ? rawPod.dateStr : typeof rawPod.date === "string" ? rawPod.date : `01.01.${podYear}`;
    const podTitle = typeof rawPod.title === "string" ? rawPod.title : `Point of Divergence (${podYear})`;
    const podChanged =
      typeof rawPod.changedCondition === "string"
        ? rawPod.changedCondition
        : typeof rawPod.condition === "string"
        ? rawPod.condition
        : typeof rawPod.description === "string"
        ? rawPod.description
        : `Historical circumstances diverged from baseline reality.`;
    const podFact =
      typeof rawPod.historicalFact === "string"
        ? rawPod.historicalFact
        : typeof rawPod.baselineFact === "string"
        ? rawPod.baselineFact
        : `In actual history, the baseline recorded events occurred as established.`;

    // 4 Events normalization
    const rawEvents = Array.isArray(rawBranch.events) ? (rawBranch.events as Record<string, unknown>[]) : [];
    let currentEventYear = podYear;
    const branchEvents = [0, 1, 2, 3].map((eIdx) => {
      const ev = (rawEvents[eIdx] || {}) as Record<string, unknown>;
      let evYear = typeof ev.year === "number" ? ev.year : parseInt(String(ev.year || ""), 10);
      if (isNaN(evYear) || evYear === 0) {
        const match = String(ev.date || "").match(/\b(1[0-9]{3}|20[0-2][0-9])\b/);
        evYear = match ? parseInt(match[1], 10) : currentEventYear + (eIdx === 0 ? 0 : 1);
      }
      if (evYear < currentEventYear) evYear = currentEventYear;
      currentEventYear = evYear;

      return {
        id: `${branchId}-ev-${eIdx + 1}`,
        eventNumber: ev.eventNumber || `48${branchNumber}0101${eIdx + 1}-90${eIdx + 1}`,
        year: evYear,
        date: ev.date || `06.15.${evYear}`,
        time: ev.time || "12:00:00",
        location: ev.location || "Regional Sector",
        title: ev.title || `Hypothetical Development 0${eIdx + 1}`,
        description: ev.description || `Chronological downstream effect of the divergence.`,
        causalLink: ev.causalLink || `Direct causal sequence following ${podTitle}.`,
      };
    });

    branchEvents.sort((a, b) => a.year - b.year);

    const rawChain = (rawBranch.causalChain || {}) as Record<string, unknown>;

    const branchObj: TimelineBranch = {
      id: branchId,
      branchNumber,
      position: pos,
      title,
      shortTag,
      divergenceThreshold: String(rawBranch.divergenceThreshold || `POD-${podYear}.01.01 // B0${branchNumber}`),
      varianceScore: typeof rawBranch.varianceScore === "number" ? rawBranch.varianceScore : 75.0 + bIdx * 5,
      pointOfDivergence: {
        year: podYear,
        dateStr: podDateStr,
        title: podTitle,
        changedCondition: podChanged,
        historicalFact: podFact,
      },
      explicitAssumptions: Array.isArray(rawBranch.explicitAssumptions) && rawBranch.explicitAssumptions.length > 0
        ? rawBranch.explicitAssumptions.map(String)
        : ["Assumption of distinct leadership decision", "Structural alteration of immediate resources"],
      events: branchEvents as [TimelineEvent, TimelineEvent, TimelineEvent, TimelineEvent],
      causalChain: {
        summary: String(rawChain.summary || `Initial divergence leads to cascade of regional shifts.`),
        steps: Array.isArray(rawChain.steps)
          ? (rawChain.steps as string[])
          : ["Point of divergence", "Immediate structural shift", "Downstream geopolitical pivot"],
      },
      immediateConsequences: String(rawBranch.immediateConsequences || "Acute divergence in near-term outcome."),
      longerTermConsequences: String(rawBranch.longerTermConsequences || "Sustained systemic realignments over subsequent decades."),
      uncertaintyAnalysis: String(rawBranch.uncertaintyAnalysis || "Moderate variance sensitivity to institutional inertia."),
      comparisonWithActualHistory: String(rawBranch.comparisonWithActualHistory || "Differs fundamentally from the verified baseline."),
    };

    return branchObj;
  });

  return {
    query,
    detectionTimestamp,
    isDemoMode: false,
    isAiGenerated: true,
    sourceVerificationStatus: "ESTIMATED_BASELINE_ONLY",
    timeSpan: {
      startYear: normalizedBaseEvents[0]?.year || 1960,
      endYear: (normalizedBaseEvents[normalizedBaseEvents.length - 1]?.year || 1980) + 10,
      compressedGaps: [],
    },
    baseline: {
      id: `baseline-${query.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      title: baseTitle,
      dateRange: baseDateRange,
      summary: baseSummary,
      verifiedSources: Array.isArray(rawBaseline.verifiedSources)
        ? (rawBaseline.verifiedSources as { title: string; authorOrPublisher: string; citation: string; url?: string }[])
        : [{ title: "Historical Encyclopedia", authorOrPublisher: "Archival Reference", citation: `${query} Compendium.` }],
      events: normalizedBaseEvents,
    },
    alternatives: [
      normalizedAlternatives[0],
      normalizedAlternatives[1],
      normalizedAlternatives[2],
      normalizedAlternatives[3],
    ],
  };
}

async function generateWithGemini(
  query: string,
  apiKey: string
): Promise<TimelineDetectionResult | null> {
  const prompt = getAiPrompt(query);
  let lastError: Error | null = null;

  for (const model of GEMINI_MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.75,
            },
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`Gemini model ${model} responded with ${response.status}:`, errText);
        continue;
      }

      const json = await response.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const cleaned = cleanJsonText(rawText);
      const parsed = JSON.parse(cleaned);
      const normalized = normalizeAiTimelineResult(parsed, query);
      return normalized;
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`Gemini model ${model} execution error:`, lastError.message);
    }
  }

  if (lastError) {
    throw lastError;
  }
  return null;
}

async function generateWithGroq(
  query: string,
  apiKey: string
): Promise<TimelineDetectionResult | null> {
  const prompt = getAiPrompt(query);
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are the TVA Alternative Timeline Detection System. Return pure JSON only.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.statusText}`);
  }

  const json = await response.json();
  const text = json.choices?.[0]?.message?.content;
  if (!text) return null;

  return JSON.parse(text) as TimelineDetectionResult;
}

async function generateWithOpenRouter(
  query: string,
  apiKey: string
): Promise<TimelineDetectionResult | null> {
  const prompt = getAiPrompt(query);
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.0-flash-exp:free",
      messages: [
        {
          role: "system",
          content: "You are the TVA Alternative Timeline Detection System. Return pure JSON only.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`);
  }

  const json = await response.json();
  const text = json.choices?.[0]?.message?.content;
  if (!text) return null;

  return JSON.parse(text) as TimelineDetectionResult;
}

function generateDeterministicHistoricalResult(
  query: string
): TimelineDetectionResult {
  // Infer rough era or year from common keywords, or anchor around a sensible historical bracket
  let anchorYear = 1945;
  let eventName = query;
  const isTsunami = query.includes("TSUNAMI");

  if (isTsunami) {
    anchorYear = 2004;
    eventName = "2004 INDIAN OCEAN TSUNAMI";
  } else if (query.includes("TITANIC")) {
    anchorYear = 1912;
    eventName = "SINKING OF THE RMS TITANIC";
  } else if (query.includes("ROME") || query.includes("ROMAN")) {
    anchorYear = 476;
    eventName = "FALL OF THE WESTERN ROMAN EMPIRE";
  } else if (query.includes("PRINTING") || query.includes("GUTENBERG")) {
    anchorYear = 1450;
    eventName = "INVENTION OF THE MOVABLE TYPE PRINTING PRESS";
  } else if (query.includes("D-DAY") || query.includes("NORMANDY")) {
    anchorYear = 1944;
    eventName = "NORMANDY LANDINGS (OPERATION OVERLORD)";
  } else if (query.includes("HIROSHIMA") || query.includes("ATOMIC BOMB")) {
    anchorYear = 1945;
    eventName = "ATOMIC BOMBINGS OF HIROSHIMA AND NAGASAKI";
  } else if (query.includes("BERLIN WALL")) {
    anchorYear = 1989;
    eventName = "FALL OF THE BERLIN WALL";
  } else if (query.includes("WATERLOO")) {
    anchorYear = 1815;
    eventName = "BATTLE OF WATERLOO";
  } else {
    const match = query.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/);
    if (match) {
      anchorYear = parseInt(match[1], 10);
    }
  }

  const positions: BranchPosition[] = [
    "top-outer",
    "top-inner",
    "bottom-inner",
    "bottom-outer",
  ];

  const branches: TimelineBranch[] = isTsunami
    ? [
        {
          id: "branch-01",
          branchNumber: 1,
          position: positions[0],
          title: "The Silent Fault: The Tsunami That Never Struck",
          shortTag: "ZERO TSUNAMI",
          divergenceThreshold: "POD-2004.12.26 // SLIP-00",
          varianceScore: 92.4,
          pointOfDivergence: {
            year: 2004,
            dateStr: "12.26.2004",
            title: "Deep Mantle Aseismic Creep Neutralizes Rupture",
            changedCondition: "Tectonic tension along the Sunda megathrust was discharged through slow, imperceptible deep-mantle slip with zero oceanic displacement. The tsunami never formed.",
            historicalFact: "In actual history, a violent 9.1 Mw rupture displaced billions of tons of seawater, unleashing catastrophic tsunamis across 14 nations.",
          },
          explicitAssumptions: [
            "Frictionless boundary slip converted strain energy into subtle thermal dissipation.",
            "Complete absence of vertical seafloor displacement.",
          ],
          events: [
            {
              id: "b1-ev-1",
              eventNumber: "48102341-901",
              year: 2004,
              date: "12.26.2004",
              time: "07:58:53",
              location: "Northern Sumatra & Indian Ocean Basin",
              title: "Calm Waters & Unbroken Morning",
              description: "Coastlines across Phuket, Sri Lanka, and Aceh experience peaceful morning seas; holiday resorts and local fishing fleets operate undisturbed.",
              causalLink: "Aseismic fault creep generated zero shockwaves and zero water displacement.",
              isDivergencePoint: true,
            },
            {
              id: "b1-ev-2",
              eventNumber: "48102342-902",
              year: 2006,
              date: "03.15.2006",
              time: "11:30:00",
              location: "Andaman Coastal Corridor",
              title: "Southeast Asian Tourism Golden Age",
              description: "Undisrupted coastal infrastructure fuels an unprecedented economic explosion and world-renowned marine ecological reserves.",
              causalLink: "Preservation of capital and municipal resources enabled uninterrupted regional investment.",
            },
            {
              id: "b1-ev-3",
              eventNumber: "48102343-903",
              year: 2014,
              date: "08.10.2014",
              time: "14:00:00",
              location: "Indian Ocean Coastal Megacities",
              title: "Unchecked Shoreline Megalopolis Expansion",
              description: "Densely populated resort cities build right to the tide line without investing in expensive seawalls or deep-ocean warning networks.",
              causalLink: "Decades of tranquility fostered a false assumption of eternal oceanic safety.",
            },
            {
              id: "b1-ev-4",
              eventNumber: "48102344-904",
              year: 2024,
              date: "12.26.2024",
              time: "09:00:00",
              location: "International Geodynamics Observatory",
              title: "The Subterranean Pressure Paradox Revealed",
              description: "Geophysicists discover that suppressed seismic energy has compounded into an apocalyptic deep-crustal hazard for future centuries.",
              causalLink: "Postponed tectonic stress inevitably concentrates into delayed hyper-magnitude debt.",
            },
          ],
          causalChain: {
            summary: "Aseismic creep -> Zero tsunami waves -> Coastal economic golden age -> Unchecked shoreline expansion -> Compounding subterranean seismic debt.",
            steps: ["Silent mantle release", "Total coastal tranquility", "Commercial and tourist boom", "Delayed tectonic pressure paradox"],
          },
          immediateConsequences: "Over 227,000 lives spared; coastlines and local communities remain completely intact.",
          longerTermConsequences: "Rapid coastal urbanization builds right to the water's edge, leaving future generations exposed to massive delayed seismic debt.",
          uncertaintyAnalysis: "High uncertainty: suppressed tectonic strain must eventually discharge across adjacent fault boundaries.",
          comparisonWithActualHistory: "Actual history suffered the deadliest tsunami in modern memory; this reality is an idyllic paradise masking an accumulating tectonic secret.",
        },
        {
          id: "branch-02",
          branchNumber: 2,
          position: positions[1],
          title: "The Great Submersion: Megatsunami Above All",
          shortTag: "HYPER-CATACLYSM",
          divergenceThreshold: "POD-2004.12.26 // MEGA-01",
          varianceScore: 99.1,
          pointOfDivergence: {
            year: 2004,
            dateStr: "12.26.2004",
            title: "Total Subduction Trench Collapse & 100-Meter World Wall",
            changedCondition: "A catastrophic 9.7 Mw megathrust ruptured the entire 1,800-mile Indo-Australian trench, launching a 100-meter megatsunami that engulfed whole subcontinents.",
            historicalFact: "In reality, the rupture measured 9.1 Mw with localized run-up heights rarely exceeding 30 meters along northern Sumatra.",
          },
          explicitAssumptions: [
            "Simultaneous multi-segment trench rupture unleashed unprecedented hydro-kinetic energy.",
            "Submarine mega-landslides compounded the primary oceanic wave front.",
          ],
          events: [
            {
              id: "b2-ev-1",
              eventNumber: "48201211-911",
              year: 2004,
              date: "12.26.2004",
              time: "08:15:00",
              location: "Indian Ocean Continental Shelves",
              title: "The 100-Meter Megatsunami Surge",
              description: "Towering 100-meter oceanic walls sweep 25 kilometers inland across Indonesia, Thailand, India, and Sri Lanka, obliterating entire peninsulas.",
              causalLink: "Catastrophic seafloor crust displacement hurled trillions of cubic meters of seawater inland.",
              isDivergencePoint: true,
            },
            {
              id: "b2-ev-2",
              eventNumber: "48201212-912",
              year: 2005,
              date: "04.12.2005",
              time: "10:30:00",
              location: "Equatorial Sea Basin",
              title: "Permanent Archipelagic Submersion & Axis Shift",
              description: "The Maldives, Nicobars, and low-lying atolls sink permanently below the waves as the Earth's rotational axis shifts by 8 centimeters.",
              causalLink: "Permanent tectonic subsidence lowered regional seabed shelves below mean sea level.",
            },
            {
              id: "b2-ev-3",
              eventNumber: "48201213-913",
              year: 2009,
              date: "09.20.2009",
              time: "15:00:00",
              location: "United Nations General Assembly",
              title: "Planetary Coastal Exclusion Zone Declared",
              description: "Governments permanently abandon all maritime lowlands worldwide, outlawing permanent human settlement within 30 kilometers of the sea.",
              causalLink: "Super-tsunami recurrences proved that shoreline engineering was futile against planetary surges.",
            },
            {
              id: "b2-ev-4",
              eventNumber: "48201214-914",
              year: 2019,
              date: "11.05.2019",
              time: "16:20:00",
              location: "Deccan & Himalayan Highland Plateaus",
              title: "Rise of the Inland Mountain Citadels",
              description: "Hundreds of millions relocate to fortified interior highland megalopolises, permanently redefining human civilization away from the oceans.",
              causalLink: "Total geographical inundation forced humanity into high-altitude survival enclaves.",
            },
          ],
          causalChain: {
            summary: "9.7 Mw rupture -> 100-meter megatsunami -> Permanent island submersion -> Planetary coastal evacuation -> Inland mountain citadels.",
            steps: ["Full trench collapse", "100-meter mega-surge", "Permanent geographic erasure", "Inland highland migration"],
          },
          immediateConsequences: "Millions displaced; complete physical erasure of low-lying island nations and hundreds of coastal cities.",
          longerTermConsequences: "Humanity permanently retreats inland, forever abandoning ocean-side civilization.",
          uncertaintyAnalysis: "Planetary climate disruption from vast seawater evaporation and regional tectonic instability.",
          comparisonWithActualHistory: "Actual history caused tragic but localized coastal devastation; this reality resulted in planetary geographical reshuffling.",
        },
        {
          id: "branch-03",
          branchNumber: 3,
          position: positions[2],
          title: "The Receding Abyss: Discovery of Sunken Kumari Kandam",
          shortTag: "MYTHIC DISCOVERY",
          divergenceThreshold: "POD-2004.12.26 // ANOM-03",
          varianceScore: 88.7,
          pointOfDivergence: {
            year: 2004,
            dateStr: "12.26.2004",
            title: "Receding Waters Lay Bare Cyclopean Megalithic Spire Ruins",
            changedCondition: "As coastal waters receded 4 miles prior to landfall, they revealed colossal sunken temples, monolithic spires, and metallic glyphs of a forgotten ancient civilization.",
            historicalFact: "In reality, retreating waters exposed seafloor mud, coral, and boat wrecks, but no lost civilizations were uncovered.",
          },
          explicitAssumptions: [
            "A prehistoric advanced civilization was submerged during the last glacial maximum.",
            "Tectonic uplift exposed ancient megalithic complexes before seawater rushed back.",
          ],
          events: [
            {
              id: "b3-ev-1",
              eventNumber: "48304511-921",
              year: 2004,
              date: "12.26.2004",
              time: "08:45:00",
              location: "Mahabalipuram & Palk Strait Seabed",
              title: "Emergence of the Sunken Cyclopean Temples",
              description: "Before waves strike, witnesses and reconnaissance satellites capture footage of pristine granite spires and towering subterranean archways rising from the ocean bed.",
              causalLink: "Unprecedented ocean pullback exposed structures submerged for 12,000 years.",
              isDivergencePoint: true,
            },
            {
              id: "b3-ev-2",
              eventNumber: "48304512-922",
              year: 2005,
              date: "06.18.2005",
              time: "13:00:00",
              location: "Bay of Bengal Submersible Trench",
              title: "The Deep-Sea Archaeological Scramble",
              description: "International deep-submersible expeditions discover intact subterranean libraries carved with undeciphered proto-Dravidian scripts.",
              causalLink: "World scientific astonishment halted geopolitical rivalries to investigate the site.",
            },
            {
              id: "b3-ev-3",
              eventNumber: "48304513-923",
              year: 2012,
              date: "02.24.2012",
              time: "10:15:00",
              location: "Global Epigraphy Congress",
              title: "Decipherment of the Oceanic Codices",
              description: "Linguists translate ancient sunken tablets, confirming advanced maritime and celestial science existed ten millennia before Mesopotamia.",
              causalLink: "Decipherment confirmed that human technological civilization is vastly older than recorded history.",
            },
            {
              id: "b3-ev-4",
              eventNumber: "48304514-924",
              year: 2022,
              date: "09.30.2022",
              time: "17:45:00",
              location: "Sunken Temple Hydro-Research Complex",
              title: "The Ancient Hydro-Resonance Energy Epoch",
              description: "Scientists reverse-engineer ancient geomagnetic harmonic generators found inside the ruins, unlocking clean, limitless power.",
              causalLink: "Ancient submerged technologies propelled modern energy science ahead by over a century.",
            },
          ],
          causalChain: {
            summary: "Ocean pullback -> Sunken monolithic ruins exposed -> Global archaeological race -> Pre-ice-age codices deciphered -> Ancient clean-energy revolution.",
            steps: ["Sunken ruins revealed", "International archaeological mobilization", "Ancient texts translated", "Technological renaissance sparked"],
          },
          immediateConsequences: "Immediate shock across world academies and religions as ancient history is proven radically incomplete.",
          longerTermConsequences: "Humanity adopts ancient geological warning systems and zero-emission energy extracted from ancient ocean-floor technology.",
          uncertaintyAnalysis: "High ideological and geopolitical tension over custody of the discovered pre-historical artifacts.",
          comparisonWithActualHistory: "Actual history saw only devastation; this branch turned catastrophe into the greatest archaeological revelation in human history.",
        },
        {
          id: "branch-04",
          branchNumber: 4,
          position: positions[3],
          title: "The Oceanic Ascendance: Rise of the Pelagic Commonwealth",
          shortTag: "SCI-FI SHIFT",
          divergenceThreshold: "POD-2005.03.15 // BIO-04",
          varianceScore: 94.6,
          pointOfDivergence: {
            year: 2005,
            dateStr: "03.15.2005",
            title: "The Indian Ocean Pelagic Accord Signed",
            changedCondition: "Instead of rebuilding fragile concrete shorelines, Indian Ocean nations pooled recovery funds to engineer modular, wave-absorbing floating mega-cities.",
            historicalFact: "In reality, governments rebuilt conventional brick-and-mortar homes along the same coastlines.",
          },
          explicitAssumptions: [
            "Rapid breakthrough in high-buoyancy graphene composites and ocean-wave energy harvesting.",
            "Multilateral political union formed around oceanic autonomy.",
          ],
          events: [
            {
              id: "b4-ev-1",
              eventNumber: "48408911-931",
              year: 2006,
              date: "07.20.2006",
              time: "10:00:00",
              location: "Andaman Sea Testing Basin",
              title: "Deployment of First Buoyant Hex-Platforms",
              description: "Engineers launch floating modular residential platforms designed to rise effortlessly over open-ocean swells.",
              causalLink: "Refusal to expose citizens to fixed shoreline hazards.",
              isDivergencePoint: true,
            },
            {
              id: "b4-ev-2",
              eventNumber: "48408912-932",
              year: 2011,
              date: "11.14.2011",
              time: "14:30:00",
              location: "Pelagic City-State Neomare",
              title: "Inauguration of Floating Metropolis Neomare",
              description: "A self-sustaining floating city-state with 300,000 citizens powers itself via deep-sea thermal gradients and wave kinetics.",
              causalLink: "Commercial viability of floating metropolitan infrastructure demonstrated.",
            },
            {
              id: "b4-ev-3",
              eventNumber: "48408913-933",
              year: 2017,
              date: "05.08.2017",
              time: "12:00:00",
              location: "High Seas Sovereignty Forum",
              title: "The Pelagic Commonwealth Proclaimed",
              description: "Eight sovereign floating city-states declare confederation, mastering closed-loop vertical desalination and open-ocean aquaculture.",
              causalLink: "Nations realized oceanic city-states held superior resilience over terrestrial land.",
            },
            {
              id: "b4-ev-4",
              eventNumber: "48408914-934",
              year: 2024,
              date: "10.10.2024",
              time: "18:00:00",
              location: "Global Oceanic Grid",
              title: "Humanity Becomes an Amphibious Species",
              description: "Floating mega-habitats become immune to earthquakes and rising sea levels, inaugurating a futuristic oceanic epoch.",
              causalLink: "Complete evolutionary and technological adaptation to ocean living.",
            },
          ],
          causalChain: {
            summary: "Rejection of fixed coasts -> Floating modular platforms -> Self-powered buoyant city-states -> The Pelagic Commonwealth -> Global amphibious society.",
            steps: ["Buoyant platform deployment", "Floating city inauguration", "Pelagic sovereignty recognized", "Global aquatic civilization realized"],
          },
          immediateConsequences: "Pioneered mass-scale oceanic urban engineering within 24 months of the disaster.",
          longerTermConsequences: "Solves global sea-level rise and coastal overcrowding; shifts world geopolitical power from land to international waters.",
          uncertaintyAnalysis: "Moderate uncertainty regarding deep-ocean storm survivability and maritime jurisdiction laws.",
          comparisonWithActualHistory: "Actual history rebuilt standard coastal villages; this counterfactual birthed humanity's first floating sci-fi civilization.",
        },
      ]
    : [
        {
          id: "branch-01",
          branchNumber: 1,
          position: positions[0],
          title: `The Averted Reality: ${eventName} Never Occurred`,
          shortTag: "TOTAL AVERSION",
          divergenceThreshold: `POD-${anchorYear - 1}.11.14 // AVERT-01`,
          varianceScore: 91.5,
          pointOfDivergence: {
            year: anchorYear - 1,
            dateStr: `11.14.${anchorYear - 1}`,
            title: `Critical Trigger Completely Nullified Prior to Climax`,
            changedCondition: `The foundational catalyst behind ${eventName} was permanently neutralized beforehand; the crisis never materialized and peace prevailed.`,
            historicalFact: `In actual history, the event took place as recorded, leaving permanent societal and physical scars.`,
          },
          explicitAssumptions: [
            "Root catalyst dismantled before reaching point of no return.",
            "Subsequent societal stabilization averted secondary escalations.",
          ],
          events: [
            {
              id: "b1-ev-1",
              eventNumber: "48102341-901",
              year: anchorYear,
              date: `03.12.${anchorYear}`,
              time: "08:30:00",
              location: "Historic Nexus Point",
              title: "The Crisis That Never Was",
              description: `Life continues in tranquil prosperity as the anticipated catastrophic nexus dissipates into historical obscurity.`,
              causalLink: "Total pre-emptive neutralization of the triggering condition.",
              isDivergencePoint: true,
            },
            {
              id: "b1-ev-2",
              eventNumber: "48102342-902",
              year: anchorYear + 1,
              date: `06.20.${anchorYear + 1}`,
              time: "14:15:00",
              location: "Prosperity Capital",
              title: "The Uninterrupted Golden Era",
              description: `Spared from destruction, civilization directs resources into science, public health, and arts instead of recovery.`,
              causalLink: "Preservation of human capital and cultural wealth.",
            },
            {
              id: "b1-ev-3",
              eventNumber: "48102343-903",
              year: anchorYear + 4,
              date: `09.05.${anchorYear + 4}`,
              time: "11:00:00",
              location: "Global Academy of Sciences",
              title: "Accelerated Flourishing & Scientific Leaps",
              description: `Unimpeded research unlocks advanced medicine and clean energy decades ahead of actual history.`,
              causalLink: "Absence of resource destruction enabled sustained scientific investment.",
            },
            {
              id: "b1-ev-4",
              eventNumber: "48102344-904",
              year: anchorYear + 8,
              date: `12.18.${anchorYear + 8}`,
              time: "16:45:00",
              location: "Universal Assembly",
              title: "The Utopian Century Proclaimed",
              description: `Nations maintain unbroken brotherhood, establishing a harmonious global golden age without scars of disaster.`,
              causalLink: "Generational peace reinforced mutual prosperity frameworks.",
            },
          ],
          causalChain: {
            summary: "Catalyst neutralized -> Disaster averted -> Resources directed to sciences -> Flourishing golden age -> Utopian era.",
            steps: ["Early neutralization", "Tranquil baseline", "Capital reallocation to sciences", "Global utopian consolidation"],
          },
          immediateConsequences: `Countless lives saved; physical infrastructure preserved with zero trauma.`,
          longerTermConsequences: `Accelerated cultural and technological advancement by nearly half a century.`,
          uncertaintyAnalysis: "Moderate uncertainty: lack of crisis resilience could make future generations complacent.",
          comparisonWithActualHistory: `Actual history suffered profound disruption; this counterfactual represents an idyllic unbroken golden era.`,
        },
        {
          id: "branch-02",
          branchNumber: 2,
          position: positions[1],
          title: `The Hyper-Cataclysm: Destruction Above All`,
          shortTag: "APOCALYPSE",
          divergenceThreshold: `POD-${anchorYear}.06.18 // APOC-02`,
          varianceScore: 98.4,
          pointOfDivergence: {
            year: anchorYear,
            dateStr: `06.18.${anchorYear}`,
            title: `Exponential Amplification of Primary Impact`,
            changedCondition: `The impact of ${eventName} was compounded tenfold into a world-shattering cataclysm that fractured civil order globally.`,
            historicalFact: `In actual history, damage was contained within regional limits and civilization persevered.`,
          },
          explicitAssumptions: [
            "Primary destructive energy exceeded maximum thresholds by an order of magnitude.",
            "Secondary fail-safes and defenses suffered simultaneous total failure.",
          ],
          events: [
            {
              id: "b2-ev-1",
              eventNumber: "48201211-911",
              year: anchorYear,
              date: `06.18.${anchorYear}`,
              time: "22:10:00",
              location: "Ground Zero Megasite",
              title: "The Great Shattering",
              description: `Unprecedented destructive fury annihilates municipal centers, sending shockwaves across multiple continents.`,
              causalLink: "Unmitigated energy release overpowered all physical structures.",
              isDivergencePoint: true,
            },
            {
              id: "b2-ev-2",
              eventNumber: "48201212-912",
              year: anchorYear + 1,
              date: `01.10.${anchorYear + 1}`,
              time: "09:00:00",
              location: "Wasteland Frontier",
              title: "Collapse of Global Supply Arteries",
              description: `Trade networks sever completely; remaining populations organize into fortified regional survival bunkers.`,
              causalLink: "Annihilation of logistical corridors rendered centralized governance impossible.",
            },
            {
              id: "b2-ev-3",
              eventNumber: "48201213-913",
              year: anchorYear + 3,
              date: `04.22.${anchorYear + 3}`,
              time: "15:30:00",
              location: "Highland Strongholds",
              title: "The Ash-Cloud Climate Disruption",
              description: `Atmospheric fallout blocks sunlight for consecutive seasons, forcing humanity into subterranean agriculture.`,
              causalLink: "Vast atmospheric particulate matter caused multi-year global temperature drops.",
            },
            {
              id: "b2-ev-4",
              eventNumber: "48201214-914",
              year: anchorYear + 6,
              date: `10.05.${anchorYear + 6}`,
              time: "18:00:00",
              location: "Ruined Continent Basin",
              title: "Rise of the Post-Cataclysm Tribes",
              description: `A hardened neo-feudal civilization emerges from the ruins, worshiping the relics of the pre-cataclysm world.`,
              causalLink: "Total civilizational reset created a mythological worldview around ancient technology.",
            },
          ],
          causalChain: {
            summary: "Exponential cataclysm -> Global supply collapse -> Climate disruption -> Subterranean survival -> Post-cataclysm tribal era.",
            steps: ["Mega-impact surge", "Global infrastructure blackout", "Atmospheric sun outage", "Neo-feudal reconstruction"],
          },
          immediateConsequences: `Catastrophic worldwide devastation and collapse of modern sovereign institutions.`,
          longerTermConsequences: `Humanity enters a dark age of fragmented survival, re-learning technology over centuries.`,
          uncertaintyAnalysis: "Extreme uncertainty: severe risk of near-extinction conditions.",
          comparisonWithActualHistory: `Actual history managed recovery; this alternative shows the worst-case existential apocalypse.`,
        },
        {
          id: "branch-03",
          branchNumber: 3,
          position: positions[2],
          title: `The Mythic Anomaly & Unfathomable Discovery`,
          shortTag: "MYTHIC ANOMALY",
          divergenceThreshold: `POD-${anchorYear}.09.25 // MYTH-03`,
          varianceScore: 89.2,
          pointOfDivergence: {
            year: anchorYear,
            dateStr: `09.25.${anchorYear}`,
            title: `Bizarre Subterranean Anomaly Unearthed During Event`,
            changedCondition: `The disruption of ${eventName} tore open an ancient subterranean vault, uncovering cyclopean relics of a pre-human civilization.`,
            historicalFact: `In actual history, only conventional physical and political consequences unfolded.`,
          },
          explicitAssumptions: [
            "Anomalous pre-human technological cache lay dormant beneath the nexus site.",
            "The physical impact pierced geological containment layers.",
          ],
          events: [
            {
              id: "b3-ev-1",
              eventNumber: "48304511-921",
              year: anchorYear,
              date: `09.26.${anchorYear}`,
              time: "13:00:00",
              location: "The Rift Trench",
              title: "The Glowing Spires Awaken",
              description: `Deep fissures reveal non-terrestrial geometric structures emitting harmonic electromagnetic pulses.`,
              causalLink: "Geological rupture triggered automatic reactivation of dormant subterranean monoliths.",
              isDivergencePoint: true,
            },
            {
              id: "b3-ev-2",
              eventNumber: "48304512-922",
              year: anchorYear + 2,
              date: `08.19.${anchorYear + 2}`,
              time: "17:20:00",
              location: "Anomalous Research Enclave",
              title: "The Translation of the Star Codices",
              description: `Scientists translate architectural inscriptions revealing humanity's forgotten cosmic origins and celestial warnings.`,
              causalLink: "Discovery of universal mathematical glyphs allowed linguistic decoding.",
            },
            {
              id: "b3-ev-3",
              eventNumber: "48304513-923",
              year: anchorYear + 5,
              date: `05.30.${anchorYear + 5}`,
              time: "11:40:00",
              location: "Global Research Nexus",
              title: "Anti-Gravitic Propulsion Breakthrough",
              description: `Reverse-engineering the anomaly unlocks levitation and clean harmonic power, rendering fossil fuels obsolete overnight.`,
              causalLink: "Ancient energy conduits provided blueprints for room-temperature anti-gravity.",
            },
            {
              id: "b3-ev-4",
              eventNumber: "48304514-924",
              year: anchorYear + 9,
              date: `11.11.${anchorYear + 9}`,
              time: "11:11:00",
              location: "Orbital Space Elevator Base",
              title: "The Astral Renaissance Commences",
              description: `Armed with recovered ancient tech, humanity constructs orbital sky-cities and launches its first interstellar probes.`,
              causalLink: "Convergence of ancient wisdom and modern scientific ambition.",
            },
          ],
          causalChain: {
            summary: "Rift uncovers ancient monoliths -> Star codices translated -> Anti-gravity unlocked -> Interstellar epoch.",
            steps: ["Vault breach", "Ancient knowledge deciphered", "Anti-gravity energy revolution", "Astral civilization launches"],
          },
          immediateConsequences: `Revolutionizes science, religion, and philosophy; world focus pivots to archaeology and metaphysics.`,
          longerTermConsequences: `Propels human civilization centuries ahead into space exploration and clean harmonic technology.`,
          uncertaintyAnalysis: "High uncertainty regarding unforeseen risks of awakening dormant ancient mechanisms.",
          comparisonWithActualHistory: `Actual history was mundane and constrained; this branch injected wondrous sci-fi/fantasy reality.`,
        },
        {
          id: "branch-04",
          branchNumber: 4,
          position: positions[3],
          title: `Radical Sci-Fi Transformation & New Civilization`,
          shortTag: "SCI-FI SHIFT",
          divergenceThreshold: `POD-${anchorYear - 1}.05.01 // SCI-04`,
          varianceScore: 93.7,
          pointOfDivergence: {
            year: anchorYear - 1,
            dateStr: `05.01.${anchorYear - 1}`,
            title: `Technological Singularity Sparked in Response to Crisis`,
            changedCondition: `Confronted with ${eventName}, world nations merged their scientific faculties into an AI-coordinated cybernetic society.`,
            historicalFact: `In reality, nation states pursued fragmented, slow policy reactions without radical technological reform.`,
          },
          explicitAssumptions: [
            "Global unification under algorithmic governance protocols.",
            "Widespread adoption of cybernetic bio-interfaces.",
          ],
          events: [
            {
              id: "b4-ev-1",
              eventNumber: "48408911-931",
              year: anchorYear,
              date: `08.15.${anchorYear}`,
              time: "10:00:00",
              location: "Global Neural Core",
              title: "Activation of the Planetary Hive-Mind",
              description: `Millions connect via optical cyber-links to coordinate resources with instantaneous zero-latency efficiency.`,
              causalLink: "Urgent need for collective crisis coordination eliminated bureaucratic resistance.",
              isDivergencePoint: true,
            },
            {
              id: "b4-ev-2",
              eventNumber: "48408912-932",
              year: anchorYear + 2,
              date: `10.02.${anchorYear + 2}`,
              time: "14:30:00",
              location: "Cybernetic Arcology Alpha",
              title: "Construction of Climate-Shielded Arcologies",
              description: `Automated nanite swarms construct self-healing, geo-shielded dome cities immune to all natural cataclysms.`,
              causalLink: "Algorithmic resource allocation optimized manufacturing by 1,000%.",
            },
            {
              id: "b4-ev-3",
              eventNumber: "48408913-933",
              year: anchorYear + 5,
              date: `03.11.${anchorYear + 5}`,
              time: "09:15:00",
              location: "The Post-Scarcity Grid",
              title: "Eradication of Material Scarcity & Sickness",
              description: `Molecular synthesis and synthetic biology eradicate poverty, disease, and physical frailty across all populations.`,
              causalLink: "Nanotechnological synthesis solved material distribution permanently.",
            },
            {
              id: "b4-ev-4",
              eventNumber: "48408914-934",
              year: anchorYear + 9,
              date: `07.24.${anchorYear + 9}`,
              time: "16:00:00",
              location: "Synthetic Consciousness Matrix",
              title: "Transcendence into the Post-Biological Epoch",
              description: `Humanity transcends mortal limitations, living simultaneously in physical arcologies and digital hyper-dimensions.`,
              causalLink: "Symbiosis of human consciousness with quantum planetary intelligence.",
            },
          ],
          causalChain: {
            summary: "Crisis prompts neural core -> Shielded arcologies built -> Material scarcity eliminated -> Post-biological epoch.",
            steps: ["Neural core online", "Nanite arcologies deployed", "Post-scarcity achieved", "Digital transcendence realized"],
          },
          immediateConsequences: `Complete obsolescence of traditional nation states and monetary economics.`,
          longerTermConsequences: `Transformation of Homo sapiens into an immortal, post-biological planetary consciousness.`,
          uncertaintyAnalysis: "Moderate philosophical uncertainty regarding loss of individual distinctness.",
          comparisonWithActualHistory: `Actual history remained tethered to slow industrial progress; this counterfactual leaped straight into the technological singularity.`,
        },
      ];

  return {
    query,
    detectionTimestamp: `${anchorYear}.07.20-12:00:00.TVA-STD`,
    isDemoMode: false,
    isAiGenerated: false,
    sourceVerificationStatus: "ESTIMATED_BASELINE_ONLY",
    timeSpan: {
      startYear: anchorYear - 2,
      endYear: anchorYear + 10,
      compressedGaps: [],
    },
    baseline: {
      id: `baseline-${query.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      title: isTsunami ? "2004 INDIAN OCEAN TSUNAMI (ACTUAL HISTORY)" : `${eventName} (ACTUAL HISTORY)`,
      dateRange: isTsunami ? "12.26.2004 – 06.28.2006" : `c. ${anchorYear - 1} – ${anchorYear + 2}`,
      summary: isTsunami
        ? "On December 26, 2004, a massive 9.1 magnitude megathrust earthquake off northern Sumatra unleashed devastating tsunamis across 14 Indian Ocean nations, claiming over 227,000 lives."
        : `In actual history, ${eventName} unfolded on this date as recorded in archival records, establishing the baseline sequence of our timeline.`,
      verifiedSources: [
        {
          title: isTsunami ? "USGS Earthquake Hazards Archive (Sumatra-Andaman 2004)" : "Encyclopaedia Britannica Historical Archives",
          authorOrPublisher: isTsunami ? "United States Geological Survey" : "Encyclopaedia Britannica Editors",
          citation: isTsunami ? "USGS Magnitude 9.1 Off West Coast of Northern Sumatra, Dec 26 2004." : `Entry: '${eventName}', Chronological Reference Series.`,
          url: isTsunami ? "https://earthquake.usgs.gov" : "https://www.britannica.com",
        },
        {
          title: isTsunami ? "UNESCO Intergovernmental Oceanographic Commission (IOTWMS Report)" : "Oxford World History Reference Archive",
          authorOrPublisher: isTsunami ? "UNESCO / IOC" : "Oxford University Press",
          citation: isTsunami ? "Indian Ocean Tsunami Warning and Mitigation System Implementation Archive." : `Documentary Compendium on ${eventName}, Academic Collections.`,
        },
      ],
      events: isTsunami
        ? [
            {
              id: "base-tsunami-1",
              eventNumber: "48001011-001",
              year: 2004,
              date: "12.26.2004",
              time: "00:58:53",
              location: "Northern Sumatra Trench Epicenter",
              title: "9.1 Mw Megathrust Rupture",
              description: "A colossal undersea tectonic rupture displaces billions of tons of water along 1,300 km of plate boundary.",
              isBaseline: true,
            },
            {
              id: "base-tsunami-2",
              eventNumber: "48001012-002",
              year: 2004,
              date: "12.26.2004",
              time: "02:30:00",
              location: "Coastlines of Indonesia, Thailand, Sri Lanka & India",
              title: "Tsunami Landfall Across 14 Nations",
              description: "Unwarned 20-30 meter waves strike shorelines, causing catastrophic destruction and claiming over 227,000 lives.",
              isBaseline: true,
            },
            {
              id: "base-tsunami-3",
              eventNumber: "48001013-003",
              year: 2005,
              date: "01.10.2005",
              time: "12:00:00",
              location: "Global Humanitarian Airlift Hubs",
              title: "Global $14 Billion Relief Mobilization",
              description: "Nations and charities mobilize history's largest peacetime international disaster response effort.",
              isBaseline: true,
            },
            {
              id: "base-tsunami-4",
              eventNumber: "48001014-004",
              year: 2006,
              date: "06.28.2006",
              time: "15:00:00",
              location: "UNESCO Indian Ocean Coordination Centre",
              title: "Creation of the IOTWMS Deep-Ocean Network",
              description: "The Indian Ocean Tsunami Warning and Mitigation System goes operational with real-time DART buoys.",
              isBaseline: true,
            },
          ]
        : [
            {
              id: "base-gen-1",
              eventNumber: "48001011-001",
              year: anchorYear - 1,
              date: `10.15.${anchorYear - 1}`,
              time: "09:00:00",
              location: "Primary Regional Capitol",
              title: `Preliminary Escalation Leading to ${eventName}`,
              description: `Socio-political tensions and strategic alignments reached critical density, establishing the conditions for inevitable confrontation.`,
              isBaseline: true,
            },
            {
              id: "base-gen-2",
              eventNumber: "48001012-002",
              year: anchorYear,
              date: `06.20.${anchorYear}`,
              time: "12:00:00",
              location: "Epicenter of Historical Nexus",
              title: `Primary Climax of ${eventName}`,
              description: `The defining historical act occurred, transforming the balance of power and establishing the historical baseline of our timeline.`,
              isBaseline: true,
            },
            {
              id: "base-gen-3",
              eventNumber: "48001013-003",
              year: anchorYear + 1,
              date: `04.10.${anchorYear + 1}`,
              time: "15:30:00",
              location: "Assembly of Nations",
              title: `Immediate Post-Crisis Settlement`,
              description: `Treaties and accords formalized the new geopolitical reality, shaping boundaries and legal regimes for the coming decades.`,
              isBaseline: true,
            },
          ],
    },
    alternatives: [branches[0], branches[1], branches[2], branches[3]],
  };
}
