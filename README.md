# ALTERNATIVE TIMELINE DETECTION SYSTEM (ATDS)
> **TVA Historical Counterfactual Explorer Terminal**

An interactive historical what-if web application inspired by the **Loki TVA (Time Variance Authority) retro monitor** aesthetic.

Users enter a real historical event, and the terminal displays the verified historical sequence as a central timeline alongside **exactly four fictional alternative timelines** branching from plausible points of divergence (two above the central line, two below).

---

## 📺 Visual & Thematic Aesthetic

- **Retro TVA CRT Monitor Housing**: Deep burgundy chassis (`#361016`), brushed metallic badges, and authentic top plaque with the classic TVA insignia.
- **Glowing Phosphor Timeline Display**: Ivory core with warm amber and gold halo trajectories flowing horizontally.
- **Oscilloscope Grid & Scanlines**: Ambient CRT scanline overlay, vignette curvature, and coordinate grids.
- **Chronological Registry**: Lower table formatted in monospace amber phosphor (`EVENT#`, `DATE`, `TIME`, `LOCATION`, `STATUS`, `SUMMARY`).
- **Terminal Control Bar**: Bottom function strip (`TVA-SYS`, `RESET [DEMO]`, `VIEW [SOURCES]`, `HELP [MANUAL]`).

---

## ⚡ Core Concept & Features

1. **Central Baseline & Exactly Four Branches**:
   - Central Horizontal Line: **ACTUAL HISTORY** (grounded in verified documentary archives).
   - Two Alternate Branches **Above**:
     - **Branch 01 (top-outer)**: Divergent geopolitical or early intervention vector.
     - **Branch 02 (top-inner)**: Critical tactical/abrupt decision divergence.
   - Two Alternate Branches **Below**:
     - **Branch 03 (bottom-inner)**: Delayed timeline / prolonged friction vector.
     - **Branch 04 (bottom-outer)**: Accelerated investment / technological expansion vector.
2. **Shared History Preservation**:
   - Each branch emerges smoothly from the central baseline at its specific **Point of Divergence (POD)** date, preserving shared baseline events prior to that moment.
3. **Deterministic Moon Landing Demo (Works Out-Of-The-Box)**:
   - **Baseline**: Apollo 11 lands humans on the Moon in 1969; program concludes with Apollo 17 in 1972.
   - **Alternative 01 (above 1)**: The Soviet Union lands humans first (*Korolev survives surgery in 1966; N1 rocket stabilized; Leonov lands March 1969*).
   - **Alternative 02 (above 2)**: Apollo 11 aborts the landing and returns safely (*1202 radar overload abort; safe splashdown; Apollo 12 succeeds Nov 1969*).
   - **Alternative 03 (below 1)**: First crewed lunar landing delayed until the 1980s (*Apollo 1 fire investigation leads to 1968 budget moratorium; shuttle-derived lunar mission in 1982*).
   - **Alternative 04 (below 2)**: Sustained funding leads to a permanent lunar base (*Space Task Group Option II approved; Apollo 18–20 discover polar ice; Base Alpha commissioned in 1978*).
4. **Rich Branch Breakdown**:
   - Title & Point of Divergence (POD) with changed historical condition vs. reality.
   - Explicit historical assumptions.
   - Four chronological hypothetical events with causal step-by-step links.
   - Immediate and longer-term consequences + uncertainty analysis.
   - Direct comparison with actual history.
5. **Timeline Scrubber & Playback Engine**:
   - Play, Pause, Restart controls.
   - Time scrubber slider with real-time temporal cursor year indicator.
   - Events illuminate and log rows activate dynamically as the playhead sweeps forward.
   - Keyboard shortcuts: `SPACE` (Play/Pause), `0`/`A` (Actual History), `1`–`4` (Branches), `←`/`→` (Scrub).
6. **Side-by-Side Comparative Analysis**:
   - Modal comparing actual history and the selected counterfactual in real time.
7. **Temporal Ambiguity Handling**:
   - Detects broad single-word queries (e.g. `WAR`, `REVOLUTION`, `CRISIS`) and prompts the user to select the specific historical conflict to maintain content integrity without inventing false baselines.
8. **Server-Side AI Generation with Deterministic Fallback**:
   - Server endpoint: `/api/detect-timeline` (keeps all API keys server-side).
   - When `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) is provided, generates dynamic, strictly validated counterfactuals for any historical query.
   - When running offline or without an API key, provides curated presets (`MOON LANDING`, `CUBAN MISSILE CRISIS`, `FALL OF ROME`, `TITANIC`) and deterministic fallback generation.
9. **State Persistence**:
   - Automatically saves and restores the last exploration using `localStorage`.
   - Preserves previous valid timeline if a query encounters an error.
10. **Accessibility & Responsive Design**:
    - Scalable vector graphics (`viewBox`) for smooth scaling across mobile, tablet, and desktop.
    - Keyboard-accessible branch and node buttons with focus states.
    - Full `prefers-reduced-motion` compliance.

---

## 🛠️ Tech Stack

- **Framework**: Next.js App Router (16.4.0)
- **Language**: TypeScript (v5)
- **Styling**: Tailwind CSS (v4) with custom CRT scanline and phosphor glow utilities
- **Graphics**: Interactive custom SVG with cubic Bézier branch paths and SVG glow filters
- **State & Storage**: React 19 hooks + Browser `localStorage`

---

## 🚀 Setup & Execution

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm run build
npm run start
```

### 4. Optional: Enable Live AI Generation
To enable live AI generation for arbitrary historical events via Google Gemini:
1. Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
2. Restart the server (`npm run dev`). If no key is set, the system seamlessly runs in offline verified demo mode.

---

## 📜 Content Integrity & Disclaimers

> *"An exploration of alternative history, not a prediction or discovery of real timelines."*

- All baseline historical claims are sourced from verified public historical records (e.g., NASA SP-4009, NASA Mission Reports, U.S. State Department Office of the Historian, Encyclopaedia Britannica).
- All alternative timeline branches, changed conditions, and subsequent events are works of speculative historical fiction.
