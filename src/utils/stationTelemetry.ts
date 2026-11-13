import type { StationHistoryMap, StationReadingPoint, TelemetryStation } from '../types/telemetry';

export const HISTORY_WINDOW_MINUTES = 60;
export const HISTORY_MAX_POINTS = 60;

/**
 * Generates an initial 60-minute rolling history (1-minute cadence, 60 points)
 * anchored to each station's baseline meteorological values.
 */
export function generateInitial60MinHistory(
  stations: TelemetryStation[],
  nowMs: number = Date.now()
): StationHistoryMap {
  const history: StationHistoryMap = {};

  stations.forEach((station, stationIdx) => {
    const points: StationReadingPoint[] = [];
    for (let i = HISTORY_MAX_POINTS - 1; i >= 0; i--) {
      const ts = new Date(nowMs - i * 60_000).toISOString();
      const phase = (HISTORY_MAX_POINTS - i) * 0.18 + stationIdx * 1.3;
      const tempDrift = Math.sin(phase) * 0.85 + Math.cos(phase * 0.4) * 0.35;
      const humDrift = -Math.sin(phase) * 2.1 + Math.cos(phase * 0.5) * 0.9;

      const temperature = Number((station.temperature + tempDrift).toFixed(2));
      const humidity = Number(
        Math.max(5, Math.min(98, station.humidity + humDrift)).toFixed(1)
      );

      points.push({
        timestamp: ts,
        temperature,
        humidity,
      });
    }
    history[station.station_code] = points;
  });

  return history;
}

/**
 * Produces the next realistic sensor telemetry reading from the previous reading
 * and current station baseline, keeping values bounded and meteorologically coupled.
 */
export function computeNextStationReading(
  station: TelemetryStation,
  prev: StationReadingPoint | undefined,
  nowMs: number = Date.now(),
  seedOffset: number = 0
): StationReadingPoint {
  const baseTemp = prev ? prev.temperature : station.temperature;
  const baseHum = prev ? prev.humidity : station.humidity;

  // Deterministic-friendly oscillation combined with subtle mean reversion toward station baseline
  const tWave = Math.sin(nowMs / 15_000 + station.id * 1.7 + seedOffset) * 0.32;
  const meanRevertTemp = (station.temperature - baseTemp) * 0.15;
  const temperature = Number(
    Math.max(-5, Math.min(58, baseTemp + tWave + meanRevertTemp)).toFixed(2)
  );

  // Inverse temp-humidity coupling
  const hWave = -tWave * 2.4 + Math.cos(nowMs / 21_000 + station.id) * 0.6;
  const meanRevertHum = (station.humidity - baseHum) * 0.15;
  const humidity = Number(
    Math.max(5, Math.min(98, baseHum + hWave + meanRevertHum)).toFixed(1)
  );

  return {
    timestamp: new Date(nowMs).toISOString(),
    temperature,
    humidity,
  };
}

/**
 * Idempotently appends a reading point and prunes points older than 60 minutes
 * (and caps at HISTORY_MAX_POINTS).
 */
export function appendStationHistoryPoint(
  existing: StationReadingPoint[],
  nextPoint: StationReadingPoint,
  maxPoints: number = HISTORY_MAX_POINTS
): StationReadingPoint[] {
  if (existing.some((pt) => pt.timestamp === nextPoint.timestamp)) {
    return existing;
  }

  const nextMs = Date.parse(nextPoint.timestamp);
  const cutoffMs = Number.isFinite(nextMs) ? nextMs - HISTORY_WINDOW_MINUTES * 60_000 : 0;

  const combined = [...existing, nextPoint].filter((pt) => {
    const ptMs = Date.parse(pt.timestamp);
    return !Number.isFinite(ptMs) || !Number.isFinite(nextMs) || ptMs >= cutoffMs;
  });

  if (combined.length > maxPoints) {
    return combined.slice(combined.length - maxPoints);
  }
  return combined;
}

export interface SparklineCoord {
  x: number;
  y: number;
  value: number;
}

export interface SparklineGeometry {
  linePath: string;
  areaPath: string;
  points: SparklineCoord[];
  min: number;
  max: number;
  current: number;
  delta: number;
}

/**
 * Builds SVG line and area path strings from precomputed sparkline coordinates.
 */
export function buildSparklinePaths(
  coords: SparklineCoord[],
  height: number = 56,
  padding: number = 4
): { linePath: string; areaPath: string } {
  if (coords.length === 0) {
    return { linePath: '', areaPath: '' };
  }

  const linePath = coords
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'}${Number(pt.x.toFixed(2))},${Number(pt.y.toFixed(2))}`)
    .join(' ');

  const bottomY = Number((height - padding).toFixed(2));
  const areaPath = `${linePath} L${Number(coords[coords.length - 1].x.toFixed(2))},${bottomY} L${Number(coords[0].x.toFixed(2))},${bottomY} Z`;

  return { linePath, areaPath };
}

/**
 * Cubic ease-out curve clamped to [0, 1].
 */
export function easeOutCubic(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - clamped, 3);
}

/**
 * Smoothly interpolates between two sparkline coordinate arrays (resampling if lengths differ).
 */
export function interpolateSparklineCoords(
  from: SparklineCoord[],
  to: SparklineCoord[],
  t: number
): SparklineCoord[] {
  if (to.length === 0) return [];
  const clampedT = Math.max(0, Math.min(1, t));
  if (clampedT >= 1 || from.length === 0) {
    return to;
  }

  const maxFromIdx = Math.max(0, from.length - 1);
  const maxToIdx = Math.max(1, to.length - 1);

  return to.map((target, idx) => {
    const mappedIdx =
      from.length === to.length ? idx : (idx / maxToIdx) * maxFromIdx;
    const lowIdx = Math.floor(mappedIdx);
    const highIdx = Math.min(maxFromIdx, Math.ceil(mappedIdx));
    const frac = mappedIdx - lowIdx;

    const a = from[lowIdx];
    const b = from[highIdx];
    const startX = a.x + (b.x - a.x) * frac;
    const startY = a.y + (b.y - a.y) * frac;
    const startVal = a.value + (b.value - a.value) * frac;

    return {
      x: Number((startX + (target.x - startX) * clampedT).toFixed(2)),
      y: Number((startY + (target.y - startY) * clampedT).toFixed(2)),
      value: Number((startVal + (target.value - startVal) * clampedT).toFixed(2)),
    };
  });
}

/**
 * Computes normalized SVG polyline and area paths plus summary stats for a sparkline.
 */
export function buildSparklineGeometry(
  values: number[],
  width: number = 240,
  height: number = 56,
  padding: number = 4
): SparklineGeometry {
  if (values.length === 0) {
    return {
      linePath: '',
      areaPath: '',
      points: [],
      min: 0,
      max: 0,
      current: 0,
      delta: 0,
    };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const current = values[values.length - 1];
  const first = values[0];
  const delta = Number((current - first).toFixed(2));
  const range = max - min;

  const innerW = Math.max(1, width - padding * 2);
  const innerH = Math.max(1, height - padding * 2);

  const coords: SparklineCoord[] = values.map((val, idx) => {
    const x =
      values.length === 1
        ? padding + innerW / 2
        : padding + (idx / (values.length - 1)) * innerW;
    const norm = range === 0 ? 0.5 : (val - min) / range;
    const y = padding + innerH - norm * innerH;
    return {
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
      value: val,
    };
  });

  const { linePath, areaPath } = buildSparklinePaths(coords, height, padding);

  return {
    linePath,
    areaPath,
    points: coords,
    min,
    max,
    current,
    delta,
  };
}
