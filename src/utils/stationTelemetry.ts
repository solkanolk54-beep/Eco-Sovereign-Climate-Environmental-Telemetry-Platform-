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

export interface SparklineGeometry {
  linePath: string;
  areaPath: string;
  points: Array<{ x: number; y: number; value: number }>;
  min: number;
  max: number;
  current: number;
  delta: number;
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

  const coords = values.map((val, idx) => {
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

  const linePath = coords
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'}${pt.x},${pt.y}`)
    .join(' ');

  const bottomY = Number((height - padding).toFixed(2));
  const areaPath =
    coords.length > 0
      ? `${linePath} L${coords[coords.length - 1].x},${bottomY} L${coords[0].x},${bottomY} Z`
      : '';

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
