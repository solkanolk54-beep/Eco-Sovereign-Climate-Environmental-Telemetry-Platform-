import React, { useCallback, useEffect, useState } from 'react';
import { ArchitectureApiView } from './components/ArchitectureApiView';
import { AnalyticsSimulatorView } from './components/AnalyticsSimulatorView';
import { DashboardWidget, type StreamConnectionState } from './components/DashboardWidget';
import { FieldReportModal } from './components/FieldReportModal';
import { HydrologyGridView } from './components/HydrologyGridView';
import { TacticalGisMap } from './components/TacticalGisMap';
import { TopHeader } from './components/TopHeader';
import { WildfireShieldView } from './components/WildfireShieldView';
import { WorkspaceToolbar } from './components/WorkspaceToolbar';
import {
  CLIMATE_SERIES_10Y,
  CLIMATE_SERIES_1Y,
  CLIMATE_SERIES_30D,
  SEED_ANOMALIES,
  SEED_CORRIDORS,
  SEED_DISPATCH_ALERTS,
  SEED_FIELD_REPORTS,
  SEED_RESERVOIRS,
  SEED_STATIONS,
  SEED_WILAYAS,
} from './data/seedData';
import { TRANSLATIONS } from './i18n/translations';
import type {
  ClimateSeriesPoint,
  DispatchAlert,
  FieldReport,
  FwiResult,
  GeoJsonCorridors,
  Language,
  ModuleId,
  OfflineQueuedReport,
  ReportCategory,
  SpatialAnomaly,
  StationHistoryMap,
  StationReadingPoint,
  TelemetryStation,
  VerificationStatus,
  WaterReservoir,
  WilayaMetric,
} from './types/telemetry';
import {
  appendStationHistoryPoint,
  generateInitial60MinHistory,
} from './utils/stationTelemetry';

const OFFLINE_QUEUE_KEY = 'eco_sovereign_offline_reports_v1';

function loadOfflineQueue(): OfflineQueuedReport[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [language, setLanguage] = useState<Language>('ar');
  const [activeModule, setActiveModule] = useState<ModuleId>('gis');
  const [isOfflineSimulated, setIsOfflineSimulated] = useState<boolean>(false);

  const [wilayas, setWilayas] = useState<WilayaMetric[]>(SEED_WILAYAS);
  const [stations, setStations] = useState<TelemetryStation[]>(SEED_STATIONS);
  const [anomalies, setAnomalies] = useState<SpatialAnomaly[]>(SEED_ANOMALIES);
  const [reservoirs, setReservoirs] = useState<WaterReservoir[]>(SEED_RESERVOIRS);
  const [reports, setReports] = useState<FieldReport[]>(SEED_FIELD_REPORTS);
  const [alerts, setAlerts] = useState<DispatchAlert[]>(SEED_DISPATCH_ALERTS);
  const [corridors, setCorridors] = useState<GeoJsonCorridors>(SEED_CORRIDORS);
  const [series, setSeries] = useState<{
    d30: ClimateSeriesPoint[];
    y1: ClimateSeriesPoint[];
    y10: ClimateSeriesPoint[];
  }>({
    d30: CLIMATE_SERIES_30D,
    y1: CLIMATE_SERIES_1Y,
    y10: CLIMATE_SERIES_10Y,
  });
  const [stationHistory, setStationHistory] = useState<StationHistoryMap>(() =>
    generateInitial60MinHistory(SEED_STATIONS)
  );
  const [streamStatus, setStreamStatus] = useState<StreamConnectionState>('connecting');

  const [offlineQueue, setOfflineQueue] = useState<OfflineQueuedReport[]>(() => loadOfflineQueue());
  const [isSyncing, setIsSyncing] = useState(false);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const t = TRANSLATIONS[language];
  const isRtl = language === 'ar';

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [language, isRtl]);

  useEffect(() => {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(offlineQueue));
    } catch {
      // Ignore storage quota errors
    }
  }, [offlineQueue]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4500);
  }, []);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/telemetry/overview');
      if (!res.ok) return;
      const data = await res.json();
      if (data.wilayas) setWilayas(data.wilayas);
      if (data.stations) setStations(data.stations);
      if (data.anomalies) setAnomalies(data.anomalies);
      if (data.reservoirs) setReservoirs(data.reservoirs);
      if (data.reports) setReports(data.reports);
      if (data.alerts) setAlerts(data.alerts);
      if (data.corridors) setCorridors(data.corridors);
      if (data.series) setSeries(data.series);
      if (data.stationHistory) setStationHistory(data.stationHistory);
    } catch {
      // Deterministic seed state remains active if backend unreachable
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Real-time Server-Sent Events (SSE) subscription for live station telemetry
  useEffect(() => {
    if (isOfflineSimulated) {
      setStreamStatus('paused');
      return;
    }

    setStreamStatus('connecting');
    const source = new EventSource('/api/v1/telemetry/stream');

    source.addEventListener('init', (event) => {
      try {
        const parsed = JSON.parse((event as MessageEvent).data) as {
          stations?: TelemetryStation[];
          history?: StationHistoryMap;
        };
        if (parsed.stations) setStations(parsed.stations);
        if (parsed.history) setStationHistory(parsed.history);
        setStreamStatus('live');
      } catch {
        // Ignore malformed init payload
      }
    });

    source.addEventListener('station:tick', (event) => {
      try {
        const parsed = JSON.parse((event as MessageEvent).data) as {
          updates: Array<{ station_code: string; reading: StationReadingPoint }>;
        };
        if (!Array.isArray(parsed.updates)) return;

        setStreamStatus('live');
        setStationHistory((prev) => {
          const next = { ...prev };
          for (const upd of parsed.updates) {
            next[upd.station_code] = appendStationHistoryPoint(
              next[upd.station_code] ?? [],
              upd.reading
            );
          }
          return next;
        });

        setStations((prev) =>
          prev.map((st) => {
            const match = parsed.updates.find((u) => u.station_code === st.station_code);
            if (!match) return st;
            return {
              ...st,
              temperature: match.reading.temperature,
              humidity: match.reading.humidity,
              last_ping: match.reading.timestamp,
            };
          })
        );
      } catch {
        // Ignore malformed delta payload
      }
    });

    source.onerror = () => {
      setStreamStatus('connecting');
    };

    return () => {
      source.close();
    };
  }, [isOfflineSimulated]);

  const handleSyncQueuedReports = useCallback(async () => {
    if (isOfflineSimulated || offlineQueue.length === 0 || isSyncing) return;
    setIsSyncing(true);
    const remaining: OfflineQueuedReport[] = [];
    let syncedCount = 0;

    for (const item of offlineQueue) {
      try {
        const res = await fetch('/api/v1/reports/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: item.category,
            details: item.details,
            lat: item.lat,
            lng: item.lng,
            is_anonymous: item.is_anonymous,
            photo_attached: item.photo_attached,
            photo_name: item.photo_name,
            synced_from_offline: true,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setReports((prev) => [json.data, ...prev]);
          }
          syncedCount += 1;
        } else {
          remaining.push(item);
        }
      } catch {
        remaining.push(item);
      }
    }

    setOfflineQueue(remaining);
    setIsSyncing(false);
    if (syncedCount > 0) {
      showToast(`${syncedCount} ${t.toolbar.syncPending}`);
    }
  }, [isOfflineSimulated, offlineQueue, isSyncing, showToast, t.toolbar.syncPending]);

  const handleSubmitReport = async (payload: {
    category: ReportCategory;
    details: string;
    lat: number;
    lng: number;
    is_anonymous: boolean;
    photo_attached: boolean;
    photo_name?: string;
  }) => {
    if (isOfflineSimulated || !navigator.onLine) {
      const queuedItem: OfflineQueuedReport = {
        local_id: `OFF-${Date.now()}`,
        ...payload,
        queued_at: new Date().toISOString(),
      };
      setOfflineQueue((prev) => [queuedItem, ...prev]);
      showToast(t.modal.successOffline);
      return { ok: true, offlineQueued: true };
    }

    try {
      const res = await fetch('/api/v1/reports/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        return { ok: false, error: json.error || t.modal.validationDetails };
      }
      if (json.data) {
        setReports((prev) => [json.data, ...prev]);
      }
      showToast(t.modal.successOnline);
      return { ok: true };
    } catch {
      const queuedItem: OfflineQueuedReport = {
        local_id: `OFF-${Date.now()}`,
        ...payload,
        queued_at: new Date().toISOString(),
      };
      setOfflineQueue((prev) => [queuedItem, ...prev]);
      showToast(t.modal.successOffline);
      return { ok: true, offlineQueued: true };
    }
  };

  const handleEvaluateFwi = async (payload: {
    station_code: string;
    temperature: number;
    humidity: number;
    wind_speed: number;
    fuel_dryness: number;
  }): Promise<FwiResult | null> => {
    try {
      const res = await fetch('/api/v1/telemetry/evaluate-fire-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.dispatched_alert) {
        setAlerts((prev) => [data.dispatched_alert, ...prev]);
      }
      return data as FwiResult;
    } catch {
      return null;
    }
  };

  const handleUpdateReportStatus = async (id: number, status: VerificationStatus) => {
    try {
      const res = await fetch(`/api/v1/reports/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verification_status: status }),
      });
      if (!res.ok) return;
      const json = await res.json();
      if (json.data) {
        setReports((prev) => prev.map((r) => (r.id === id ? json.data : r)));
      }
    } catch {
      // Ignore network error
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col"
    >
      <TopHeader
        t={t}
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        onOpenReportModal={() => {
          setSelectedCoords(null);
          setReportModalOpen(true);
        }}
      />

      <WorkspaceToolbar
        t={t}
        language={language}
        onChangeLanguage={setLanguage}
        isOfflineSimulated={isOfflineSimulated}
        onToggleOffline={() => setIsOfflineSimulated((prev) => !prev)}
        queuedCount={offlineQueue.length}
        isSyncing={isSyncing}
        onSyncQueued={handleSyncQueuedReports}
      />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6">
        {activeModule === 'gis' && (
          <div className="space-y-6">
            <TacticalGisMap
              t={t}
              language={language}
              wilayas={wilayas}
              anomalies={anomalies}
              stations={stations}
              reservoirs={reservoirs}
              reports={reports}
              corridors={corridors}
              onMapClickCoords={(coords) => {
                setSelectedCoords(coords);
                setReportModalOpen(true);
              }}
            />
            <DashboardWidget
              t={t}
              language={language}
              stations={stations}
              stationHistory={stationHistory}
              streamStatus={streamStatus}
            />
          </div>
        )}

        {activeModule === 'hydrology' && (
          <HydrologyGridView
            t={t}
            language={language}
            reservoirs={reservoirs}
            wilayas={wilayas}
          />
        )}

        {activeModule === 'wildfire' && (
          <WildfireShieldView
            t={t}
            language={language}
            stations={stations}
            alerts={alerts}
            reports={reports}
            onEvaluateFwi={handleEvaluateFwi}
            onUpdateReportStatus={handleUpdateReportStatus}
          />
        )}

        {activeModule === 'analytics' && (
          <AnalyticsSimulatorView t={t} series={series} />
        )}

        {activeModule === 'architecture' && <ArchitectureApiView t={t} />}
      </main>

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 start-5 z-[2500] max-w-md bg-[#0c121e] border border-emerald-500/60 text-emerald-300 px-4 py-3 rounded-lg shadow-xl text-xs font-medium"
        >
          {toastMessage}
        </div>
      )}

      <FieldReportModal
        t={t}
        isOpen={reportModalOpen}
        initialCoords={selectedCoords}
        isOffline={isOfflineSimulated}
        onClose={() => setReportModalOpen(false)}
        onSubmitReport={handleSubmitReport}
      />
    </div>
  );
}
