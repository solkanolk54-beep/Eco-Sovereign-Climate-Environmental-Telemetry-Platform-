import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import type { ClimateSeriesPoint } from '../types/telemetry';
import type { TranslationBundle } from '../i18n/translations';
import { computeClimateAnalyticsKpis } from '../utils/climateEngine';

interface ClimateAnalyticsDashboardProps {
  t: TranslationBundle;
  points: ClimateSeriesPoint[];
}

interface HoveredTrendPoint {
  label: string;
  fwi: number;
  waterStress: number;
  ndvi: number;
}

export const ClimateAnalyticsDashboard: React.FC<ClimateAnalyticsDashboardProps> = ({
  t,
  points,
}) => {
  const fwiSvgRef = useRef<SVGSVGElement | null>(null);
  const ndviSvgRef = useRef<SVGSVGElement | null>(null);
  const ndviGradientId = useId();
  const [hoveredFwiPoint, setHoveredFwiPoint] = useState<HoveredTrendPoint | null>(null);
  const [hoveredNdviPoint, setHoveredNdviPoint] = useState<HoveredTrendPoint | null>(null);

  const chartData = useMemo<HoveredTrendPoint[]>(
    () =>
      points.map((pt) => ({
        label: pt.label,
        fwi: pt.fwiMean,
        waterStress: Number((100 - pt.reservoirFillPct).toFixed(1)),
        ndvi: pt.meanNdvi,
      })),
    [points]
  );

  const kpis = useMemo(() => computeClimateAnalyticsKpis(points), [points]);

  // 1. D3 Dual-Series Line Chart: Fire Weather Index (FWI) vs Water Stress (%)
  useEffect(() => {
    const svgEl = fwiSvgRef.current;
    if (!svgEl || chartData.length === 0) return;

    const width = 560;
    const height = 240;
    const margin = { top: 18, right: 20, bottom: 30, left: 38 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3
      .scalePoint()
      .domain(chartData.map((d) => d.label))
      .range([0, innerW])
      .padding(0.15);

    const y = d3.scaleLinear().domain([0, 100]).range([innerH, 0]);

    // Subtle horizontal gridlines
    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(() => ''))
      .call((sel) => {
        sel.select('.domain').remove();
        sel.selectAll('line').attr('stroke', '#1e293b').attr('stroke-dasharray', '3 3');
      });

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x))
      .call((sel) => sel.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px'))
      .call((sel) => sel.selectAll('line, .domain').attr('stroke', '#334155'));

    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .call((sel) => sel.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px'))
      .call((sel) => sel.selectAll('line, .domain').attr('stroke', '#334155'));

    const fwiLine = d3
      .line<HoveredTrendPoint>()
      .x((d) => x(d.label) ?? 0)
      .y((d) => y(d.fwi))
      .curve(d3.curveMonotoneX);

    const stressLine = d3
      .line<HoveredTrendPoint>()
      .x((d) => x(d.label) ?? 0)
      .y((d) => y(d.waterStress))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(chartData)
      .attr('fill', 'none')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 2.2)
      .attr('d', fwiLine);

    g.append('path')
      .datum(chartData)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2.2)
      .attr('d', stressLine);

    // Interactive hover targets
    g.selectAll('circle.fwi-dot')
      .data(chartData)
      .enter()
      .append('circle')
      .attr('class', 'fwi-dot')
      .attr('cx', (d) => x(d.label) ?? 0)
      .attr('cy', (d) => y(d.fwi))
      .attr('r', 4)
      .attr('fill', '#ef4444')
      .style('cursor', 'pointer')
      .on('mouseenter', (_ev, d) => setHoveredFwiPoint(d))
      .on('mouseleave', () => setHoveredFwiPoint(null));

    g.selectAll('circle.stress-dot')
      .data(chartData)
      .enter()
      .append('circle')
      .attr('class', 'stress-dot')
      .attr('cx', (d) => x(d.label) ?? 0)
      .attr('cy', (d) => y(d.waterStress))
      .attr('r', 3.5)
      .attr('fill', '#3b82f6')
      .style('cursor', 'pointer')
      .on('mouseenter', (_ev, d) => setHoveredFwiPoint(d))
      .on('mouseleave', () => setHoveredFwiPoint(null));
  }, [chartData]);

  // 2. D3 Area Chart: NDVI Vegetation Index Trend
  useEffect(() => {
    const svgEl = ndviSvgRef.current;
    if (!svgEl || chartData.length === 0) return;

    const width = 560;
    const height = 240;
    const margin = { top: 18, right: 20, bottom: 30, left: 42 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const defs = svg.append('defs');
    const grad = defs
      .append('linearGradient')
      .attr('id', ndviGradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#10b981').attr('stop-opacity', 0.35);
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#10b981').attr('stop-opacity', 0.02);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3
      .scalePoint()
      .domain(chartData.map((d) => d.label))
      .range([0, innerW])
      .padding(0.15);

    const minNdvi = Math.max(0, (d3.min(chartData, (d) => d.ndvi) ?? 0) - 0.05);
    const maxNdvi = Math.min(1, (d3.max(chartData, (d) => d.ndvi) ?? 0.7) + 0.05);
    const y = d3.scaleLinear().domain([minNdvi, maxNdvi]).nice().range([innerH, 0]);

    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(() => ''))
      .call((sel) => {
        sel.select('.domain').remove();
        sel.selectAll('line').attr('stroke', '#1e293b').attr('stroke-dasharray', '3 3');
      });

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x))
      .call((sel) => sel.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px'))
      .call((sel) => sel.selectAll('line, .domain').attr('stroke', '#334155'));

    g.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .call((sel) => sel.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px'))
      .call((sel) => sel.selectAll('line, .domain').attr('stroke', '#334155'));

    const areaGen = d3
      .area<HoveredTrendPoint>()
      .x((d) => x(d.label) ?? 0)
      .y0(innerH)
      .y1((d) => y(d.ndvi))
      .curve(d3.curveMonotoneX);

    const lineGen = d3
      .line<HoveredTrendPoint>()
      .x((d) => x(d.label) ?? 0)
      .y((d) => y(d.ndvi))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(chartData)
      .attr('fill', `url(#${ndviGradientId})`)
      .attr('d', areaGen);

    g.append('path')
      .datum(chartData)
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2.2)
      .attr('d', lineGen);

    g.selectAll('circle.ndvi-dot')
      .data(chartData)
      .enter()
      .append('circle')
      .attr('class', 'ndvi-dot')
      .attr('cx', (d) => x(d.label) ?? 0)
      .attr('cy', (d) => y(d.ndvi))
      .attr('r', 4)
      .attr('fill', '#10b981')
      .style('cursor', 'pointer')
      .on('mouseenter', (_ev, d) => setHoveredNdviPoint(d))
      .on('mouseleave', () => setHoveredNdviPoint(null));
  }, [chartData, ndviGradientId]);

  const activeFwi = hoveredFwiPoint ?? chartData[chartData.length - 1];
  const activeNdvi = hoveredNdviPoint ?? chartData[chartData.length - 1];

  return (
    <div
      data-testid="climate-analytics-dashboard"
      className="space-y-6"
    >
      {/* Observatory Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-emerald-400">{t.climateDashboard.title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">{t.climateDashboard.subtitle}</p>
        </div>
        <div
          className={`inline-flex items-center gap-2 text-xs font-mono font-medium ${
            kpis.earlyWarningActive ? 'text-amber-300' : 'text-emerald-300'
          }`}
        >
          {kpis.earlyWarningActive ? (
            <AlertTriangle className="w-4 h-4 text-amber-400" aria-hidden="true" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          )}
          <span>
            {kpis.earlyWarningActive
              ? t.climateDashboard.statusWarning
              : t.climateDashboard.statusNominal}
          </span>
        </div>
      </div>

      {/* 3 KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0c121e] border border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-400 mb-1.5">{t.climateDashboard.kpiFwiTitle}</div>
          <div className="flex items-baseline justify-between gap-2">
            <span
              dir="ltr"
              className="text-2xl font-bold font-mono tabular-nums text-red-400"
            >
              {kpis.meanFwi.toFixed(1)} / 100
            </span>
            <span className="text-xs text-red-300 font-mono tabular-nums">
              {kpis.fwiDeltaPct >= 0 ? '+' : ''}
              {kpis.fwiDeltaPct}% · {t.climateDashboard.kpiFwiNote}
            </span>
          </div>
        </div>

        <div className="bg-[#0c121e] border border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-400 mb-1.5">{t.climateDashboard.kpiNdviTitle}</div>
          <div className="flex items-baseline justify-between gap-2">
            <span
              dir="ltr"
              className="text-2xl font-bold font-mono tabular-nums text-amber-400"
            >
              {kpis.latestNdvi.toFixed(2)}
            </span>
            <span className="text-xs text-amber-300 font-mono tabular-nums">
              {kpis.ndviDelta >= 0 ? '+' : ''}
              {kpis.ndviDelta.toFixed(3)} · {t.climateDashboard.kpiNdviNote}
            </span>
          </div>
        </div>

        <div className="bg-[#0c121e] border border-slate-800 rounded-lg p-4">
          <div className="text-xs text-slate-400 mb-1.5">{t.climateDashboard.kpiWaterTitle}</div>
          <div className="flex items-baseline justify-between gap-2">
            <span
              dir="ltr"
              className="text-2xl font-bold font-mono tabular-nums text-sky-400"
            >
              {kpis.waterStressPct}%
            </span>
            <span className="text-xs text-sky-300 font-mono tabular-nums">
              {kpis.waterStressDelta >= 0 ? '+' : ''}
              {kpis.waterStressDelta}% · {t.climateDashboard.kpiWaterNote}
            </span>
          </div>
        </div>
      </div>

      {/* Dual D3 Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: FWI Risk vs Water Stress */}
        <div className="bg-[#0c121e] border border-slate-800 rounded-lg p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-200">
              {t.climateDashboard.fwiChartTitle}
            </h3>
            {activeFwi && (
              <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
                <span className="text-slate-300">{activeFwi.label}</span>
                <span className="text-red-400">FWI {activeFwi.fwi.toFixed(1)}</span>
                <span className="text-sky-400">Stress {activeFwi.waterStress}%</span>
              </div>
            )}
          </div>
          <div className="w-full overflow-x-auto">
            <svg
              ref={fwiSvgRef}
              data-testid="d3-fwi-stress-chart"
              viewBox="0 0 560 240"
              className="w-full h-auto min-w-[420px]"
            />
          </div>
        </div>

        {/* Chart 2: NDVI Index Trend Area Chart */}
        <div className="bg-[#0c121e] border border-slate-800 rounded-lg p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-200">
              {t.climateDashboard.ndviChartTitle}
            </h3>
            {activeNdvi && (
              <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
                <span className="text-slate-300">{activeNdvi.label}</span>
                <span className="text-emerald-400">NDVI {activeNdvi.ndvi.toFixed(3)}</span>
              </div>
            )}
          </div>
          <div className="w-full overflow-x-auto">
            <svg
              ref={ndviSvgRef}
              data-testid="d3-ndvi-area-chart"
              viewBox="0 0 560 240"
              className="w-full h-auto min-w-[420px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
