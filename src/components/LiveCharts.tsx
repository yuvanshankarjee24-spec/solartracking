import { useState, useMemo } from 'react';
import { Activity } from 'lucide-react';
import type { TelemetryData } from '../types';

interface LiveChartsProps {
  samples: TelemetryData[];
}

export const LiveCharts: React.FC<LiveChartsProps> = ({ samples }) => {
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

  // Chart: East vs West (Range 0 - 1023)
  const getY_LDR = (val: number) => {
    const clamped = Math.max(0, Math.min(1023, val));
    return padding.top + innerHeight - (clamped / 1023) * innerHeight;
  };

  // Generate SVG path strings
  const eastPath = activeSamples.map((s, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY_LDR(s.east).toFixed(1)}`).join(' ');
  const westPath = activeSamples.map((s, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY_LDR(s.west).toFixed(1)}`).join(' ');

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
            <p className="text-xs text-slate-400">High-frequency 60fps rolling optical tracking stream</p>
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

          {/* ---------------- East vs West LDR ---------------- */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                East vs West LDR Intensity (0-1023)
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

        </div>
      )}

    </div>
  );
};
