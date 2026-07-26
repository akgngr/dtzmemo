'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================================
// Types
// ============================================================

interface CardProgressData {
  ease: number;
  interval: number;
  nextReview: number;
  correct: number;
  wrong: number;
}

interface MemoryCurveChartProps {
  cardProgress: Record<string, CardProgressData>;
  className?: string;
}

// ============================================================
// Constants
// ============================================================

/** Number of simulated review points along the curve. */
const NUM_REVIEWS = 4;
/** Stability multiplier: S = ease * EASE_TO_STABILITY. */
const EASE_TO_STABILITY = 5;
/** Ease bump applied after each successful review (slows the next decline). */
const EASE_BUMP = 0.2;
/** Sample points per curve segment for smooth rendering. */
const PTS_PER_SEGMENT = 28;

// SVG layout — chart area ~300x180 inside a responsive viewBox.
const VB_W = 380;
const VB_H = 240;
const MARGIN = { top: 20, right: 24, bottom: 44, left: 44 };
const CHART_X = MARGIN.left;
const CHART_Y = MARGIN.top;
const CHART_W = VB_W - MARGIN.left - MARGIN.right;
const CHART_H = VB_H - MARGIN.top - MARGIN.bottom;

// Palette (no blue except the explicitly-requested 80% target line).
const CLR = {
  curveStart: '#f97316', // orange-500
  curveEnd: '#ef4444', // red-500
  areaFill: 'rgba(249,115,22,0.10)',
  review: '#10b981', // emerald-500
  reviewGlow: 'rgba(16,185,129,0.30)',
  grid: '#e5e7eb', // gray-200
  axis: '#cbd5e1', // slate-300
  label: '#64748b', // slate-500
  labelSoft: '#94a3b8', // slate-400
  target: '#3b82f6', // blue-500 (explicitly requested for the 80% line)
  targetSoft: 'rgba(59,130,246,0.10)',
};

// Retention threshold that reviews aim to defend.
const TARGET_RETENTION = 0.8;
// Y-axis ticks (retention 0..1).
const Y_TICKS = [0, 0.2, 0.4, 0.6, 0.8, 1.0];

// ============================================================
// Helpers
// ============================================================

/** Convert a day value to an SVG x coordinate. */
function xOf(day: number, maxDay: number): number {
  return CHART_X + (day / maxDay) * CHART_W;
}

/** Convert a retention value (0..1) to an SVG y coordinate. */
function yOf(retention: number): number {
  return CHART_Y + CHART_H * (1 - retention);
}

/** Generate "nice" tick values for the X axis between 0 and max. */
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
  while (v < max - step * 0.01) {
    ticks.push(Number(v.toFixed(2)));
    v += step;
  }
  if (ticks[ticks.length - 1] !== max) ticks.push(Number(max.toFixed(2)));
  return ticks;
}

/** Round a day value to a compact display string. */
function fmtDay(d: number): string {
  return d < 10 ? d.toFixed(1).replace(/\.0$/, '') : Math.round(d).toString();
}

interface CurveSegment {
  startDay: number;
  endDay: number;
  stability: number;
  ease: number;
}

interface CurveModel {
  segments: CurveSegment[];
  reviewDays: number[];
  declinePaths: string[];
  areaPaths: string[];
  jumpLines: { day: number; rBefore: number }[];
  maxDay: number;
  finalRetention: number;
}

/**
 * Build a simulated forgetting-curve model from the average SM-2 stats.
 *
 * R(t) = e^(-(t - t0) / S), where S = ease * 5. After each review the ease
 * factor is bumped slightly, so every subsequent decline is slower — this is
 * the core visual story of spaced repetition.
 */
function buildCurveModel(avgEase: number, avgInterval: number): CurveModel {
  const baseEase = Math.min(Math.max(avgEase, 1.3), 5.0);
  const baseInterval = Math.max(1, avgInterval);

  // Review points evenly spaced at multiples of the average interval.
  const reviewDays: number[] = [];
  for (let i = 1; i <= NUM_REVIEWS; i++) reviewDays.push(baseInterval * i);

  // Segment boundaries: 0 -> I -> 2I -> ... -> (NUM_REVIEWS+1)*I
  const boundaries = [...reviewDays, reviewDays[NUM_REVIEWS - 1] + baseInterval];

  const segments: CurveSegment[] = [];
  let ease = baseEase;
  let prevEnd = 0;
  for (let i = 0; i < boundaries.length; i++) {
    const endDay = boundaries[i];
    segments.push({
      startDay: prevEnd,
      endDay,
      stability: ease * EASE_TO_STABILITY,
      ease,
    });
    prevEnd = endDay;
    ease = Math.min(ease + EASE_BUMP, 5.0);
  }

  const maxDay = boundaries[boundaries.length - 1];

  // Decline path + area path per segment.
  const declinePaths: string[] = [];
  const areaPaths: string[] = [];

  for (const seg of segments) {
    const top: string[] = [];
    for (let i = 0; i <= PTS_PER_SEGMENT; i++) {
      const t = seg.startDay + (seg.endDay - seg.startDay) * (i / PTS_PER_SEGMENT);
      const r = Math.exp(-(t - seg.startDay) / seg.stability);
      const cmd = i === 0 ? 'M' : 'L';
      top.push(`${cmd}${xOf(t, maxDay).toFixed(2)} ${yOf(r).toFixed(2)}`);
    }
    declinePaths.push(top.join(' '));

    const area =
      top.join(' ') +
      ` L${xOf(seg.endDay, maxDay).toFixed(2)} ${yOf(0).toFixed(2)}` +
      ` L${xOf(seg.startDay, maxDay).toFixed(2)} ${yOf(0).toFixed(2)} Z`;
    areaPaths.push(area);
  }

  // Jump lines: vertical green lines from the pre-review retention back up
  // to 100% at each review day.
  const jumpLines = reviewDays.map((day, idx) => {
    const seg = segments[idx]; // segment that ends at this review day
    const rBefore = Math.exp(-(seg.endDay - seg.startDay) / seg.stability);
    return { day, rBefore };
  });

  const lastSeg = segments[segments.length - 1];
  const finalRetention = Math.exp(
    -(lastSeg.endDay - lastSeg.startDay) / lastSeg.stability,
  );

  return {
    segments,
    reviewDays,
    declinePaths,
    areaPaths,
    jumpLines,
    maxDay,
    finalRetention,
  };
}

// ============================================================
// Component
// ============================================================

export function MemoryCurveChart({
  cardProgress,
  className,
}: MemoryCurveChartProps) {
  // ----------------------------------------------------------
  // Aggregate SM-2 stats from reviewed cards (correct > 0).
  // ----------------------------------------------------------
  const { avgEase, avgInterval, hasData, reviewedCount } = useMemo(() => {
    const reviewed = Object.values(cardProgress).filter((p) => p.correct > 0);
    if (reviewed.length === 0) {
      return { avgEase: 2.5, avgInterval: 3, hasData: false, reviewedCount: 0 };
    }
    const totalEase = reviewed.reduce((s, p) => s + p.ease, 0);
    const totalInterval = reviewed.reduce((s, p) => s + p.interval, 0);
    return {
      avgEase: totalEase / reviewed.length,
      avgInterval: Math.max(1, totalInterval / reviewed.length),
      hasData: true,
      reviewedCount: reviewed.length,
    };
  }, [cardProgress]);

  // ----------------------------------------------------------
  // Build the simulated curve model.
  // ----------------------------------------------------------
  const model = useMemo(
    () => buildCurveModel(avgEase, avgInterval),
    [avgEase, avgInterval],
  );

  const xTicks = useMemo(() => niceTicks(model.maxDay, 5), [model.maxDay]);

  // Shared animation timing so segments, jumps and dots cascade left-to-right.
  const segDuration = 0.55;
  const segStagger = 0.32;

  return (
    <div
      className={cn(
        'rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-100',
        className,
      )}
    >
      {/* Header */}
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-800">
          Unutma Eğrisi
        </h3>
        {hasData ? (
          <span className="text-[11px] text-slate-400 tabular-nums">
            {reviewedCount} kart · kolaylık {avgEase.toFixed(2)} · aralık{' '}
            {fmtDay(avgInterval)}g
          </span>
        ) : (
          <span className="text-[11px] text-slate-400">örnek eğri</span>
        )}
      </div>

      {/* Chart */}
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-auto w-full"
        role="img"
        aria-label="Unutma eğrisi ve tekrar noktalarını gösteren grafik"
      >
        <defs>
          <linearGradient
            id="mc-curve-grad"
            gradientUnits="userSpaceOnUse"
            x1={CHART_X}
            y1={0}
            x2={CHART_X + CHART_W}
            y2={0}
          >
            <stop offset="0%" stopColor={CLR.curveStart} />
            <stop offset="100%" stopColor={CLR.curveEnd} />
          </linearGradient>
          <filter id="mc-dot-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ---- Horizontal grid lines (dashed) ---- */}
        {Y_TICKS.map((v) => (
          <line
            key={`hgrid-${v}`}
            x1={CHART_X}
            y1={yOf(v)}
            x2={CHART_X + CHART_W}
            y2={yOf(v)}
            stroke={CLR.grid}
            strokeWidth={0.7}
            strokeDasharray="3 3"
          />
        ))}

        {/* ---- Vertical grid lines (dashed) ---- */}
        {xTicks.map((d) => (
          <line
            key={`vgrid-${d}`}
            x1={xOf(d, model.maxDay)}
            y1={CHART_Y}
            x2={xOf(d, model.maxDay)}
            y2={CHART_Y + CHART_H}
            stroke={CLR.grid}
            strokeWidth={0.6}
            strokeDasharray="3 3"
          />
        ))}

        {/* ---- Target band (80%) ---- */}
        <motion.rect
          x={CHART_X}
          y={yOf(TARGET_RETENTION)}
          width={CHART_W}
          height={yOf(0) - yOf(TARGET_RETENTION)}
          fill={CLR.targetSoft}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        />

        {/* ---- Area fills under each declining segment ---- */}
        {model.areaPaths.map((d, i) => (
          <motion.path
            key={`area-${i}`}
            d={d}
            fill={CLR.areaFill}
            stroke="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: i * segStagger + 0.1 }}
          />
        ))}

        {/* ---- Declining forgetting-curve segments (orange → red) ---- */}
        {model.declinePaths.map((d, i) => (
          <motion.path
            key={`decline-${i}`}
            d={d}
            fill="none"
            stroke="url(#mc-curve-grad)"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: segDuration,
              delay: i * segStagger,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* ---- Vertical "jump back up" lines at each review ---- */}
        {model.jumpLines.map((jl, i) => {
          const cx = xOf(jl.day, model.maxDay);
          const yTop = yOf(1);
          const yBottom = yOf(jl.rBefore);
          const delay = (i + 1) * segStagger - 0.12;
          return (
            <motion.line
              key={`jump-${i}`}
              x1={cx}
              y1={yBottom}
              x2={cx}
              y2={yTop}
              stroke={CLR.review}
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeDasharray="4 3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.85 }}
              transition={{ duration: 0.3, delay, ease: 'easeOut' }}
            />
          );
        })}

        {/* ---- Review dots (green, at the top of each jump) ---- */}
        {model.reviewDays.map((day, i) => {
          const cx = xOf(day, model.maxDay);
          const cy = yOf(1);
          const delay = (i + 1) * segStagger - 0.02;
          return (
            <motion.g
              key={`dot-${i}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.35,
                delay,
                type: 'spring',
                stiffness: 320,
                damping: 18,
              }}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            >
              <circle
                cx={cx}
                cy={cy}
                r={6.5}
                fill={CLR.reviewGlow}
                stroke="none"
              />
              <circle
                cx={cx}
                cy={cy}
                r={4}
                fill={CLR.review}
                stroke="#ffffff"
                strokeWidth={1.4}
                filter="url(#mc-dot-glow)"
              >
                <title>{`Tekrar ${i + 1} · ${fmtDay(day)}. gün`}</title>
              </circle>
            </motion.g>
          );
        })}

        {/* ---- Target line at 80% (blue dashed) ---- */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <line
            x1={CHART_X}
            y1={yOf(TARGET_RETENTION)}
            x2={CHART_X + CHART_W}
            y2={yOf(TARGET_RETENTION)}
            stroke={CLR.target}
            strokeWidth={1.1}
            strokeDasharray="5 4"
            opacity={0.9}
          />
          <text
            x={CHART_X + CHART_W - 2}
            y={yOf(TARGET_RETENTION) - 4}
            textAnchor="end"
            fill={CLR.target}
            fontSize={9}
            fontWeight={600}
            fontFamily="system-ui, sans-serif"
          >
            Hedef: %80
          </text>
        </motion.g>

        {/* ---- Axes ---- */}
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

        {/* ---- Y-axis tick labels ---- */}
        {Y_TICKS.map((v) => (
          <text
            key={`yl-${v}`}
            x={CHART_X - 8}
            y={yOf(v) + 3.2}
            textAnchor="end"
            fill={CLR.label}
            fontSize={9}
            fontFamily="system-ui, sans-serif"
          >
            {Math.round(v * 100)}
          </text>
        ))}

        {/* ---- X-axis tick labels ---- */}
        {xTicks.map((d) => (
          <text
            key={`xl-${d}`}
            x={xOf(d, model.maxDay)}
            y={CHART_Y + CHART_H + 15}
            textAnchor="middle"
            fill={CLR.label}
            fontSize={9}
            fontFamily="system-ui, sans-serif"
          >
            {fmtDay(d)}
          </text>
        ))}

        {/* ---- Axis unit labels ---- */}
        <text
          x={CHART_X + CHART_W}
          y={CHART_Y + CHART_H + 30}
          textAnchor="end"
          fill={CLR.labelSoft}
          fontSize={9.5}
          fontStyle="italic"
          fontFamily="system-ui, sans-serif"
        >
          Gün
        </text>
        <text
          x={CHART_X - 8}
          y={CHART_Y - 8}
          textAnchor="end"
          fill={CLR.labelSoft}
          fontSize={9.5}
          fontStyle="italic"
          fontFamily="system-ui, sans-serif"
        >
          %
        </text>

        {/* ---- "Henüz veri yok" overlay note ---- */}
        {!hasData && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.4 }}
          >
            <rect
              x={CHART_X + CHART_W / 2 - 58}
              y={CHART_Y + CHART_H / 2 - 12}
              width={116}
              height={22}
              rx={6}
              fill="rgba(255,255,255,0.92)"
              stroke={CLR.grid}
              strokeWidth={0.8}
            />
            <text
              x={CHART_X + CHART_W / 2}
              y={CHART_Y + CHART_H / 2 + 3}
              textAnchor="middle"
              fill={CLR.label}
              fontSize={10}
              fontWeight={600}
              fontFamily="system-ui, sans-serif"
            >
              Henüz veri yok
            </text>
          </motion.g>
        )}
      </svg>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-[3px] w-4 rounded-full"
            style={{
              background: `linear-gradient(90deg, ${CLR.curveStart}, ${CLR.curveEnd})`,
            }}
          />
          Unutma Eğrisi
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ background: CLR.review }}
          />
          Tekrar Noktası
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-[2px] w-4"
            style={{
              background: `repeating-linear-gradient(90deg, ${CLR.target} 0 4px, transparent 4px 7px)`,
            }}
          />
          Hedef %80
        </span>
      </div>
    </div>
  );
}
