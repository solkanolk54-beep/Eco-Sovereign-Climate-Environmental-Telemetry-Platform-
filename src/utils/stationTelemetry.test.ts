import test from 'node:test';
import assert from 'node:assert/strict';
import { SEED_STATIONS } from '../data/seedData';
import {
  HISTORY_MAX_POINTS,
  appendStationHistoryPoint,
  buildSparklineGeometry,
  computeNextStationReading,
  generateInitial60MinHistory,
} from './stationTelemetry';

test('generateInitial60MinHistory seeds 60 one-minute points per station', () => {
  const now = Date.UTC(2026, 10, 12, 12, 0, 0);
  const history = generateInitial60MinHistory(SEED_STATIONS, now);
  for (const st of SEED_STATIONS) {
    const series = history[st.station_code];
    assert.ok(Array.isArray(series));
    assert.equal(series.length, HISTORY_MAX_POINTS);
    assert.equal(series[series.length - 1].timestamp, new Date(now).toISOString());
    assert.equal(series[0].timestamp, new Date(now - 59 * 60_000).toISOString());
  }
});

test('appendStationHistoryPoint is idempotent and enforces 60-minute window', () => {
  const baseMs = Date.UTC(2026, 10, 12, 12, 0, 0);
  const oldPoint = {
    timestamp: new Date(baseMs - 65 * 60_000).toISOString(),
    temperature: 30,
    humidity: 40,
  };
  const recentPoint = {
    timestamp: new Date(baseMs - 10 * 60_000).toISOString(),
    temperature: 32,
    humidity: 38,
  };
  const nextPoint = {
    timestamp: new Date(baseMs).toISOString(),
    temperature: 33,
    humidity: 36,
  };

  const updated = appendStationHistoryPoint([oldPoint, recentPoint], nextPoint);
  assert.equal(updated.length, 2); // oldPoint (>60m) pruned
  assert.equal(updated[0].timestamp, recentPoint.timestamp);

  // Duplicate timestamp should not add a duplicate item
  const deduped = appendStationHistoryPoint(updated, nextPoint);
  assert.equal(deduped.length, 2);
});

test('computeNextStationReading stays within physical bounds', () => {
  const st = SEED_STATIONS[0];
  const reading = computeNextStationReading(
    st,
    { timestamp: new Date().toISOString(), temperature: 42.5, humidity: 17.0 },
    Date.UTC(2026, 10, 12, 12, 5, 0)
  );
  assert.ok(reading.temperature >= -5 && reading.temperature <= 58);
  assert.ok(reading.humidity >= 5 && reading.humidity <= 98);
});

test('buildSparklineGeometry computes normalized path, min/max, and delta', () => {
  const geo = buildSparklineGeometry([20, 22, 25, 24], 200, 50, 5);
  assert.equal(geo.min, 20);
  assert.equal(geo.max, 25);
  assert.equal(geo.current, 24);
  assert.equal(geo.delta, 4);
  assert.equal(geo.points.length, 4);
  assert.ok(geo.linePath.startsWith('M5,45'));
  assert.ok(geo.areaPath.endsWith('Z'));

  // Flat line handles zero range without NaN
  const flat = buildSparklineGeometry([30, 30, 30], 200, 50, 5);
  assert.equal(flat.delta, 0);
  assert.ok(!flat.linePath.includes('NaN'));
});
