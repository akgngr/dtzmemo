'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';

// ============================================================
// Types
// ============================================================

interface ReviewPoint {
  day: number;
  ease: number;
  interval: number;
}

interface MemoryCurveChartProps {
  /** Current SM-2 ease factor (default: 2.5) */
  ease?: number;
  /** Current SM-2 interval in days (default: 1) */
  interval?: number;
  /** Total correct answers across reviews */
  correct?: number;
  /** Total wrong answers across reviews */
  wrong?: number;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================
// Constants
// ============================================================

/** Stability multiplier: S = interval * K => R(interval) ~ 0.90 */
const STABILITY_K = 9.49;
/** Forgetting-curve stability without any review (fast decay) */
const NO_REVIEW_STABILITY = 2.5;
/** Sample points per curve segment for smooth rendering */
const PTS_PER_SEGMENT = 40;
/** Number of SM-2 review cycles to illustrate */
const NUM_CYCLES = 5;

// SVG layout
const VB_W = 700;
const VB_H = 380;
const MARGIN = { top: 20, right: 20, bottom: 68, left: 55 };
const CHART_X = MARGIN.left;
const CHART_Y = MARGIN.top;
const CHART_W = VB_W - MARGIN.left - MARGIN.right;
const CHART_H = VB_H - MARGIN.top - MARGIN.bottom;

// Palette
const CLR = {
  noReview: '#94a3b8',
  sm2Stroke: '#3b82f6',
  sm2End: '#10b981',
  projected: '#93c5fd',
  dot: '#10b981',
  dotGlow: 'rgba(16,185,129,0.35)',
  grid: '#e2e8f0',
  axis: '#cbd5e1',
  label: '#64748b',
  labelLight: '#94a3b8',
  threshold: '#f59e0b',
};

// ============================================================
// Helpers
// ============================================================

/** Simulate an ideal SM-2 journey (all "easy" ratings). */
function simulateSM2(cycles: number, startEase = 2.5): ReviewPoint[] {
  const pts: ReviewPoint[] = [{ day: 0, ease: startEase, interval: 1 }];
  let day = 0;
  let ease = startEase;
  let interval = 1;

  for (let i = 1; i <= cycles; i++) {
    day += interval;
    ease = Math.min(ease + 0.3, 5.0);
    interval = Math.max(interval * ease, 1);
    pts.push({ day, ease, interval });
  }
  return pts;
}

/** Exponential decay points between two moments. */
function decayPoints(
  startDay: number,
  stability: number,
  endDay: number,
  n = PTS_PER_SEGMENT,
): { day: number; r: number }[] {
  const out: { day: number; r: number }[] = [];
  const range = endDay - startDay;
  for (let i = 0; i <= n; i++) {
    const t = startDay + (range * i) / n;
    out.push({ day: t, r: Math.exp(-(t - startDay) / stability) });
  }
  return out;
}

/** Convert data to SVG coordinates. */
function xOf(day: number, maxDay: number) {
  return CHART_X + (day / maxDay) * CHART_W;
}
function yOf(retention: number) {
  return CHART_Y + CHART_H * (1 - retention);
}

/** Nice tick values for the X axis. */
function niceTicks(max: number, target = 5): number[] {
  if (max <= 0) return [0];
  const rough = max / target;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const res = rough / mag;
  let step: number;
  if (res <= 1.5) step = mag;
  else if (res <= 3.5) step = 2 * mag;
  else if (res <= 7.5) step = 5 * mag;
  else step = 10 * mag;

  const ticks = [0];
  let v = step;
  while (v < max - 0.01) {
    ticks.push(v);
    v += step;
  }
  ticks.push(max);
  return ticks;
}

// ============================================================
// Path builders
// ============================================================

interface CurvePaths {
  solid: string;
  projected: string;
  area: string;
  noReview: string;
}

function buildPaths(reviews: ReviewPoint[], maxDay: number): CurvePaths {
  const solidPts: { x: number; y: number }[] = [];
  const projPts: { x: number; y: number }[] = [];

  for (let i = 0; i < reviews.length; i++) {
    const rv = reviews[i];
    const S = rv.interval * STABILITY_K;

    if (i === 0) solidPts.push({ x: xOf(0, maxDay), y: yOf(1) });

    if (i < reviews.length - 1) {
      const next = reviews[i + 1];
      const seg = decayPoints(rv.day, S, next.day);
      for (let j = 1; j < seg.length; j++) {
        solidPts.push({ x: xOf(seg[j].day, maxDay), y: yOf(seg[j].r) });
      }
      solidPts.push({ x: xOf(next.day, maxDay), y: yOf(1) });
    } else {
      const projEnd = Math.min(rv.day + S * 0.6, maxDay);
      const seg = decayPoints(rv.day, S, projEnd);
      for (let j = 1; j < seg.length; j++) {
        projPts.push({ x: xOf(seg[j].day, maxDay), y: yOf(seg[j].r) });
      }
    }
  }

  const f = (v: number) => v.toFixed(1);

  const solid = solidPts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${f(p.x)} ${f(p.y)}`)
    .join(' ');

  const lastSolid = solidPts[solidPts.length - 1];
  const projected =
    projPts.length > 0
      ? `M${f(lastSolid.x)} ${f(lastSolid.y)} ` +
        projPts.map((p) => `L${f(p.x)} ${f(p.y)}`).join(' ')
      : '';

  const bottomY = f(yOf(0));
  const area =
    solid +
    ` L${f(lastSolid.x)} ${bottomY} L${f(solidPts[0].x)} ${bottomY} Z`;

  const nrPts = decayPoints(0, NO_REVIEW_STABILITY, maxDay, 80);
  const noReview = nrPts
    .map(
      (p, i) =>
        `${i === 0 ? 'M' : 'L'}${f(xOf(p.day, maxDay))} ${f(yOf(p.r))}`,
    )
    .join(' ');

  return { solid, projected, area, noReview };
}

// ============================================================
// Embedded SVG CSS (animations)
// ============================================================

const SVG_STYLE = `
  .mc-no-review {
    stroke-dasharray: 3000;
    stroke-dashoffset: 3000;
    animation: mc-draw 1s ease-out 0s forwards;
  }
  .mc-area {
    opacity: 0;
    animation: mc-fade 1.2s ease-out 0.3s forwards;
  }
  .mc-sm2 {
    stroke-dasharray: 3000;
    stroke-dashoffset: 3000;
    animation: mc-draw 1.6s ease-out 0.15s forwards;
  }
  .mc-proj {
    stroke-dasharray: 3000;
    stroke-dashoffset: 3000;
    animation: mc-draw 0.8s ease-out 1.3s forwards;
  }
  .mc-threshold {
    opacity: 0;
    animation: mc-fade 0.6s ease-out 0.7s forwards;
  }
  .mc-dot {
    opacity: 0;
    animation: mc-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards;
  }
  .mc-dot-ring {
    opacity: 0;
    animation: mc-ring 1.8s ease-out 1.8s infinite;
  }
  .mc-label {
    opacity: 0;
    animation: mc-fade 0.4s ease-out forwards;
  }
  .mc-legend {
    opacity: 0;
    animation: mc-fade 0.5s ease-out 1.6s forwards;
  }
  @keyframes mc-draw { to { stroke-dashoffset: 0; } }
  @keyframes mc-fade { to { opacity: 1; } }
  @keyframes mc-pop {
    0%   { opacity: 0; transform: scale(0); }
    100% { opacity: 1; transform: scale(1); }
  }
  @keyframes mc-ring {
    0%   { opacity: 0.5; transform: scale(1); }
    100% { opacity: 0;   transform: scale(2.2); }
  }
`;

// ============================================================
// Component
// ============================================================

export function MemoryCurveChart({
  ease = 2.5,
  interval = 1,
  correct = 0,
  wrong = 0,
  className,
}: MemoryCurveChartProps) {
  const reviews = useMemo(() => simulateSM2(NUM_CYCLES), []);

  const maxDay = useMemo(() => {
    const last = reviews[reviews.length - 1];
    const S = last.interval * STABILITY_K;
    return Math.ceil(Math.max(last.day + S * 0.6, last.day * 1.15));
  }, [reviews]);

  const xTicks = useMemo(() => niceTicks(maxDay), [maxDay]);
  const paths = useMemo(() => buildPaths(reviews, maxDay), [reviews, maxDay]);

  const yTicks = [0, 0.25, 0.5, 0.75, 1.0];
  const hasProgress = correct + wrong > 0;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMid meet"
      className={cn('w-full h-auto', className)}
      role="img"
      aria-label="Memory curve showing how spaced repetition counteracts the forgetting curve"
    >
      <defs>
        <linearGradient id="mc-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={CLR.sm2Stroke} stopOpacity={0.18} />
          <stop offset="100%" stopColor={CLR.sm2Stroke} stopOpacity={0.02} />
        </linearGradient>
        <linearGradient id="mc-line-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={CLR.sm2Stroke} />
          <stop offset="100%" stopColor={CLR.sm2End} />
        </linearGradient>
        <filter id="mc-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <style>{SVG_STYLE}</style>

      {/* Horizontal grid */}
      {yTicks.map((v) => (
        <line
          key={`gy-${v}`}
          x1={CHART_X}
          y1={yOf(v)}
          x2={CHART_X + CHART_W}
          y2={yOf(v)}
          stroke={CLR.grid}
          strokeWidth={0.7}
        />
      ))}

      {/* Vertical grid */}
      {xTicks.map((d) => (
        <line
          key={`gx-${d}`}
          x1={xOf(d, maxDay)}
          y1={CHART_Y}
          x2={xOf(d, maxDay)}
          y2={CHART_Y + CHART_H}
          stroke={CLR.grid}
          strokeWidth={0.5}
        />
      ))}

      {/* Axes */}
      <line
        x1={CHART_X}
        y1={CHART_Y + CHART_H}
        x2={CHART_X + CHART_W}
        y2={CHART_Y + CHART_H}
        stroke={CLR.axis}
        strokeWidth={1}
      />
      <line
        x1={CHART_X}
        y1={CHART_Y}
        x2={CHART_X}
        y2={CHART_Y + CHART_H}
        stroke={CLR.axis}
        strokeWidth={1}
      />

      {/* Y-axis labels */}
      {yTicks.map((v) => (
        <text
          key={`yl-${v}`}
          x={CHART_X - 8}
          y={yOf(v) + 3.5}
          textAnchor="end"
          fill={CLR.label}
          fontSize={10}
          fontFamily="system-ui, sans-serif"
        >
          {Math.round(v * 100)}%
        </text>
      ))}

      {/* X-axis labels */}
      {xTicks.map((d) => (
        <text
          key={`xl-${d}`}
          x={xOf(d, maxDay)}
          y={CHART_Y + CHART_H + 16}
          textAnchor="middle"
          fill={CLR.label}
          fontSize={10}
          fontFamily="system-ui, sans-serif"
        >
          {d}
        </text>
      ))}

      {/* X-axis unit */}
      <text
        x={CHART_X + CHART_W}
        y={CHART_Y + CHART_H + 30}
        textAnchor="end"
        fill={CLR.labelLight}
        fontSize={10}
        fontFamily="system-ui, sans-serif"
        fontStyle="italic"
      >
        gun
      </text>

      {/* 90% retention threshold */}
      <g className="mc-threshold">
        <line
          x1={CHART_X}
          y1={yOf(0.9)}
          x2={CHART_X + CHART_W}
          y2={yOf(0.9)}
          stroke={CLR.threshold}
          strokeWidth={0.8}
          strokeDasharray="4 4"
          opacity={0.6}
        />
        <text
          x={CHART_X + CHART_W + 2}
          y={yOf(0.9) + 3}
          textAnchor="start"
          fill={CLR.threshold}
          fontSize={8.5}
          fontFamily="system-ui, sans-serif"
          opacity={0.8}
        >
          %90
        </text>
      </g>

      {/* No-review forgetting curve */}
      <path
        d={paths.noReview}
        fill="none"
        stroke={CLR.noReview}
        strokeWidth={1.6}
        strokeDasharray="6 4"
        strokeLinecap="round"
        className="mc-no-review"
      />

      {/* SM-2 area fill */}
      <path
        d={paths.area}
        fill="url(#mc-area-grad)"
        stroke="none"
        className="mc-area"
      />

      {/* SM-2 solid curve */}
      <path
        d={paths.solid}
        fill="none"
        stroke="url(#mc-line-grad)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mc-sm2"
      />

      {/* Projected decay */}
      {paths.projected && (
        <path
          d={paths.projected}
          fill="none"
          stroke={CLR.projected}
          strokeWidth={1.5}
          strokeDasharray="5 4"
          strokeLinecap="round"
          className="mc-proj"
        />
      )}

      {/* Review dots */}
      {reviews.map((rv, i) => {
        const cx = xOf(rv.day, maxDay);
        const cy = yOf(1);
        const delay = 0.5 + i * 0.22;
        const tip =
          i === 0
            ? 'Learning (Start)'
            : `Review #${i + 1} - ${rv.interval < 10 ? rv.interval.toFixed(1) : Math.round(rv.interval)} day interval`;

        return (
          <g key={`dot-${i}`}>
            {i === reviews.length - 1 && (
              <circle
                cx={cx}
                cy={cy}
                r={5}
                fill="none"
                stroke={CLR.dotGlow}
                strokeWidth={1.5}
                className="mc-dot-ring"
                style={{ animationDelay: `${delay + 0.6}s` }}
              />
            )}

            <circle
              cx={cx}
              cy={cy}
              r={4.5}
              fill={CLR.dot}
              stroke="#fff"
              strokeWidth={1.5}
              filter="url(#mc-glow)"
              className="mc-dot"
              style={{
                animationDelay: `${delay}s`,
                transformOrigin: `${cx}px ${cy}px`,
              }}
            >
              <title>{tip}</title>
            </circle>

            {i > 0 && i < reviews.length - 1 && (
              <text
                x={cx}
                y={cy - 12}
                textAnchor="middle"
                fill={CLR.label}
                fontSize={8}
                fontFamily="system-ui, sans-serif"
                fontWeight={500}
                className="mc-label"
                style={{ animationDelay: `${delay + 0.3}s` }}
              >
                {rv.interval < 10
                  ? `${rv.interval.toFixed(1)}g`
                  : `${Math.round(rv.interval)}g`}
              </text>
            )}
          </g>
        );
      })}

      {/* Personalization badge */}
      {hasProgress && (
        <g className="mc-label" style={{ animationDelay: '1.8s' }}>
          <rect
            x={CHART_X + CHART_W - 170}
            y={CHART_Y + 2}
            width={165}
            height={20}
            rx={4}
            fill="rgba(59,130,246,0.08)"
            stroke="rgba(59,130,246,0.2)"
            strokeWidth={0.5}
          />
          <text
            x={CHART_X + CHART_W - 87}
            y={CHART_Y + 15}
            textAnchor="middle"
            fill={CLR.sm2Stroke}
            fontSize={9}
            fontFamily="system-ui, sans-serif"
            fontWeight={600}
          >
            Kolaylik {ease.toFixed(1)} - Aralik {interval}g
          </text>
        </g>
      )}

      {/* Legend */}
      <g className="mc-legend">
        <line
          x1={CHART_X}
          y1={VB_H - 22}
          x2={CHART_X + 24}
          y2={VB_H - 22}
          stroke={CLR.noReview}
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
        <text
          x={CHART_X + 28}
          y={VB_H - 19}
          fill={CLR.label}
          fontSize={9}
          fontFamily="system-ui, sans-serif"
        >
          Tekrar Yok
        </text>

        <line
          x1={CHART_X + 105}
          y1={VB_H - 22}
          x2={CHART_X + 129}
          y2={VB_H - 22}
          stroke={CLR.sm2Stroke}
          strokeWidth={2.2}
        />
        <text
          x={CHART_X + 133}
          y={VB_H - 19}
          fill={CLR.label}
          fontSize={9}
          fontFamily="system-ui, sans-serif"
        >
          SM-2 Aralikli Tekrar
        </text>

        <circle
          cx={CHART_X + 277}
          cy={VB_H - 22}
          r={3.5}
          fill={CLR.dot}
          stroke="#fff"
          strokeWidth={1}
        />
        <text
          x={CHART_X + 285}
          y={VB_H - 19}
          fill={CLR.label}
          fontSize={9}
          fontFamily="system-ui, sans-serif"
        >
          Tekrar Noktasi
        </text>

        <line
          x1={CHART_X + 380}
          y1={VB_H - 22}
          x2={CHART_X + 404}
          y2={VB_H - 22}
          stroke={CLR.projected}
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
        <text
          x={CHART_X + 408}
          y={VB_H - 19}
          fill={CLR.label}
          fontSize={9}
          fontFamily="system-ui, sans-serif"
        >
          Tahmini Egilim
        </text>

        <line
          x1={CHART_X + 510}
          y1={VB_H - 22}
          x2={CHART_X + 534}
          y2={VB_H - 22}
          stroke={CLR.threshold}
          strokeWidth={1}
          strokeDasharray="3 3"
          opacity={0.7}
        />
        <text
          x={CHART_X + 538}
          y={VB_H - 19}
          fill={CLR.label}
          fontSize={9}
          fontFamily="system-ui, sans-serif"
        >
          Hedef %90
        </text>
      </g>
    </svg>
  );
}
