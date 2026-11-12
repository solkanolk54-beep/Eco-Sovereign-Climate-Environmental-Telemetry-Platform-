import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { ClimateSeriesPoint } from '../types/telemetry';
import type { TranslationBundle } from '../i18n/translations';
import { simulatePolicyImpact } from '../utils/climateEngine';
import { ClimateAnalyticsDashboard } from './ClimateAnalyticsDashboard';

interface AnalyticsSimulatorViewProps {
  t: TranslationBundle;
  series: {
    d30: ClimateSeriesPoint[];
    y1: ClimateSeriesPoint[];
    y10: ClimateSeriesPoint[];
  };
}

type HorizonKey = 'd30' | 'y1' | 'y10';

export const AnalyticsSimulatorView: React.FC<AnalyticsSimulatorViewProps> = ({ t, series }) => {
  const [horizon, setHorizon] = useState<HorizonKey>('y10');
  const [hoveredPoint, setHoveredPoint] = useState<ClimateSeriesPoint | null>(null);

  const [reforestationHa, setReforestationHa] = useState(250000);
  const [irrigationReductionPct, setIrrigationReductionPct] = useState(35);
  const [groundwaterQuotaPct, setGroundwaterQuotaPct] = useState(20);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const data = series[horizon];

  const simResult = useMemo(
    () =>
      simulatePolicyImpact({
        reforestation_hectares: reforestationHa,
        irrigation_efficiency_pct: irrigationReductionPct,
        groundwater_quota_pct: groundwaterQuotaPct,
      }),
    [reforestationHa, irrigationReductionPct, groundwaterQuotaPct]
  );

  // Render crisp D3 multi-variable climate trend SVG chart
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || !data.length) return;

    const width = 760;
    const height = 280;
    const margin = { top: 20, right: 48, bottom: 32, left: 48 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3
      .scalePoint()
      .domain(data.map((d) => d.label))
      .range([0, innerW])
      .padding(0.2);

    const yTemp = d3
      .scaleLinear()
      .domain([0, Math.max(3.5, d3.max(data, (d) => d.tempAnomalyC) ?? 3.5)])
      .nice()
      .range([innerH, 0]);

    const yWater = d3.scaleLinear().domain([0, 100]).range([innerH, 0]);

    // Horizontal grid lines
    g.append('g')
      .call(d3.axisLeft(yWater).ticks(5).tickSize(-innerW).tickFormat(() => ''))
      .call((sel) => {
        sel.select('.domain').remove();
        sel.selectAll('line').attr('stroke', '#1e293b').attr('stroke-dasharray', '3 3');
      });

    // Axes
    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x))
      .call((sel) => sel.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '11px'))
      .call((sel) => sel.selectAll('line, .domain').attr('stroke', '#334155'));

    g.append('g')
      .call(d3.axisLeft(yTemp).ticks(5))
      .call((sel) => sel.selectAll('text').attr('fill', '#f59e0b').attr('font-size', '11px'))
      .call((sel) => sel.selectAll('line, .domain').attr('stroke', '#334155'));

    g.append('g')
      .attr('transform', `translate(${innerW},0)`)
      .call(d3.axisRight(yWater).ticks(5))
      .call((sel) => sel.selectAll('text').attr('fill', '#38bdf8').attr('font-size', '11px'))
      .call((sel) => sel.selectAll('line, .domain').attr('stroke', '#334155'));

    const tempLine = d3
      .line<ClimateSeriesPoint>()
      .x((d) => x(d.label) ?? 0)
      .y((d) => yTemp(d.tempAnomalyC))
      .curve(d3.curveMonotoneX);

    const waterLine = d3
      .line<ClimateSeriesPoint>()
      .x((d) => x(d.label) ?? 0)
      .y((d) => yWater(d.reservoirFillPct))
      .curve(d3.curveMonotoneX);

    const ndviLine = d3
      .line<ClimateSeriesPoint>()
      .x((d) => x(d.label) ?? 0)
      .y((d) => yWater(d.meanNdvi * 100))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 2.2)
      .attr('d', tempLine);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 2.2)
      .attr('d', waterLine);

    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5 4')
      .attr('d', ndviLine);

    // Interactive hover points
    g.selectAll('circle.data-pt')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'data-pt')
      .attr('cx', (d) => x(d.label) ?? 0)
      .attr('cy', (d) => yTemp(d.tempAnomalyC))
      .attr('r', 4)
      .attr('fill', '#f59e0b')
      .style('cursor', 'pointer')
      .on('mouseenter', (_ev, d) => setHoveredPoint(d))
      .on('mouseleave', () => setHoveredPoint(null));
  }, [data]);

  const activePoint = hoveredPoint ?? data[data.length - 1];

  return (
    <section aria-labelledby="analytics-module-heading" className="space-y-6">
      <div>
        <h1 id="analytics-module-heading" className="text-xl sm:text-2xl font-bold text-slate-100 text-balance">
          {t.analytics.title}
        </h1>
        <p className="text-sm text-slate-400 mt-1">{t.analytics.subtitle}</p>
      </div>

      {/* D3 Multi-Variable Climate Trajectory Card */}
      <div className="bg-[#0c121e] border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-200">{t.analytics.chartTitle}</h2>

          <div
            role="group"
            aria-label="Chart time horizon"
            className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-md"
          >
            {(
              [
                ['d30', t.analytics.range30d],
                ['y1', t.analytics.range1y],
                ['y10', t.analytics.range10y],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setHorizon(key);
                  setHoveredPoint(null);
                }}
                aria-pressed={horizon === key}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  horizon === key ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Live Telemetry Readout Bar */}
        {activePoint && (
          <div className="flex flex-wrap items-center gap-6 text-xs border-y border-slate-800/80 py-2.5">
            <span className="font-mono font-bold text-slate-200">{activePoint.label}</span>
            <span className="text-amber-400 font-mono tabular-nums">
              {t.analytics.metricTemp}: +{activePoint.tempAnomalyC.toFixed(2)} °C
            </span>
            <span className="text-emerald-400 font-mono tabular-nums">
              {t.analytics.metricNdvi}: {activePoint.meanNdvi.toFixed(3)}
            </span>
            <span className="text-sky-400 font-mono tabular-nums">
              {t.analytics.metricWater}: {activePoint.reservoirFillPct.toFixed(1)}%
            </span>
          </div>
        )}

        <div className="w-full overflow-x-auto">
          <svg
            ref={svgRef}
            data-testid="d3-climate-chart"
            viewBox="0 0 760 280"
            className="w-full h-auto min-w-[540px]"
          />
        </div>
      </div>

      {/* Climate Analytics Observatory (FWI vs Water Stress + NDVI Area Trend) */}
      <ClimateAnalyticsDashboard t={t} points={data} />

      {/* 2035 Policy Intervention Simulator */}
      <div className="bg-[#0c121e] border border-slate-800 rounded-lg p-5 space-y-5">
        <h2 className="text-sm font-semibold text-slate-200">{t.analytics.simulatorTitle}</h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6 space-y-5">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label htmlFor="sim-reforest" className="text-slate-300">
                  {t.analytics.sliderReforestation}
                </label>
                <span className="font-mono tabular-nums text-emerald-400 font-semibold">
                  {reforestationHa.toLocaleString()} ha
                </span>
              </div>
              <input
                id="sim-reforest"
                type="range"
                min={0}
                max={500000}
                step={10000}
                value={reforestationHa}
                onChange={(e) => setReforestationHa(Number(e.target.value))}
                className="w-full cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label htmlFor="sim-irrigation" className="text-slate-300">
                  {t.analytics.sliderIrrigation}
                </label>
                <span className="font-mono tabular-nums text-sky-400 font-semibold">
                  {irrigationReductionPct}%
                </span>
              </div>
              <input
                id="sim-irrigation"
                type="range"
                min={0}
                max={60}
                step={2}
                value={irrigationReductionPct}
                onChange={(e) => setIrrigationReductionPct(Number(e.target.value))}
                className="w-full cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <label htmlFor="sim-groundwater" className="text-slate-300">
                  {t.analytics.sliderGroundwater}
                </label>
                <span className="font-mono tabular-nums text-amber-400 font-semibold">
                  {groundwaterQuotaPct}%
                </span>
              </div>
              <input
                id="sim-groundwater"
                type="range"
                min={0}
                max={40}
                step={2}
                value={groundwaterQuotaPct}
                onChange={(e) => setGroundwaterQuotaPct(Number(e.target.value))}
                className="w-full cursor-pointer"
              />
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="border border-slate-800 bg-slate-900/40 rounded-md p-4">
              <div className="text-xs text-slate-400">{t.analytics.outCarbon}</div>
              <div
                data-testid="sim-carbon-output"
                className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1"
              >
                {simResult.carbon_sequestration_kt_yr} kt/yr
              </div>
            </div>
            <div className="border border-slate-800 bg-slate-900/40 rounded-md p-4">
              <div className="text-xs text-slate-400">{t.analytics.outWaterResilience}</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-sky-400 mt-1">
                +{simResult.water_resilience_gain_pct}%
              </div>
            </div>
            <div className="border border-slate-800 bg-slate-900/40 rounded-md p-4">
              <div className="text-xs text-slate-400">{t.analytics.outDesertHalted}</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-amber-300 mt-1">
                {simResult.desertification_halted_km2.toLocaleString()} km²
              </div>
            </div>
            <div className="border border-slate-800 bg-slate-900/40 rounded-md p-4">
              <div className="text-xs text-slate-400">{t.analytics.outNdviDelta}</div>
              <div className="text-2xl font-bold font-mono tabular-nums text-emerald-300 mt-1">
                +{simResult.projected_ndvi_delta.toFixed(3)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
