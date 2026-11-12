import React, { useState } from 'react';
import { Check, Copy, Play } from 'lucide-react';
import { POSTGIS_SCHEMA_SQL } from '../data/seedData';
import type { TranslationBundle } from '../i18n/translations';

interface ArchitectureApiViewProps {
  t: TranslationBundle;
}

const ENDPOINTS = [
  {
    id: 'health',
    method: 'GET',
    path: '/api/v1/health',
    body: null,
  },
  {
    id: 'anomalies',
    method: 'GET',
    path: '/api/v1/anomalies?type=wildfire_risk',
    body: null,
  },
  {
    id: 'fwi',
    method: 'POST',
    path: '/api/v1/telemetry/evaluate-fire-risk',
    body: JSON.stringify(
      {
        station_code: 'DZ-MILA-01',
        temperature: 43.2,
        humidity: 15,
        wind_speed: 36,
        fuel_dryness: 24,
      },
      null,
      2
    ),
  },
] as const;

export const ArchitectureApiView: React.FC<ArchitectureApiViewProps> = ({ t }) => {
  const [copied, setCopied] = useState(false);
  const [selectedEndpointId, setSelectedEndpointId] = useState<'health' | 'anomalies' | 'fwi'>('health');
  const [responseJson, setResponseJson] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const selectedEndpoint = ENDPOINTS.find((e) => e.id === selectedEndpointId) ?? ENDPOINTS[0];

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(POSTGIS_SCHEMA_SQL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked fallback ignored
    }
  };

  const handleRunEndpoint = async () => {
    setLoading(true);
    try {
      const res = await fetch(selectedEndpoint.path, {
        method: selectedEndpoint.method,
        headers: selectedEndpoint.body ? { 'Content-Type': 'application/json' } : undefined,
        body: selectedEndpoint.body ?? undefined,
      });
      const data = await res.json();
      setResponseJson(JSON.stringify(data, null, 2));
    } catch (err) {
      setResponseJson(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-labelledby="architecture-module-heading" className="space-y-6">
      <div>
        <h1 id="architecture-module-heading" className="text-xl sm:text-2xl font-bold text-slate-100 text-balance">
          {t.architecture.title}
        </h1>
        <p className="text-sm text-slate-400 mt-1">{t.architecture.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* PostGIS Schema DDL Viewer */}
        <div className="lg:col-span-7 bg-[#0c121e] border border-slate-800 rounded-lg overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-slate-200">{t.architecture.schemaTitle}</h2>
            <button
              type="button"
              onClick={handleCopySql}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>{copied ? t.architecture.copiedSql : t.architecture.copySql}</span>
            </button>
          </div>
          <pre
            dir="ltr"
            className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-[520px] leading-relaxed bg-[#070b12]"
          >
            {POSTGIS_SCHEMA_SQL}
          </pre>
        </div>

        {/* Live API Endpoint Tester */}
        <div className="lg:col-span-5 bg-[#0c121e] border border-slate-800 rounded-lg p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-slate-200">{t.architecture.apiTesterTitle}</h2>

          <div className="space-y-2">
            {ENDPOINTS.map((ep) => (
              <button
                key={ep.id}
                type="button"
                onClick={() => setSelectedEndpointId(ep.id)}
                className={`w-full text-start px-3 py-2.5 rounded-md border text-xs font-mono transition-colors cursor-pointer flex items-center gap-2 ${
                  selectedEndpointId === ep.id
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="font-bold text-sky-400">{ep.method}</span>
                <span dir="ltr" className="truncate">
                  {ep.path}
                </span>
              </button>
            ))}
          </div>

          {selectedEndpoint.body && (
            <pre
              dir="ltr"
              className="p-3 rounded-md bg-[#070b12] border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto"
            >
              {selectedEndpoint.body}
            </pre>
          )}

          <button
            type="button"
            onClick={handleRunEndpoint}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-60"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{t.architecture.runRequest}</span>
          </button>

          <div className="flex-1 flex flex-col">
            <div className="text-xs text-slate-400 mb-1.5">{t.architecture.responseLabel}</div>
            <pre
              dir="ltr"
              className="flex-1 min-h-[180px] max-h-[260px] p-3 rounded-md bg-[#070b12] border border-slate-800 text-xs font-mono text-emerald-300 overflow-auto"
            >
              {responseJson || '// Click Execute Live Request'}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
};
