import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import type {
  AnomalyType,
  FieldReport,
  GeoJsonCorridors,
  Language,
  SpatialAnomaly,
  SpectralIndexMode,
  TelemetryStation,
  WaterReservoir,
  WilayaMetric,
} from '../types/telemetry';
import type { TranslationBundle } from '../i18n/translations';

interface TacticalGisMapProps {
  t: TranslationBundle;
  language: Language;
  wilayas: WilayaMetric[];
  anomalies: SpatialAnomaly[];
  stations: TelemetryStation[];
  reservoirs: WaterReservoir[];
  reports: FieldReport[];
  corridors: GeoJsonCorridors;
  onMapClickCoords: (coords: { lat: number; lng: number }) => void;
}

const ANOMALY_COLORS: Record<AnomalyType, string> = {
  wildfire_risk: '#ef4444',
  desertification_hotspot: '#f59e0b',
  water_stress: '#3b82f6',
};

const AVAILABLE_YEARS = [2016, 2018, 2020, 2022, 2024, 2026];

export const TacticalGisMap: React.FC<TacticalGisMapProps> = ({
  t,
  language,
  wilayas,
  anomalies,
  stations,
  reservoirs,
  reports,
  corridors,
  onMapClickCoords,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const onMapClickRef = useRef(onMapClickCoords);
  onMapClickRef.current = onMapClickCoords;

  const [filter, setFilter] = useState<'ALL' | AnomalyType>('ALL');
  const [spectralMode, setSpectralMode] = useState<SpectralIndexMode>('NDVI');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [layers, setLayers] = useState({
    anomalies: true,
    greenDam: true,
    sandVectors: true,
    stations: true,
    reservoirs: true,
    reports: true,
  });

  const filteredAnomalies = useMemo(() => {
    return filter === 'ALL' ? anomalies : anomalies.filter((a) => a.anomaly_type === filter);
  }, [anomalies, filter]);

  const meanNdviForYear = useMemo(() => {
    if (!wilayas.length) return 0;
    const sum = wilayas.reduce((acc, w) => acc + (w.ndvi_history[selectedYear] ?? w.ndvi_history[2026]), 0);
    return (sum / wilayas.length).toFixed(3);
  }, [wilayas, selectedYear]);

  const meanReservoirFill = useMemo(() => {
    if (!reservoirs.length) return '0.0';
    const avg = reservoirs.reduce((acc, r) => acc + r.current_fill_pct, 0) / reservoirs.length;
    return avg.toFixed(1);
  }, [reservoirs]);

  // Mount Leaflet map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [34.2, 3.6],
      zoom: 6,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
        maxZoom: 16,
      }
    ).addTo(map);

    // Crisp tactical Algeria boundary silhouette so geographic frame remains legible even if tiles lag
    const algeriaOutline: Array<[number, number]> = [
      [36.85, 8.6], [37.05, 7.2], [36.9, 5.1], [36.8, 3.0], [36.6, 1.3],
      [35.9, -0.3], [35.1, -2.2], [33.0, -1.8], [31.5, -3.5], [29.6, -5.0],
      [27.7, -8.67], [25.5, -8.67], [24.0, -6.0], [21.0, -2.0], [19.0, 3.2],
      [19.5, 5.8], [23.5, 11.9], [26.5, 9.9], [30.2, 9.5], [33.3, 8.4],
      [35.1, 8.3], [36.85, 8.6],
    ];
    L.polygon(algeriaOutline, {
      color: '#334155',
      weight: 1.5,
      fillColor: '#0f172a',
      fillOpacity: 0.12,
      interactive: false,
    }).addTo(map);

    const group = L.layerGroup().addTo(map);
    map.on('click', (ev: L.LeafletMouseEvent) => {
      onMapClickRef.current({ lat: ev.latlng.lat, lng: ev.latlng.lng });
    });

    mapInstanceRef.current = map;
    layerGroupRef.current = group;

    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });
    observer.observe(mapContainerRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  // Re-render GIS overlays whenever state/filters/language change
  useEffect(() => {
    const group = layerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    // 1. Wilaya spectral circles (NDVI / NDWI / LST heatmap discs)
    wilayas.forEach((w) => {
      const ndviVal = w.ndvi_history[selectedYear] ?? w.ndvi_history[2026];
      let color = '#10b981';
      let metricText = `NDVI (${selectedYear}): ${ndviVal.toFixed(3)}`;

      if (spectralMode === 'NDVI') {
        color = ndviVal >= 0.45 ? '#10b981' : ndviVal >= 0.25 ? '#eab308' : '#ef4444';
      } else if (spectralMode === 'NDWI') {
        color = w.ndwi_current >= 0.15 ? '#0ea5e9' : w.ndwi_current >= 0 ? '#38bdf8' : '#f97316';
        metricText = `NDWI: ${w.ndwi_current.toFixed(2)}`;
      } else {
        color = w.lst_celsius >= 42 ? '#dc2626' : w.lst_celsius >= 37 ? '#f59e0b' : '#22c55e';
        metricText = `LST: ${w.lst_celsius.toFixed(1)} °C`;
      }

      const wName = language === 'ar' ? w.name_ar : language === 'fr' ? w.name_fr : w.name_en;
      L.circle([w.lat, w.lng], {
        radius: 58000,
        color,
        weight: 1,
        opacity: 0.45,
        fillColor: color,
        fillOpacity: 0.14,
      })
        .bindPopup(
          `<div dir="${language === 'ar' ? 'rtl' : 'ltr'}" style="min-width:160px;">
            <div style="font-weight:700;font-size:13px;margin-bottom:4px;">${wName} (${w.wilaya_code})</div>
            <div style="font-family:monospace;font-size:12px;">${metricText}</div>
            <div style="font-size:11px;color:#94a3b8;margin-top:2px;">Soil Moisture: ${w.soil_moisture_pct}%</div>
          </div>`
        )
        .addTo(group);
    });

    // 2. Green Dam Corridor GeoJSON Belt
    if (layers.greenDam && corridors.greenDamBelt.length > 0) {
      L.polygon(corridors.greenDamBelt, {
        color: '#10b981',
        weight: 2,
        dashArray: '6 4',
        fillColor: '#10b981',
        fillOpacity: 0.12,
      })
        .bindPopup(
          `<div dir="${language === 'ar' ? 'rtl' : 'ltr'}">
            <strong>${language === 'ar' ? 'حزام السد الأخضر الاستراتيجي' : 'Green Dam Reforestation Corridor'}</strong>
            <div style="font-size:11px;color:#94a3b8;margin-top:4px;">1,500 km Saharan Atlas Ecological Barrier</div>
          </div>`
        )
        .addTo(group);
    }

    // 3. Sand Encroachment Vectors
    if (layers.sandVectors) {
      corridors.sandEncroachmentVectors.forEach((vec) => {
        L.polyline([vec.from, vec.to], {
          color: '#f59e0b',
          weight: 2.5,
          dashArray: '4 6',
          opacity: 0.9,
        })
          .bindPopup(
            `<div dir="${language === 'ar' ? 'rtl' : 'ltr'}">
              <strong>${language === 'ar' ? vec.name_ar : vec.name_en}</strong>
              <div style="font-family:monospace;font-size:12px;color:#fbbf24;">${vec.velocity_m_yr} m/yr</div>
            </div>`
          )
          .addTo(group);
      });
    }

    // 4. Spatial Anomalies
    if (layers.anomalies) {
      filteredAnomalies.forEach((item) => {
        const col = ANOMALY_COLORS[item.anomaly_type];
        const desc = language === 'ar' ? item.description_ar : item.description_en;
        const wilaya = language === 'ar' ? item.wilaya_name_ar : item.wilaya_name_en;
        L.circleMarker([item.lat, item.lng], {
          radius: item.severity_level * 3.6 + 3,
          color: col,
          weight: 2,
          fillColor: col,
          fillOpacity: 0.5,
        })
          .bindPopup(
            `<div dir="${language === 'ar' ? 'rtl' : 'ltr'}" style="max-width:230px;">
              <div style="font-weight:700;color:${col};font-size:13px;">${t.anomalies[item.anomaly_type]} · ${wilaya}</div>
              <div style="font-size:11px;font-family:monospace;margin:4px 0;">${t.gis.severityLabel}: ${item.severity_level}/5</div>
              <div style="font-size:12px;line-height:1.4;">${desc}</div>
            </div>`
          )
          .addTo(group);
      });
    }

    // 5. IoT Telemetry Stations
    if (layers.stations) {
      stations.forEach((st) => {
        L.circleMarker([st.lat, st.lng], {
          radius: 5,
          color: '#06b6d4',
          weight: 1.5,
          fillColor: '#06b6d4',
          fillOpacity: 0.9,
        })
          .bindPopup(
            `<div dir="${language === 'ar' ? 'rtl' : 'ltr'}">
              <div style="font-weight:700;font-family:monospace;color:#22d3ee;">${st.station_code}</div>
              <div style="font-size:12px;margin-bottom:4px;">${language === 'ar' ? st.name_ar : st.name_en}</div>
              <div style="font-family:monospace;font-size:11px;">T: ${st.temperature}°C | RH: ${st.humidity}% | W: ${st.wind_speed} km/h</div>
            </div>`
          )
          .addTo(group);
      });
    }

    // 6. Reservoirs / Dams
    if (layers.reservoirs) {
      reservoirs.forEach((dam) => {
        L.circleMarker([dam.lat, dam.lng], {
          radius: 6,
          color: '#38bdf8',
          weight: 2,
          fillColor: '#0284c7',
          fillOpacity: 0.85,
        })
          .bindPopup(
            `<div dir="${language === 'ar' ? 'rtl' : 'ltr'}">
              <div style="font-weight:700;color:#38bdf8;">${language === 'ar' ? dam.name_ar : dam.name_en}</div>
              <div style="font-family:monospace;font-size:12px;">Fill: ${dam.current_fill_pct}% (${dam.capacity_mcm} Mm³)</div>
            </div>`
          )
          .addTo(group);
      });
    }

    // 7. Encrypted Field Reports
    if (layers.reports) {
      reports.forEach((rep) => {
        L.circleMarker([rep.lat, rep.lng], {
          radius: 6,
          color: '#a855f7',
          weight: 2,
          fillColor: '#c084fc',
          fillOpacity: 0.75,
        })
          .bindPopup(
            `<div dir="${language === 'ar' ? 'rtl' : 'ltr'}" style="max-width:220px;">
              <div style="font-weight:700;font-family:monospace;color:#c084fc;">#${rep.id} · ${rep.encrypted_hash}</div>
              <div style="font-size:11px;color:#cbd5e1;margin:3px 0;">${t.categories[rep.category]}</div>
              <div style="font-size:12px;">${rep.details}</div>
            </div>`
          )
          .addTo(group);
      });
    }
  }, [wilayas, filteredAnomalies, stations, reservoirs, reports, corridors, layers, spectralMode, selectedYear, language, t]);

  return (
    <section aria-labelledby="gis-module-heading" className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 id="gis-module-heading" className="text-xl sm:text-2xl font-bold text-slate-100 text-balance">
            {t.gis.title}
          </h1>
          <p className="text-sm text-slate-400 mt-1">{t.gis.subtitle}</p>
        </div>

        {/* Interactive Anomaly Filter Tabs */}
        <div
          role="group"
          aria-label="Filter spatial anomalies"
          className="flex flex-wrap items-center gap-1 p-1 bg-[#0c121e] border border-slate-800 rounded-lg"
        >
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            aria-pressed={filter === 'ALL'}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              filter === 'ALL' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            {t.gis.filterAll} ({anomalies.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('wildfire_risk')}
            aria-pressed={filter === 'wildfire_risk'}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              filter === 'wildfire_risk' ? 'bg-red-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            {t.anomalies.wildfire_risk}
          </button>
          <button
            type="button"
            onClick={() => setFilter('desertification_hotspot')}
            aria-pressed={filter === 'desertification_hotspot'}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              filter === 'desertification_hotspot' ? 'bg-amber-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            {t.anomalies.desertification_hotspot}
          </button>
          <button
            type="button"
            onClick={() => setFilter('water_stress')}
            aria-pressed={filter === 'water_stress'}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              filter === 'water_stress' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            {t.anomalies.water_stress}
          </button>
        </div>
      </div>

      {/* 4-Column KPI Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0c121e] border border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-400">{t.gis.kpiAnomalies}</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-red-400 mt-1">
            {filteredAnomalies.length}
          </div>
        </div>
        <div className="bg-[#0c121e] border border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-400">{t.gis.kpiStations}</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-cyan-400 mt-1">
            {stations.filter((s) => s.is_active).length}
          </div>
        </div>
        <div className="bg-[#0c121e] border border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-400">
            {t.gis.kpiMeanNdvi} ({selectedYear})
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
            {meanNdviForYear}
          </div>
        </div>
        <div className="bg-[#0c121e] border border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-400">{t.gis.kpiReservoirAvg}</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-sky-400 mt-1">
            {meanReservoirFill}%
          </div>
        </div>
      </div>

      {/* Asymmetric Split Console: Left Control Rail + Main Interactive GIS Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Control & Parameter Column */}
        <aside className="lg:col-span-4 bg-[#0c121e] border border-slate-800 rounded-lg p-5 flex flex-col justify-between gap-5">
          <div className="space-y-5">
            {/* Spectral Index Switcher */}
            <div>
              <div className="text-xs font-semibold text-slate-300 mb-2">{t.gis.spectralMode}</div>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1 rounded-md border border-slate-800">
                {(['NDVI', 'NDWI', 'LST'] as SpectralIndexMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSpectralMode(mode)}
                    aria-pressed={spectralMode === mode}
                    className={`py-1.5 rounded text-xs font-mono font-semibold transition-colors cursor-pointer ${
                      spectralMode === mode
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Historical Time-Series Scrubber */}
            <div className="pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs mb-2">
                <label htmlFor="ndvi-year-scrubber" className="font-semibold text-slate-300">
                  {t.gis.yearScrubber}
                </label>
                <span className="font-mono tabular-nums font-bold text-emerald-400">
                  {selectedYear}
                </span>
              </div>
              <input
                id="ndvi-year-scrubber"
                type="range"
                min={0}
                max={AVAILABLE_YEARS.length - 1}
                step={1}
                value={AVAILABLE_YEARS.indexOf(selectedYear)}
                onChange={(e) => setSelectedYear(AVAILABLE_YEARS[Number(e.target.value)])}
                className="w-full cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-500 mt-1">
                {AVAILABLE_YEARS.map((yr) => (
                  <span key={yr}>{yr}</span>
                ))}
              </div>
            </div>

            {/* GIS Vector Layer Toggles */}
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <div className="text-xs font-semibold text-slate-300">{t.gis.layersTitle}</div>
              {(
                [
                  ['anomalies', t.gis.layerAnomalies, '#ef4444'],
                  ['greenDam', t.gis.layerGreenDam, '#10b981'],
                  ['sandVectors', t.gis.layerSandVectors, '#f59e0b'],
                  ['stations', t.gis.layerStations, '#06b6d4'],
                  ['reservoirs', t.gis.layerReservoirs, '#38bdf8'],
                  ['reports', t.gis.layerReports, '#c084fc'],
                ] as const
              ).map(([key, label, swatch]) => (
                <label
                  key={key}
                  className="flex items-center justify-between text-xs text-slate-300 cursor-pointer hover:text-white"
                >
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="w-2.5 h-2.5 rounded-sm inline-block shrink-0"
                      style={{ backgroundColor: swatch }}
                    />
                    <span>{label}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={layers[key]}
                    onChange={(e) =>
                      setLayers((prev) => ({ ...prev, [key]: e.target.checked }))
                    }
                    className="rounded border-slate-600 bg-slate-900"
                  />
                </label>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-400 pt-3 border-t border-slate-800 leading-relaxed">
            {t.gis.mapHint}
          </p>
        </aside>

        {/* Main Leaflet Map Viewport */}
        <div className="lg:col-span-8 bg-[#0c121e] border border-slate-800 rounded-lg overflow-hidden relative min-h-[460px] lg:min-h-[540px]">
          <div
            ref={mapContainerRef}
            data-testid="tactical-gis-map"
            className="w-full h-full min-h-[460px] lg:min-h-[540px] cursor-crosshair z-0"
          />
        </div>
      </div>

      {/* Wilaya Spectral Telemetry Matrix Table */}
      <div className="bg-[#0c121e] border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">{t.gis.wilayaTableTitle}</h2>
          <span className="text-xs font-mono tabular-nums text-slate-400">
            {selectedYear} · {wilayas.length} Wilayas
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-400 bg-slate-900/50">
                <th className="py-2.5 px-4 text-start font-medium">{t.gis.colWilaya}</th>
                <th className="py-2.5 px-4 text-end font-medium">{t.gis.colNdvi} ({selectedYear})</th>
                <th className="py-2.5 px-4 text-end font-medium">{t.gis.colNdwi}</th>
                <th className="py-2.5 px-4 text-end font-medium">{t.gis.colLst}</th>
                <th className="py-2.5 px-4 text-end font-medium">{t.gis.colDesertFront}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {wilayas.map((w) => {
                const ndvi = w.ndvi_history[selectedYear] ?? w.ndvi_history[2026];
                const name = language === 'ar' ? w.name_ar : language === 'fr' ? w.name_fr : w.name_en;
                return (
                  <tr key={w.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2.5 px-4 font-medium text-slate-200">
                      {name}{' '}
                      <span className="text-xs font-mono text-slate-500">({w.wilaya_code})</span>
                    </td>
                    <td className="py-2.5 px-4 text-end font-mono tabular-nums text-emerald-400">
                      {ndvi.toFixed(3)}
                    </td>
                    <td className="py-2.5 px-4 text-end font-mono tabular-nums text-sky-400">
                      {w.ndwi_current.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-end font-mono tabular-nums text-amber-300">
                      {w.lst_celsius.toFixed(1)} °C
                    </td>
                    <td className="py-2.5 px-4 text-end font-mono tabular-nums text-slate-300">
                      {w.desertification_front_km > 0 ? `${w.desertification_front_km.toFixed(1)} km/yr` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
