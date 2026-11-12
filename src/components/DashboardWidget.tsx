import React, { useId, useMemo, useState } from 'react';
import { Activity } from 'lucide-react';
import type {
  Language,
  StationHistoryMap,
  StationReadingPoint,
  TelemetryStation,
} from '../types/telemetry';
import type { TranslationBundle } from '../i18n/translations';
import { buildSparklineGeometry } from '../utils/stationTelemetry';

export type StreamConnectionState = 'live' | 'connecting' | 'paused';

interface DashboardWidgetProps {
  t: TranslationBundle;
  language: Language;
  stations: TelemetryStation[];
  stationHistory: StationHistoryMap;
  streamStatus: StreamConnectionState;
}

interface SparklineCardProps {
  title: string;
  unit: string;
  strokeColor: string;
  points: StationReadingPoint[];
  valueSelector: (pt: StationReadingPoint) => number;
  decimals: number;
  rangeLabel: string;
}

const SparklinePlot: React.FC<SparklineCardProps> = ({
  title,
  unit,
  strokeColor,
  points,
  valueSelector,
  decimals,
  rangeLabel,
}) => {
  const gradientId = useId();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const values = useMemo(() => points.map(valueSelector), [points, valueSelector]);
  const width = 260;
  const height = 60;
  const geo = useMemo(() => buildSparklineGeometry(values, width, height, 5), [values]);

  const activeIdx =
    hoveredIdx !== null && hoveredIdx >= 0 && hoveredIdx < points.length
      ? hoveredIdx
      : points.length - 1;
  const activePoint = points[activeIdx];
  const activeCoord = geo.points[activeIdx];
  const activeVal = activePoint ? valueSelector(activePoint) : geo.current;

  const formattedTime = activePoint
    ? new Date(activePoint.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '--:--';

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-slate-400">{title}</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg font-bold font-mono tabular-nums text-slate-100">
            {activeVal.toFixed(decimals)}
          </span>
          <span className="text-[11px] font-mono text-slate-400">{unit}</span>
        </div>
      </div>

      <div className="relative bg-[#070b12] border border-slate-800/80 rounded-md p-1.5">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-[60px] overflow-visible"
          role="img"
          aria-label={`${title}: ${activeVal.toFixed(decimals)} ${unit}`}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.28" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {geo.areaPath && <path d={geo.areaPath} fill={`url(#${gradientId})`} />}
          {geo.linePath && (
            <path
              d={geo.linePath}
              fill="none"
              stroke={strokeColor}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {activeCoord && (
            <>
              <line
                x1={activeCoord.x}
                y1={2}
                x2={activeCoord.x}
                y2={height - 2}
                stroke="#334155"
                strokeWidth={1}
                strokeDasharray="2 2"
              />
              <circle
                cx={activeCoord.x}
                cy={activeCoord.y}
                r={3.5}
                fill={strokeColor}
                stroke="#070b12"
                strokeWidth={1.5}
              />
            </>
          )}

          {/* Invisible vertical hit slices for smooth hover scrubbing */}
          {geo.points.map((pt, idx) => {
            const sliceW = width / Math.max(1, geo.points.length);
            return (
              <rect
                key={idx}
                x={Math.max(0, pt.x - sliceW / 2)}
                y={0}
                width={sliceW}
                height={height}
                fill="transparent"
                onMouseEnter={() => setHoveredIdx(idx)}
              />
            );
          })}
        </svg>
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-400">
        <span>
          {rangeLabel}: {geo.min.toFixed(decimals)}–{geo.max.toFixed(decimals)}
        </span>
        <span
          className={
            geo.delta > 0
              ? 'text-amber-300'
              : geo.delta < 0
                ? 'text-sky-300'
                : 'text-slate-400'
          }
        >
          {geo.delta > 0 ? '+' : ''}
          {geo.delta.toFixed(decimals)} · {formattedTime}
        </span>
      </div>
    </div>
  );
};

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  t,
  language,
  stations,
  stationHistory,
  streamStatus,
}) => {
  const [selectedCodes, setSelectedCodes] = useState<string[]>([
    'DZ-MILA-01',
    'DZ-DJEL-02',
    'DZ-TIZI-04',
  ]);

  const toggleStation = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const selectedStations = useMemo(
    () => stations.filter((st) => selectedCodes.includes(st.station_code)),
    [stations, selectedCodes]
  );

  const statusText =
    streamStatus === 'live'
      ? t.widget.streamLive
      : streamStatus === 'paused'
        ? t.widget.streamPaused
        : t.widget.streamConnecting;

  const statusColor =
    streamStatus === 'live'
      ? 'text-emerald-400'
      : streamStatus === 'paused'
        ? 'text-amber-400'
        : 'text-sky-400';

  return (
    <section
      aria-labelledby="live-telemetry-widget-heading"
      data-testid="live-telemetry-widget"
      className="bg-[#0c121e] border border-slate-800 rounded-lg p-5 space-y-4"
    >
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h2
            id="live-telemetry-widget-heading"
            className="text-base font-semibold text-slate-100 flex items-center gap-2"
          >
            <Activity className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <span>{t.widget.title}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{t.widget.subtitle}</p>
        </div>

        {/* Live SSE Connection Telemetry Label */}
        <div
          data-testid="stream-status-label"
          className={`inline-flex items-center gap-2 text-xs font-medium whitespace-nowrap shrink-0 ${statusColor}`}
        >
          <span
            aria-hidden="true"
            className={`w-2 h-2 rounded-full ${
              streamStatus === 'live'
                ? 'bg-emerald-400 animate-pulse'
                : streamStatus === 'paused'
                  ? 'bg-amber-400'
                  : 'bg-sky-400'
            }`}
          />
          <span>{statusText}</span>
        </div>
      </div>

      {/* Interactive Station Selector Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 me-1">{t.widget.selectStationsLabel}</span>
        {stations.map((st) => {
          const isSelected = selectedCodes.includes(st.station_code);
          return (
            <button
              key={st.station_code}
              type="button"
              onClick={() => toggleStation(st.station_code)}
              aria-pressed={isSelected}
              className={`px-2.5 py-1.5 rounded-md border text-xs font-mono transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isSelected
                  ? 'bg-emerald-600/20 border-emerald-500/60 text-emerald-300 font-semibold'
                  : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {st.station_code}
            </button>
          );
        })}
      </div>

      {/* Selected Stations Sparkline Grid */}
      {selectedStations.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400 border border-dashed border-slate-800 rounded-md">
          {t.widget.noStationsSelected}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {selectedStations.map((st) => {
            const history = stationHistory[st.station_code] ?? [];
            const displayName = language === 'ar' ? st.name_ar : st.name_en;
            const lastPingTime = new Date(st.last_ping).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <article
                key={st.station_code}
                data-testid={`station-sparkline-card-${st.station_code}`}
                className="bg-[#090e18] border border-slate-800/90 rounded-lg p-4 space-y-4"
              >
                <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800/70">
                  <div className="min-w-0">
                    <div className="text-xs font-mono font-semibold text-emerald-400">
                      {st.station_code}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-100 truncate mt-0.5">
                      {displayName}
                    </h3>
                  </div>
                  <div className="text-[11px] font-mono tabular-nums text-slate-400 whitespace-nowrap shrink-0">
                    {t.widget.lastPing}: {lastPingTime}
                  </div>
                </div>

                <div className="space-y-4">
                  <SparklinePlot
                    title={t.widget.tempTitle}
                    unit="°C"
                    strokeColor="#f59e0b"
                    points={history}
                    valueSelector={(pt) => pt.temperature}
                    decimals={1}
                    rangeLabel={t.widget.range60m}
                  />
                  <SparklinePlot
                    title={t.widget.humidityTitle}
                    unit="%"
                    strokeColor="#38bdf8"
                    points={history}
                    valueSelector={(pt) => pt.humidity}
                    decimals={1}
                    rangeLabel={t.widget.range60m}
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
