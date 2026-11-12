import React, { useMemo, useState } from 'react';
import type { CropType, Language, WaterReservoir, WilayaMetric } from '../types/telemetry';
import type { TranslationBundle } from '../i18n/translations';
import {
  calculateCropIrrigationAdvisory,
  calculateDroughtAndFloodRisk,
} from '../utils/climateEngine';

interface HydrologyGridViewProps {
  t: TranslationBundle;
  language: Language;
  reservoirs: WaterReservoir[];
  wilayas: WilayaMetric[];
}

export const HydrologyGridView: React.FC<HydrologyGridViewProps> = ({
  t,
  language,
  reservoirs,
  wilayas,
}) => {
  const [cropType, setCropType] = useState<CropType>('olive');
  const [et0, setEt0] = useState<number>(6.2);
  const [soilMoisture, setSoilMoisture] = useState<number>(18);
  const [areaHectares, setAreaHectares] = useState<number>(25);

  const advisory = useMemo(
    () =>
      calculateCropIrrigationAdvisory({
        crop_type: cropType,
        et0_mm_day: et0,
        soil_moisture_pct: soilMoisture,
        area_hectares: areaHectares,
      }),
    [cropType, et0, soilMoisture, areaHectares]
  );

  const wilayaRisks = useMemo(() => {
    const avgFill =
      reservoirs.reduce((acc, r) => acc + r.current_fill_pct, 0) / Math.max(1, reservoirs.length);
    return wilayas.slice(0, 8).map((w) => {
      const risk = calculateDroughtAndFloodRisk({
        precipitation_anomaly_pct: w.precipitation_anomaly_pct,
        soil_moisture_pct: w.soil_moisture_pct,
        lst_celsius: w.lst_celsius,
        reservoir_fill_pct: avgFill,
      });
      return { wilaya: w, risk };
    });
  }, [wilayas, reservoirs]);

  return (
    <section aria-labelledby="hydrology-module-heading" className="space-y-6">
      <div>
        <h1 id="hydrology-module-heading" className="text-xl sm:text-2xl font-bold text-slate-100 text-balance">
          {t.hydrology.title}
        </h1>
        <p className="text-sm text-slate-400 mt-1">{t.hydrology.subtitle}</p>
      </div>

      {/* Strategic Reservoirs Table */}
      <div className="bg-[#0c121e] border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-200">{t.hydrology.damsTitle}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400 bg-slate-900/50">
                <th className="py-2.5 px-4 text-start font-medium">{t.hydrology.colDam}</th>
                <th className="py-2.5 px-4 text-start font-medium">{t.hydrology.colWilaya}</th>
                <th className="py-2.5 px-4 text-end font-medium">{t.hydrology.colCapacity}</th>
                <th className="py-2.5 px-4 text-start font-medium">{t.hydrology.colFill}</th>
                <th className="py-2.5 px-4 text-end font-medium">{t.hydrology.colInOut}</th>
                <th className="py-2.5 px-4 text-end font-medium">{t.hydrology.colGroundwater}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {reservoirs.map((dam) => {
                const fillColor =
                  dam.current_fill_pct < 30
                    ? 'bg-red-500'
                    : dam.current_fill_pct < 50
                      ? 'bg-amber-500'
                      : 'bg-sky-500';
                return (
                  <tr key={dam.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-4 font-medium text-slate-100">
                      {language === 'ar' ? dam.name_ar : dam.name_en}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {language === 'ar' ? dam.wilaya_ar : dam.wilaya_en}
                    </td>
                    <td className="py-3 px-4 text-end font-mono tabular-nums text-slate-200">
                      {dam.capacity_mcm}
                    </td>
                    <td className="py-3 px-4 min-w-[160px]">
                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 h-2 bg-slate-800 rounded-sm overflow-hidden">
                          <div
                            className={`h-full ${fillColor}`}
                            style={{ width: `${dam.current_fill_pct}%` }}
                          />
                        </div>
                        <span className="font-mono tabular-nums text-xs text-slate-200 w-12 text-end">
                          {dam.current_fill_pct.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-end font-mono tabular-nums text-slate-300">
                      +{dam.inflow_m3s.toFixed(1)} / -{dam.outflow_m3s.toFixed(1)}
                    </td>
                    <td className="py-3 px-4 text-end font-mono tabular-nums text-amber-400">
                      -{dam.groundwater_depletion_m_yr.toFixed(2)} m
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Split Grid: Drought/Flood Modeling + Precision Agricultural Advisory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Predictive Drought & Flash-Flood Modeling */}
        <div className="lg:col-span-7 bg-[#0c121e] border border-slate-800 rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200">{t.hydrology.droughtTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {wilayaRisks.map(({ wilaya, risk }) => {
              const name =
                language === 'ar'
                  ? wilaya.name_ar
                  : language === 'fr'
                    ? wilaya.name_fr
                    : wilaya.name_en;
              return (
                <div
                  key={wilaya.id}
                  className="border border-slate-800 bg-slate-900/40 rounded-md p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-slate-100">{name}</span>
                    <span className="text-xs font-mono tabular-nums text-slate-400">
                      Rain {wilaya.precipitation_anomaly_pct > 0 ? '+' : ''}
                      {wilaya.precipitation_anomaly_pct}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{t.hydrology.droughtScore}</span>
                    <span
                      className={`font-mono tabular-nums font-semibold ${
                        risk.drought_tier === 'critical'
                          ? 'text-red-400'
                          : risk.drought_tier === 'elevated'
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                      }`}
                    >
                      {risk.drought_risk_score} / 100
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{t.hydrology.floodScore}</span>
                    <span
                      className={`font-mono tabular-nums font-semibold ${
                        risk.flood_tier === 'warning'
                          ? 'text-sky-400'
                          : risk.flood_tier === 'watch'
                            ? 'text-amber-300'
                            : 'text-slate-400'
                      }`}
                    >
                      {risk.flash_flood_risk_score} / 100
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Precision Agricultural Advisory (ETc) */}
        <div className="lg:col-span-5 bg-[#0c121e] border border-slate-800 rounded-lg p-5 flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-200">{t.hydrology.advisoryTitle}</h2>

            <div>
              <label htmlFor="crop-select" className="block text-xs text-slate-400 mb-1">
                {t.hydrology.cropLabel}
              </label>
              <select
                id="crop-select"
                value={cropType}
                onChange={(e) => setCropType(e.target.value as CropType)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                {(['olive', 'date_palm', 'durum_wheat', 'citrus', 'steppe_forage'] as CropType[]).map(
                  (c) => (
                    <option key={c} value={c}>
                      {t.crops[c]}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="et0-input" className="block text-xs text-slate-400 mb-1">
                  {t.hydrology.et0Label}
                </label>
                <input
                  id="et0-input"
                  type="number"
                  step="0.2"
                  min={1}
                  max={14}
                  value={et0}
                  onChange={(e) => setEt0(Number(e.target.value) || 1)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm font-mono tabular-nums text-white"
                />
              </div>
              <div>
                <label htmlFor="soil-input" className="block text-xs text-slate-400 mb-1">
                  {t.hydrology.soilMoistureLabel}
                </label>
                <input
                  id="soil-input"
                  type="number"
                  min={2}
                  max={80}
                  value={soilMoisture}
                  onChange={(e) => setSoilMoisture(Number(e.target.value) || 2)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm font-mono tabular-nums text-white"
                />
              </div>
              <div>
                <label htmlFor="area-input" className="block text-xs text-slate-400 mb-1">
                  {t.hydrology.areaLabel}
                </label>
                <input
                  id="area-input"
                  type="number"
                  min={1}
                  max={5000}
                  value={areaHectares}
                  onChange={(e) => setAreaHectares(Number(e.target.value) || 1)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm font-mono tabular-nums text-white"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {t.hydrology.etcOutput} (Kc {advisory.crop_kc})
              </span>
              <span className="font-mono tabular-nums text-base font-bold text-sky-400">
                {advisory.etc_mm_day} mm/d
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{t.hydrology.recommendedIrr}</span>
              <span className="font-mono tabular-nums text-base font-bold text-emerald-400">
                {advisory.recommended_m3_day} m³/d
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">{t.hydrology.waterSaved}</span>
              <span className="font-mono tabular-nums text-sm font-semibold text-amber-300">
                +{advisory.drip_savings_m3_day} m³/d
              </span>
            </div>
            <div className="pt-2 border-t border-slate-800/80">
              <div className="text-[11px] text-slate-400 mb-1">{t.hydrology.scheduleLabel}</div>
              <div className="text-sm font-semibold text-emerald-300">
                {t.hydrology.schedules[advisory.schedule_code]}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
