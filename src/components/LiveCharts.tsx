import { useState, useMemo } from 'react';
import { Activity } from 'lucide-react';
import type { TelemetryData } from '../types';

interface LiveChartsProps {
  samples: TelemetryData[];
  threshold: number;
}

export const LiveCharts: React.FC<LiveChartsProps> = ({ samples, threshold }) => {
  const [timeWindow, setTimeWindow] = useState<'60s' | '5m'>('60s');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Filter samples based on time window
  const activeSamples = useMemo(() => {
    if (timeWindow === '60s') {
      return samples.slice(-60);
    }
    return samples.slice(-300);
  }, [samples, timeWindow]);

  const count = activeSamples.length;
  const latestSample = count > 0 ? activeSamples[count - 1] : null;

  // Chart dimensions
  const chartWidth = 900;
  const chartHeight = 180;
  const padding = { top: 20, right: 30, bottom: 25, left: 45 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // X coordinate mapper
  const getX = (index: number) => {
    if (count <= 1) return padding.left;
    return padding.left + (index / (count - 1)) * innerWidth;
  };

  // 1. Chart A: East vs West (Range 0 - 1023)
  const getY_LDR = (val: number) => {
    const clamped = Math.max(0, Math.min(1023, val));
    return padding.top + innerHeight - (clamped / 1023) * innerHeight;
  };

  // 2. Chart B: Diff (Range -200 to +200)
  const diffMin = -150;
  const diffMax = 150;
  const getY_Diff = (val: number) => {
    const clamped = Math.max(diffMin, Math.min(diffMax, val));
    const normalized = (clamped - diffMin) / (diffMax - diffMin);
    return padding.top + innerHeight - normalized * innerHeight;
  };

  // 3. Chart C: Angles (Range 30 to 150)
  const angleMin = 25;
  const angleMax = 155;
  const getY_Angle = (val: number) => {
    const clamped = Math.max(angleMin, Math.min(angleMax, val));
    const normalized = (clamped - angleMin) / (angleMax - angleMin);
    return padding.top + innerHeight - normalized * innerHeight;
  };

  // Generate SVG path strings
  const eastPath = activeSamples.map((s, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY_LDR(s.east).toFixed(1)}`).join(' ');
  const westPath = activeSamples.map((s, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY_LDR(s.west).toFixed(1)}`).join(' ');
  
  const diffPath = activeSamples.map((s, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY_Diff(s.diff).toFixed(1)}`).join(' ');

  const servoPath = activeSamples.map((s, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY_Angle(s.servo).toFixed(1)}`).join(' ');
  const targetPath = activeSamples.map((s, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY_Angle(s.target).toFixed(1)}`).join(' ');
  
  const hasSun = activeSamples.some((s) => s.sun !== null);
  const sunPath = hasSun
    ? activeSamples
        .filter((s) => s.sun !== null)
        .map((s, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY_Angle(s.sun!).toFixed(1)}`)
        .join(' ')
    : '';

  // Hovered Sample
  const hoveredSample = hoverIndex !== null && hoverIndex < count ? activeSamples[hoverIndex] : latestSample;

  return (
    <div className="card-clean p-6 flex flex-col gap-6 bg-white">
      
      {/* Top Header & Window Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Activity className="w-4 h-4" />
          </span>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Real-time Telemetry Waveforms</h3>
            <p className="text-xs text-slate-400">High-frequency 60fps rolling optical and angular tracking streams</p>
          </div>
        </div>

        {/* 60s vs 5min Toggle Button */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setTimeWindow('60s')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              timeWindow === '60s'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Last 60s ({Math.min(60, count)} pts)
          </button>
          <button
            onClick={() => setTimeWindow('5m')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              timeWindow === '5m'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Last 5 Min ({count} pts)
          </button>
        </div>
      </div>

      {count === 0 ? (
        <div className="py-16 text-center text-slate-400 font-medium text-sm flex flex-col items-center gap-2">
          <Activity className="w-8 h-8 opacity-40 animate-pulse" />
          <span>Waiting for incoming Arduino telemetry samples...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-6">

          {/* ---------------- CHART A: East vs West LDR ---------------- */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Chart A: East vs West LDR Intensity (0-1023)
              </div>
              <div className="flex items-center gap-4 text-xs font-mono font-bold">
                <div className="flex items-center gap-1.5 text-blue-600">
                  <span className="w-3 h-1 rounded-full bg-blue-500" />
                  <span>East: <strong>{hoveredSample?.east ?? '--'}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-teal-600">
                  <span className="w-3 h-1 rounded-full bg-teal-500" />
                  <span>West: <strong>{hoveredSample?.west ?? '--'}</strong></span>
                </div>
              </div>
            </div>

            <div className="w-full relative overflow-hidden">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto select-none"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const xRel = e.clientX - rect.left;
                  const ratio = Math.max(0, Math.min(1, (xRel - (padding.left / chartWidth) * rect.width) / ((innerWidth / chartWidth) * rect.width)));
                  const idx = Math.round(ratio * (count - 1));
                  setHoverIndex(idx);
                }}
                onMouseLeave={() => setHoverIndex(null)}
              >
                {/* Horizontal grid lines */}
                {[0, 256, 512, 768, 1023].map((val) => {
                  const y = getY_LDR(val);
                  return (
                    <g key={val}>
                      <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
                      <text x={padding.left - 8} y={y + 3} textAnchor="end" className="text-[10px] font-mono fill-slate-400 font-bold">{val}</text>
                    </g>
                  );
                })}

                {/* East Waveform Line */}
                <path d={eastPath} fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {/* West Waveform Line */}
                <path d={westPath} fill="none" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Scrubber vertical line */}
                {hoverIndex !== null && hoverIndex < count && (
                  <g>
                    <line x1={getX(hoverIndex)} y1={padding.top} x2={getX(hoverIndex)} y2={padding.top + innerHeight} stroke="#64748B" strokeWidth="1.5" strokeDasharray="2 2" />
                    <circle cx={getX(hoverIndex)} cy={getY_LDR(activeSamples[hoverIndex].east)} r="4" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx={getX(hoverIndex)} cy={getY_LDR(activeSamples[hoverIndex].west)} r="4" fill="#0D9488" stroke="#FFFFFF" strokeWidth="2" />
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* ---------------- CHART B: Differential & Threshold ---------------- */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Chart B: Differential (Diff = East - West) & Deadband (±{threshold})
              </div>
              <div className="flex items-center gap-4 text-xs font-mono font-bold">
                <div className="flex items-center gap-1.5 text-emerald-600">
                  <span className="w-3 h-0.5 border-t border-dashed border-emerald-500" />
                  <span>Threshold: ±{threshold}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-800">
                  <span className="w-3 h-1 rounded-full bg-amber-500" />
                  <span>Diff: <strong className={hoveredSample && Math.abs(hoveredSample.diff) > threshold ? 'text-amber-600' : 'text-emerald-600'}>{hoveredSample ? hoveredSample.diff : '--'}</strong></span>
                </div>
              </div>
            </div>

            <div className="w-full relative overflow-hidden">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto select-none"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const xRel = e.clientX - rect.left;
                  const ratio = Math.max(0, Math.min(1, (xRel - (padding.left / chartWidth) * rect.width) / ((innerWidth / chartWidth) * rect.width)));
                  const idx = Math.round(ratio * (count - 1));
                  setHoverIndex(idx);
                }}
                onMouseLeave={() => setHoverIndex(null)}
              >
                {/* Zero line */}
                <line x1={padding.left} y1={getY_Diff(0)} x2={chartWidth - padding.right} y2={getY_Diff(0)} stroke="#94A3B8" strokeWidth="1.5" />
                <text x={padding.left - 8} y={getY_Diff(0) + 3} textAnchor="end" className="text-[10px] font-mono fill-slate-500 font-bold">0</text>

                {/* Upper Threshold (+threshold) dashed */}
                <line x1={padding.left} y1={getY_Diff(threshold)} x2={chartWidth - padding.right} y2={getY_Diff(threshold)} stroke="#10B981" strokeWidth="1.5" strokeDasharray="4 3" />
                <text x={chartWidth - padding.right + 5} y={getY_Diff(threshold) + 3} className="text-[10px] font-mono fill-emerald-600 font-bold">+{threshold}</text>

                {/* Lower Threshold (-threshold) dashed */}
                <line x1={padding.left} y1={getY_Diff(-threshold)} x2={chartWidth - padding.right} y2={getY_Diff(-threshold)} stroke="#10B981" strokeWidth="1.5" strokeDasharray="4 3" />
                <text x={chartWidth - padding.right + 5} y={getY_Diff(-threshold) + 3} className="text-[10px] font-mono fill-emerald-600 font-bold">-{threshold}</text>

                {/* Deadband shaded zone between -th and +th */}
                <rect
                  x={padding.left}
                  y={getY_Diff(threshold)}
                  width={innerWidth}
                  height={Math.abs(getY_Diff(-threshold) - getY_Diff(threshold))}
                  fill="#10B981"
                  fillOpacity="0.06"
                />

                {/* Diff Waveform */}
                <path d={diffPath} fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Scrubber */}
                {hoverIndex !== null && hoverIndex < count && (
                  <g>
                    <line x1={getX(hoverIndex)} y1={padding.top} x2={getX(hoverIndex)} y2={padding.top + innerHeight} stroke="#64748B" strokeWidth="1.5" strokeDasharray="2 2" />
                    <circle cx={getX(hoverIndex)} cy={getY_Diff(activeSamples[hoverIndex].diff)} r="4" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" />
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* ---------------- CHART C: Angles & Convergence ---------------- */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Chart C: Servo vs Target Angle Convergence (30° - 150°)
              </div>
              <div className="flex items-center gap-4 text-xs font-mono font-bold">
                {hasSun && (
                  <div className="flex items-center gap-1.5 text-amber-600">
                    <span className="w-3 h-1 rounded-full bg-amber-500" />
                    <span>Sun: <strong>{hoveredSample?.sun ? `${hoveredSample.sun}°` : '--'}</strong></span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-slate-900">
                  <span className="w-3 h-1 rounded-full bg-slate-900" />
                  <span>Servo: <strong>{hoveredSample?.servo ?? '--'}°</strong></span>
                </div>
                <div className="flex items-center gap-1.5 text-indigo-600">
                  <span className="w-3 h-0.5 border-t-2 border-dashed border-indigo-600" />
                  <span>Target: <strong>{hoveredSample?.target ?? '--'}°</strong></span>
                </div>
              </div>
            </div>

            <div className="w-full relative overflow-hidden">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto select-none"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const xRel = e.clientX - rect.left;
                  const ratio = Math.max(0, Math.min(1, (xRel - (padding.left / chartWidth) * rect.width) / ((innerWidth / chartWidth) * rect.width)));
                  const idx = Math.round(ratio * (count - 1));
                  setHoverIndex(idx);
                }}
                onMouseLeave={() => setHoverIndex(null)}
              >
                {/* Horizontal angle grid lines: 30, 60, 90, 120, 150 */}
                {[30, 60, 90, 120, 150].map((deg) => {
                  const y = getY_Angle(deg);
                  return (
                    <g key={deg}>
                      <line x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke={deg === 90 ? "#94A3B8" : "#E2E8F0"} strokeWidth={deg === 90 ? "1.5" : "1"} strokeDasharray={deg === 90 ? "" : "3 3"} />
                      <text x={padding.left - 8} y={y + 3} textAnchor="end" className="text-[10px] font-mono fill-slate-500 font-bold">{deg}°</text>
                    </g>
                  );
                })}

                {/* Sun Path (if demo mode) */}
                {hasSun && sunPath && (
                  <path d={sunPath} fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 3" opacity="0.9" />
                )}

                {/* Target Path (dashed indigo) */}
                <path d={targetPath} fill="none" stroke="#6366F1" strokeWidth="2" strokeDasharray="4 2" />

                {/* Actual Servo Path (solid slate) */}
                <path d={servoPath} fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                {/* Scrubber */}
                {hoverIndex !== null && hoverIndex < count && (
                  <g>
                    <line x1={getX(hoverIndex)} y1={padding.top} x2={getX(hoverIndex)} y2={padding.top + innerHeight} stroke="#64748B" strokeWidth="1.5" strokeDasharray="2 2" />
                    <circle cx={getX(hoverIndex)} cy={getY_Angle(activeSamples[hoverIndex].servo)} r="4" fill="#0F172A" stroke="#FFFFFF" strokeWidth="2" />
                    <circle cx={getX(hoverIndex)} cy={getY_Angle(activeSamples[hoverIndex].target)} r="4" fill="#6366F1" stroke="#FFFFFF" strokeWidth="2" />
                  </g>
                )}
              </svg>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
