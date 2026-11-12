import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Flame, Lock, ShieldCheck } from 'lucide-react';
import type {
  DispatchAlert,
  FieldReport,
  FwiResult,
  Language,
  TelemetryStation,
  VerificationStatus,
} from '../types/telemetry';
import type { TranslationBundle } from '../i18n/translations';
import { calculateFireWeatherIndex } from '../utils/climateEngine';

interface WildfireShieldViewProps {
  t: TranslationBundle;
  language: Language;
  stations: TelemetryStation[];
  alerts: DispatchAlert[];
  reports: FieldReport[];
  onEvaluateFwi: (payload: {
    station_code: string;
    temperature: number;
    humidity: number;
    wind_speed: number;
    fuel_dryness: number;
  }) => Promise<FwiResult | null>;
  onUpdateReportStatus: (id: number, status: VerificationStatus) => Promise<void>;
}

export const WildfireShieldView: React.FC<WildfireShieldViewProps> = ({
  t,
  language,
  stations,
  alerts,
  reports,
  onEvaluateFwi,
  onUpdateReportStatus,
}) => {
  const initialStation = stations[0];
  const [selectedStation, setSelectedStation] = useState(initialStation?.station_code ?? 'DZ-MILA-01');
  const [temperature, setTemperature] = useState(initialStation?.temperature ?? 42.4);
  const [humidity, setHumidity] = useState(initialStation?.humidity ?? 16.5);
  const [windSpeed, setWindSpeed] = useState(initialStation?.wind_speed ?? 34.0);
  const [fuelDryness, setFuelDryness] = useState(initialStation?.fuel_dryness ?? 25.0);
  const [submitting, setSubmitting] = useState(false);

  const livePreview = calculateFireWeatherIndex({
    temperature,
    humidity,
    wind_speed: windSpeed,
    fuel_dryness: fuelDryness,
  });
  const [lastServerResult, setLastServerResult] = useState<FwiResult | null>(null);

  const activeResult = lastServerResult ?? livePreview;

  const handleStationSelect = (code: string) => {
    setSelectedStation(code);
    const st = stations.find((s) => s.station_code === code);
    if (st) {
      setTemperature(st.temperature);
      setHumidity(st.humidity);
      setWindSpeed(st.wind_speed);
      setFuelDryness(st.fuel_dryness);
      setLastServerResult(null);
    }
  };

  const handleEvaluateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await onEvaluateFwi({
      station_code: selectedStation,
      temperature,
      humidity,
      wind_speed: windSpeed,
      fuel_dryness: fuelDryness,
    });
    if (res) {
      setLastServerResult(res);
    }
    setSubmitting(false);
  };

  return (
    <section aria-labelledby="wildfire-module-heading" className="space-y-6">
      <div>
        <h1 id="wildfire-module-heading" className="text-xl sm:text-2xl font-bold text-slate-100 text-balance">
          {t.wildfire.title}
        </h1>
        <p className="text-sm text-slate-400 mt-1">{t.wildfire.subtitle}</p>
      </div>

      {/* Top Grid: FWI Engine Calculator + Dispatch Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <form
          onSubmit={handleEvaluateSubmit}
          className="lg:col-span-6 bg-[#0c121e] border border-slate-800 rounded-lg p-5 flex flex-col justify-between gap-5"
        >
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-400" aria-hidden="true" />
              <span>{t.wildfire.fwiCalculatorTitle}</span>
            </h2>

            <div>
              <label htmlFor="fwi-station-select" className="block text-xs text-slate-400 mb-1">
                {t.wildfire.selectStation}
              </label>
              <select
                id="fwi-station-select"
                value={selectedStation}
                onChange={(e) => handleStationSelect(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white"
              >
                {stations.map((st) => (
                  <option key={st.station_code} value={st.station_code}>
                    {st.station_code} — {language === 'ar' ? st.name_ar : st.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="fwi-temp" className="block text-xs text-slate-400 mb-1">
                  {t.wildfire.tempLabel}
                </label>
                <input
                  id="fwi-temp"
                  type="number"
                  step="0.5"
                  value={temperature}
                  onChange={(e) => {
                    setTemperature(Number(e.target.value));
                    setLastServerResult(null);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm font-mono tabular-nums text-white"
                />
              </div>
              <div>
                <label htmlFor="fwi-humidity" className="block text-xs text-slate-400 mb-1">
                  {t.wildfire.humidityLabel}
                </label>
                <input
                  id="fwi-humidity"
                  type="number"
                  min={0}
                  max={100}
                  step="1"
                  value={humidity}
                  onChange={(e) => {
                    setHumidity(Number(e.target.value));
                    setLastServerResult(null);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm font-mono tabular-nums text-white"
                />
              </div>
              <div>
                <label htmlFor="fwi-wind" className="block text-xs text-slate-400 mb-1">
                  {t.wildfire.windLabel}
                </label>
                <input
                  id="fwi-wind"
                  type="number"
                  min={0}
                  step="1"
                  value={windSpeed}
                  onChange={(e) => {
                    setWindSpeed(Number(e.target.value));
                    setLastServerResult(null);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm font-mono tabular-nums text-white"
                />
              </div>
              <div>
                <label htmlFor="fwi-dryness" className="block text-xs text-slate-400 mb-1">
                  {t.wildfire.drynessLabel}
                </label>
                <input
                  id="fwi-dryness"
                  type="number"
                  min={0}
                  step="1"
                  value={fuelDryness}
                  onChange={(e) => {
                    setFuelDryness(Number(e.target.value));
                    setLastServerResult(null);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm font-mono tabular-nums text-white"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-400">{t.wildfire.fwiScoreLabel}</span>
              <span
                data-testid="fwi-score-output"
                className={`text-3xl font-bold font-mono tabular-nums ${
                  activeResult.risk_code === 'extreme'
                    ? 'text-red-400'
                    : activeResult.risk_code === 'high'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                }`}
              >
                {activeResult.fwi_score.toFixed(2)}
              </span>
            </div>
            <div className="text-sm font-semibold text-slate-100">
              {language === 'ar'
                ? activeResult.risk_level_ar
                : language === 'fr'
                  ? activeResult.risk_level_fr
                  : activeResult.risk_level_en}
            </div>
            <p className="text-xs text-slate-400">
              {language === 'ar' ? activeResult.action_ar : activeResult.action_en}
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {t.wildfire.computeButton}
            </button>
          </div>
        </form>

        {/* Automated Dispatch Webhook Log */}
        <div className="lg:col-span-6 bg-[#0c121e] border border-slate-800 rounded-lg p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" aria-hidden="true" />
              <span>{t.wildfire.dispatchTitle}</span>
            </h2>
            <span className="font-mono tabular-nums text-xs text-slate-400">
              {alerts.length}
            </span>
          </div>

          <div className="divide-y divide-slate-800/70 flex-1 overflow-y-auto max-h-[340px]">
            {alerts.map((al) => (
              <div key={al.id} className="py-3.5 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-mono font-semibold text-slate-200">
                    {al.id} · {al.station_code}
                  </span>
                  <span
                    className={`font-mono tabular-nums font-bold ${
                      al.severity === 'extreme' ? 'text-red-400' : 'text-amber-400'
                    }`}
                  >
                    FWI {al.fwi_score.toFixed(1)}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {language === 'ar' ? al.message_ar : al.message_en}
                </p>
                <div className="text-[11px] font-mono text-slate-500 truncate">
                  {al.webhook_target} · {new Date(al.triggered_at).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Encrypted Field Reports List */}
      <div className="bg-[#0c121e] border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <span>{t.wildfire.reportsTitle}</span>
          </h2>
          <span className="font-mono tabular-nums text-xs text-slate-400">
            {reports.length}
          </span>
        </div>

        {reports.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">{t.wildfire.noReports}</div>
        ) : (
          <div className="divide-y divide-slate-800/70">
            {reports.map((rep) => (
              <article
                key={rep.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-900/30 transition-colors"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="font-mono font-semibold text-slate-200">#{rep.id}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-emerald-400">
                      {t.categories[rep.category]}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {rep.lat.toFixed(4)}, {rep.lng.toFixed(4)}
                    </span>
                    {rep.is_anonymous && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 text-slate-300">
                          <Lock className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                          <span>{rep.encrypted_hash}</span>
                        </span>
                      </>
                    )}
                    {rep.synced_from_offline && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-300">{t.wildfire.offlineSyncedTag}</span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-slate-100">{rep.details}</p>
                  <div className="text-xs text-slate-400">
                    {t.statuses[rep.verification_status]}
                    {rep.photo_attached && rep.photo_name ? ` · ${rep.photo_name}` : ''}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {rep.verification_status !== 'verified' &&
                    rep.verification_status !== 'resolved' && (
                      <button
                        type="button"
                        onClick={() => onUpdateReportStatus(rep.id, 'verified')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 cursor-pointer whitespace-nowrap"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{t.wildfire.verifyAction}</span>
                      </button>
                    )}
                  {rep.verification_status !== 'resolved' && (
                    <button
                      type="button"
                      onClick={() => onUpdateReportStatus(rep.id, 'resolved')}
                      className="px-3 py-1.5 rounded-md bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-xs font-medium text-emerald-300 cursor-pointer whitespace-nowrap"
                    >
                      {t.wildfire.resolveAction}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
