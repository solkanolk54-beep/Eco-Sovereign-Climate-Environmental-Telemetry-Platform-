import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import {
  CLIMATE_SERIES_10Y,
  CLIMATE_SERIES_1Y,
  CLIMATE_SERIES_30D,
  POSTGIS_SCHEMA_SQL,
  SEED_ANOMALIES,
  SEED_CORRIDORS,
  SEED_DISPATCH_ALERTS,
  SEED_FIELD_REPORTS,
  SEED_RESERVOIRS,
  SEED_STATIONS,
  SEED_WILAYAS,
} from './src/data/seedData';
import type {
  DispatchAlert,
  FieldReport,
  ReportCategory,
  SpatialAnomaly,
  StationHistoryMap,
  StationReadingPoint,
  TelemetryStation,
  VerificationStatus,
} from './src/types/telemetry';
import { calculateFireWeatherIndex, validateFieldReportPayload } from './src/utils/climateEngine';
import {
  appendStationHistoryPoint,
  computeNextStationReading,
  generateInitial60MinHistory,
} from './src/utils/stationTelemetry';

interface TelemetryStore {
  stations: TelemetryStation[];
  anomalies: SpatialAnomaly[];
  reports: FieldReport[];
  alerts: DispatchAlert[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const STORE_PATH = path.join(DATA_DIR, 'telemetry-store.json');

function loadStore(): TelemetryStore {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as TelemetryStore;
      if (parsed.stations && parsed.anomalies && parsed.reports && parsed.alerts) {
        return parsed;
      }
    }
  } catch {
    // Fall back to deterministic seed state
  }
  return {
    stations: structuredClone(SEED_STATIONS),
    anomalies: structuredClone(SEED_ANOMALIES),
    reports: structuredClone(SEED_FIELD_REPORTS),
    alerts: structuredClone(SEED_DISPATCH_ALERTS),
  };
}

function saveStore(store: TelemetryStore): void {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch {
    // Non-fatal in read-only edge cases
  }
}

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;
  const store = loadStore();
  const stationHistory: StationHistoryMap = generateInitial60MinHistory(store.stations, Date.now());
  const sseClients = new Set<express.Response>();

  app.use(express.json({ limit: '1mb' }));

  app.get('/api/v1/health', (_req, res) => {
    res.json({
      status: 'operational',
      service: 'Eco-Sovereign Climate & Environmental Telemetry API',
      timestamp: new Date().toISOString(),
      counts: {
        wilayas: SEED_WILAYAS.length,
        stations: store.stations.length,
        anomalies: store.anomalies.length,
        reservoirs: SEED_RESERVOIRS.length,
        reports: store.reports.length,
      },
    });
  });

  app.get('/api/v1/telemetry/overview', (_req, res) => {
    res.json({
      wilayas: SEED_WILAYAS,
      stations: store.stations,
      anomalies: store.anomalies,
      reservoirs: SEED_RESERVOIRS,
      reports: store.reports,
      alerts: store.alerts,
      corridors: SEED_CORRIDORS,
      series: {
        d30: CLIMATE_SERIES_30D,
        y1: CLIMATE_SERIES_1Y,
        y10: CLIMATE_SERIES_10Y,
      },
      stationHistory,
    });
  });

  app.get('/api/v1/telemetry/history', (_req, res) => {
    res.json({
      window_minutes: 60,
      history: stationHistory,
    });
  });

  app.get('/api/v1/telemetry/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    sseClients.add(res);
    res.write(
      `event: init\ndata: ${JSON.stringify({
        stations: store.stations,
        history: stationHistory,
      })}\n\n`
    );

    const keepAlive = setInterval(() => {
      res.write(': ping\n\n');
    }, 20_000);

    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.delete(res);
    });
  });

  app.get('/api/v1/anomalies', (req, res) => {
    const typeFilter = typeof req.query.type === 'string' ? req.query.type : 'ALL';
    const filtered =
      typeFilter === 'ALL'
        ? store.anomalies
        : store.anomalies.filter((item) => item.anomaly_type === typeFilter);
    res.json({ count: filtered.length, items: filtered });
  });

  app.post('/api/v1/telemetry/evaluate-fire-risk', (req, res) => {
    const body = req.body ?? {};
    const station_code = typeof body.station_code === 'string' ? body.station_code.trim() : 'CUSTOM-NODE';
    const temperature = Number(body.temperature);
    const humidity = Number(body.humidity);
    const wind_speed = Number(body.wind_speed);
    const fuel_dryness = Number(body.fuel_dryness);

    if (
      !Number.isFinite(temperature) ||
      !Number.isFinite(humidity) ||
      humidity < 0 ||
      humidity > 100 ||
      !Number.isFinite(wind_speed) ||
      wind_speed < 0 ||
      !Number.isFinite(fuel_dryness) ||
      fuel_dryness < 0
    ) {
      res.status(422).json({
        error: 'Invalid meteorological parameters. Ensure humidity is 0-100 and wind/dryness >= 0.',
      });
      return;
    }

    const result = calculateFireWeatherIndex({
      temperature,
      humidity,
      wind_speed,
      fuel_dryness,
    });

    const station = store.stations.find((s) => s.station_code === station_code);
    if (station) {
      station.temperature = temperature;
      station.humidity = humidity;
      station.wind_speed = wind_speed;
      station.fuel_dryness = fuel_dryness;
      station.last_ping = new Date().toISOString();
    }

    let createdAlert: DispatchAlert | null = null;
    if (result.alert_triggered) {
      createdAlert = {
        id: `ALT-${Date.now().toString().slice(-6)}`,
        station_code,
        fwi_score: result.fwi_score,
        severity: result.risk_code === 'extreme' ? 'extreme' : 'high',
        message_ar: `${result.risk_level_ar}: سُجلت قيمة ${result.fwi_score} في المحطة ${station_code}`,
        message_en: `${result.risk_level_en}: FWI score ${result.fwi_score} at station ${station_code}`,
        triggered_at: new Date().toISOString(),
        webhook_target: 'https://ops.ecoshield.dz/webhooks/civil-protection',
      };
      store.alerts.unshift(createdAlert);
      store.alerts = store.alerts.slice(0, 25);
    }

    saveStore(store);

    res.json({
      station_code,
      ...result,
      webhook_triggered: result.alert_triggered,
      dispatched_alert: createdAlert,
    });
  });

  app.post('/api/v1/reports/submit', (req, res) => {
    const body = req.body ?? {};
    const category = String(body.category ?? '');
    const details = String(body.details ?? '');
    const lat = Number(body.lat);
    const lng = Number(body.lng);
    const is_anonymous = body.is_anonymous !== false;
    const photo_attached = Boolean(body.photo_attached);
    const photo_name = typeof body.photo_name === 'string' ? body.photo_name : undefined;
    const synced_from_offline = Boolean(body.synced_from_offline);

    const validation = validateFieldReportPayload({ category, details, lat, lng });
    if (!validation.valid) {
      res.status(400).json({
        success: false,
        error: validation.error,
      });
      return;
    }

    const nextId = store.reports.reduce((max, r) => Math.max(max, r.id), 1041) + 1;
    const digest = crypto
      .createHash('sha256')
      .update(`${nextId}:${lat}:${lng}:${Date.now()}`)
      .digest('hex')
      .slice(0, 8)
      .toUpperCase();

    const newReport: FieldReport = {
      id: nextId,
      encrypted_hash: `AES-GCM-${digest}`,
      category: category as ReportCategory,
      details: details.trim(),
      lat: Number(lat.toFixed(5)),
      lng: Number(lng.toFixed(5)),
      wilaya_label: validation.isWithinAlgeriaBounds
        ? `${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E`
        : `External (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
      is_anonymous,
      photo_attached,
      photo_name,
      verification_status: 'pending_inspection',
      created_at: new Date().toISOString(),
      synced_from_offline,
    };

    store.reports.unshift(newReport);
    saveStore(store);

    res.status(201).json({
      success: true,
      is_within_algeria_bounds: validation.isWithinAlgeriaBounds,
      data: newReport,
    });
  });

  app.patch('/api/v1/reports/:id/status', (req, res) => {
    const id = Number(req.params.id);
    const status = String(req.body?.verification_status ?? '') as VerificationStatus;
    const allowed: VerificationStatus[] = [
      'pending_inspection',
      'under_inspection',
      'verified',
      'resolved',
    ];
    if (!allowed.includes(status)) {
      res.status(400).json({ error: 'Invalid verification_status' });
      return;
    }
    const report = store.reports.find((r) => r.id === id);
    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }
    report.verification_status = status;
    saveStore(store);
    res.json({ success: true, data: report });
  });

  app.get('/api/v1/schema/postgis', (_req, res) => {
    res.type('text/plain').send(POSTGIS_SCHEMA_SQL);
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Eco-Sovereign Telemetry server listening on http://localhost:${port}`);
  });

  // Server-authoritative sensor telemetry loop broadcasting live SSE readings
  const telemetryInterval = setInterval(() => {
    const nowMs = Date.now();
    const updates: Array<{
      station_code: string;
      reading: StationReadingPoint;
    }> = [];

    for (const station of store.stations) {
      if (!station.is_active) continue;
      const existing = stationHistory[station.station_code] ?? [];
      const prev = existing[existing.length - 1];
      const nextReading = computeNextStationReading(station, prev, nowMs);

      station.temperature = nextReading.temperature;
      station.humidity = nextReading.humidity;
      station.last_ping = nextReading.timestamp;

      stationHistory[station.station_code] = appendStationHistoryPoint(existing, nextReading);
      updates.push({
        station_code: station.station_code,
        reading: nextReading,
      });
    }

    if (sseClients.size > 0 && updates.length > 0) {
      const payload = `event: station:tick\ndata: ${JSON.stringify({ updates })}\n\n`;
      for (const client of sseClients) {
        client.write(payload);
      }
    }
  }, 4000);

  server.on('close', () => {
    clearInterval(telemetryInterval);
  });
}

startServer();
