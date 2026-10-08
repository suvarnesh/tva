export interface Point {
  x: number;
  y: number;
}

export interface CubicBezier {
  p0: Point;
  p1: Point;
  p2: Point;
  p3: Point;
}

/**
 * Evaluates position on a cubic Bézier curve at t in [0, 1]
 */
export function evalCubicBezier(b: CubicBezier, t: number): Point {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * b.p0.x + 3 * mt2 * t * b.p1.x + 3 * mt * t2 * b.p2.x + t3 * b.p3.x,
    y: mt3 * b.p0.y + 3 * mt2 * t * b.p1.y + 3 * mt * t2 * b.p2.y + t3 * b.p3.y,
  };
}

/**
 * Evaluates tangent vector on a cubic Bézier curve at t in [0, 1]
 */
export function evalCubicBezierDerivative(b: CubicBezier, t: number): Point {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;

  return {
    x: 3 * mt2 * (b.p1.x - b.p0.x) + 6 * mt * t * (b.p2.x - b.p1.x) + 3 * t2 * (b.p3.x - b.p2.x),
    y: 3 * mt2 * (b.p1.y - b.p0.y) + 6 * mt * t * (b.p2.y - b.p1.y) + 3 * t2 * (b.p3.y - b.p2.y),
  };
}

/**
 * Evaluates a chained multi-segment cubic Bézier curve at global parameter u in [0, 1]
 */
export function evalCurveChain(
  segments: CubicBezier[],
  u: number
): { pos: Point; tangent: Point; normal: Point } {
  const clampedU = Math.max(0, Math.min(1, u));
  const numSegs = segments.length;
  const scaled = clampedU * numSegs;
  let segIndex = Math.floor(scaled);
  if (segIndex >= numSegs) segIndex = numSegs - 1;
  const segT = scaled - segIndex;

  const seg = segments[segIndex];
  const pos = evalCubicBezier(seg, segT);
  const deriv = evalCubicBezierDerivative(seg, segT);

  const len = Math.sqrt(deriv.x * deriv.x + deriv.y * deriv.y) || 1;
  const tangent = { x: deriv.x / len, y: deriv.y / len };
  // Normal is perpendicular to tangent: (-ty, tx)
  const normal = { x: -tangent.y, y: tangent.x };

  return { pos, tangent, normal };
}

/**
 * Builds a variable-width SVG ribbon polygon path by sampling a curve chain
 * and offsetting points along the local normal.
 */
export function generateRibbonPath(
  segments: CubicBezier[],
  widthFn: (u: number) => number,
  samplesCount: number = 70
): string {
  const topPoints: Point[] = [];
  const bottomPoints: Point[] = [];

  for (let i = 0; i <= samplesCount; i++) {
    const u = i / samplesCount;
    const { pos, normal, tangent } = evalCurveChain(segments, u);
    const halfWidth = widthFn(u);

    // Tip shaping: softly rounded/pointed apex at the final point
    if (i === samplesCount) {
      const tipApex = {
        x: pos.x + tangent.x * halfWidth * 1.3,
        y: pos.y + tangent.y * halfWidth * 1.3,
      };
      topPoints.push({
        x: pos.x + normal.x * halfWidth,
        y: pos.y + normal.y * halfWidth,
      });
      topPoints.push(tipApex);
      bottomPoints.push({
        x: pos.x - normal.x * halfWidth,
        y: pos.y - normal.y * halfWidth,
      });
      continue;
    }

    topPoints.push({
      x: pos.x + normal.x * halfWidth,
      y: pos.y + normal.y * halfWidth,
    });
    bottomPoints.push({
      x: pos.x - normal.x * halfWidth,
      y: pos.y - normal.y * halfWidth,
    });
  }

  // Construct closed SVG path:
  // Move along topPoints from start to end, then bottomPoints from end to start, then close
  let d = `M ${topPoints[0].x.toFixed(2)} ${topPoints[0].y.toFixed(2)}`;

  for (let i = 1; i < topPoints.length; i++) {
    d += ` L ${topPoints[i].x.toFixed(2)} ${topPoints[i].y.toFixed(2)}`;
  }

  for (let i = bottomPoints.length - 1; i >= 0; i--) {
    d += ` L ${bottomPoints[i].x.toFixed(2)} ${bottomPoints[i].y.toFixed(2)}`;
  }

  d += " Z";
  return d;
}

/**
 * Builds a variable-width SVG ribbon polygon path up to fractional parameter maxU in [0, 1].
 * Perfect for GPU-accelerated procedural growth animations without SVG clipPath/mask bugs.
 */
export function generatePartialRibbonPath(
  segments: CubicBezier[],
  widthFn: (u: number) => number,
  samplesCount: number = 60,
  maxU: number = 1.0
): string {
  if (maxU <= 0.002) return "";
  const clampedMax = Math.min(1, Math.max(0.01, maxU));
  const count = Math.max(2, Math.round(samplesCount * clampedMax));

  const topPoints: Point[] = [];
  const bottomPoints: Point[] = [];

  for (let i = 0; i <= count; i++) {
    const u = (i / count) * clampedMax;
    const { pos, normal, tangent } = evalCurveChain(segments, u);
    const halfWidth = widthFn(u);

    // Tip shaping: softly rounded/pointed apex at current leading head
    if (i === count) {
      const tipApex = {
        x: pos.x + tangent.x * halfWidth * 1.3,
        y: pos.y + tangent.y * halfWidth * 1.3,
      };
      topPoints.push({
        x: pos.x + normal.x * halfWidth,
        y: pos.y + normal.y * halfWidth,
      });
      topPoints.push(tipApex);
      bottomPoints.push({
        x: pos.x - normal.x * halfWidth,
        y: pos.y - normal.y * halfWidth,
      });
      continue;
    }

    topPoints.push({
      x: pos.x + normal.x * halfWidth,
      y: pos.y + normal.y * halfWidth,
    });
    bottomPoints.push({
      x: pos.x - normal.x * halfWidth,
      y: pos.y - normal.y * halfWidth,
    });
  }

  let d = `M ${topPoints[0].x.toFixed(2)} ${topPoints[0].y.toFixed(2)}`;
  for (let i = 1; i < topPoints.length; i++) {
    d += ` L ${topPoints[i].x.toFixed(2)} ${topPoints[i].y.toFixed(2)}`;
  }
  for (let i = bottomPoints.length - 1; i >= 0; i--) {
    d += ` L ${bottomPoints[i].x.toFixed(2)} ${bottomPoints[i].y.toFixed(2)}`;
  }
  d += " Z";
  return d;
}

/**
 * Builds a clean centerline SVG path string for hit testing
 */
export function generateCenterlinePath(segments: CubicBezier[]): string {
  if (segments.length === 0) return "";
  let d = `M ${segments[0].p0.x.toFixed(2)} ${segments[0].p0.y.toFixed(2)}`;
  for (const seg of segments) {
    d += ` C ${seg.p1.x.toFixed(2)} ${seg.p1.y.toFixed(2)}, ${seg.p2.x.toFixed(2)} ${seg.p2.y.toFixed(2)}, ${seg.p3.x.toFixed(2)} ${seg.p3.y.toFixed(2)}`;
  }
  return d;
}

// =========================================================================
// DETERMINISTIC SACRED TIMELINE & 4 ALTERNATIVE BRANCH DEFINITIONS
// =========================================================================

/**
 * Main Sacred Timeline continuous organic curve matching Image 2:
 * - Shallow dip on the left
 * - Broad gentle rise near the middle
 * - Gentle descent
 * - Flatter right end
 */
export const MAIN_TIMELINE_SEGMENTS: CubicBezier[] = [
  // 1. Entry to left trough
  {
    p0: { x: 30, y: 175 },
    p1: { x: 95, y: 182 },
    p2: { x: 155, y: 204 },
    p3: { x: 215, y: 204 },
  },
  // 2. Trough up to central crest
  {
    p0: { x: 215, y: 204 },
    p1: { x: 295, y: 204 },
    p2: { x: 385, y: 126 },
    p3: { x: 475, y: 126 },
  },
  // 3. Central crest down to right trough
  {
    p0: { x: 475, y: 126 },
    p1: { x: 565, y: 126 },
    p2: { x: 645, y: 198 },
    p3: { x: 725, y: 198 },
  },
  // 4. Right trough leveling out to flat right end
  {
    p0: { x: 725, y: 198 },
    p1: { x: 795, y: 198 },
    p2: { x: 865, y: 188 },
    p3: { x: 930, y: 188 },
  },
];

/**
 * Sacred timeline ribbon width function:
 * Restrained organic swell in the middle (crest half-width 4.0px = 8.0px total; ends 2.2px).
 * Eliminates excessive brightness and thickness at the crest.
 */
export function mainRibbonWidthFn(u: number): number {
  return 2.2 + 1.8 * Math.sin(Math.PI * u);
}

/**
 * Substantial branch width function:
 * Stays visibly substantial along 75-80% of its length,
 * then smoothly tapers over the final 20-25% to a soft clean tip.
 */
export function branchWidthFn(baseWidth: number = 2.8) {
  return (t: number): number => {
    if (t < 0.75) {
      // Gentle reduction over the first 75%
      return baseWidth * (1 - 0.22 * (t / 0.75));
    } else {
      // Final 25%: tapers from baseWidth * 0.78 down to 1.1px
      const s = (t - 0.75) / 0.25;
      const startW = baseWidth * 0.78;
      const endW = 1.1;
      return startW - (startW - endW) * Math.sin((s * Math.PI) / 2);
    }
  };
}

export interface BranchGeometry {
  branchIndex: number; // 0, 1, 2, 3
  isUpward: boolean;
  uDivergence: number;
  podPos: Point;
  segments: CubicBezier[];
  ribbonPath: string;
  centerlinePath: string;
  eventPositions: Point[]; // exactly 4 event markers along this branch
  baseWidth: number;
}

function buildBranchGeometry(
  branchIndex: number,
  isUpward: boolean,
  uDiv: number,
  endX: number,
  endY: number,
  bendY: number,
  baseWidth: number = 2.8,
  tanLen: number = 70
): BranchGeometry {
  const { pos, tangent } = evalCurveChain(MAIN_TIMELINE_SEGMENTS, uDiv);
  
  // Follow trunk tangent smoothly before bending away
  const p1 = {
    x: pos.x + tangent.x * tanLen,
    y: pos.y + tangent.y * tanLen,
  };
  const p2 = {
    x: pos.x + (endX - pos.x) * 0.62,
    y: bendY,
  };
  const p3 = { x: endX, y: endY };
  const segments: CubicBezier[] = [{ p0: pos, p1, p2, p3 }];

  const ribbonPath = generateRibbonPath(
    segments,
    branchWidthFn(baseWidth),
    55
  );
  const centerlinePath = generateCenterlinePath(segments);

  // Sample 4 event positions along the branch: t in [0.26, 0.50, 0.74, 0.96]
  const eventFractions = [0.26, 0.50, 0.74, 0.96];
  const eventPositions = eventFractions.map((t) => evalCubicBezier(segments[0], t));

  return {
    branchIndex,
    isUpward,
    uDivergence: uDiv,
    podPos: pos,
    segments,
    ribbonPath,
    centerlinePath,
    eventPositions,
    baseWidth,
  };
}

/**
 * Exactly four alternative branches (2 upward, 2 downward)
 * - Visibly substantial bodies
 * - Seamless tangent emergence from the main timeline
 * - Varied lengths and curvature
 * - Softly pointed tips
 */
export const BRANCH_GEOMETRIES: BranchGeometry[] = [
  // Branch 01 (Upward, Alternative 01: Soviet Lunar First): early POD ~1966
  buildBranchGeometry(0, true, 0.17, 370, 85, 115, 2.7, 65),
  // Branch 02 (Upward, Alternative 02: Apollo 11 Abort): POD near landing ~1969
  buildBranchGeometry(1, true, 0.42, 710, 68, 76, 3.0, 80),
  // Branch 03 (Downward, Alternative 03: Postponed to 1980s): POD post-Apollo 1 ~1967
  buildBranchGeometry(2, false, 0.28, 485, 290, 265, 2.8, 70),
  // Branch 04 (Downward, Alternative 04: Permanent Lunar Base): post-1969 continuation
  buildBranchGeometry(3, false, 0.58, 835, 275, 245, 2.8, 80),
];

/**
 * Precomputed Sacred Timeline ribbon path
 */
export const MAIN_RIBBON_PATH = generateRibbonPath(
  MAIN_TIMELINE_SEGMENTS,
  mainRibbonWidthFn,
  80
);

/**
 * Precomputed Sacred Timeline centerline path
 */
export const MAIN_CENTERLINE_PATH = generateCenterlinePath(MAIN_TIMELINE_SEGMENTS);

/**
 * Baseline milestone positions along the sacred timeline
 */
export const BASELINE_EVENT_POSITIONS: Point[] = [0.12, 0.32, 0.52, 0.72, 0.92].map(
  (u) => evalCurveChain(MAIN_TIMELINE_SEGMENTS, u).pos
);
