import React from 'react';
import { SlidersHorizontal, ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';

interface LDRComparisonCardProps {
  east: number;       // 0-1023
  west: number;       // 0-1023
  diff: number;       // East - West
  threshold: number;  // Deadband threshold
}

export const LDRComparisonCard: React.FC<LDRComparisonCardProps> = ({
  east,
  west,
  diff,
  threshold,
}) => {
  // Compute percentages
  const eastPercent = Math.min(100, Math.max(0, Math.round((east / 1023) * 100)));
  const westPercent = Math.min(100, Math.max(0, Math.round((west / 1023) * 100)));

  // Status message logic
  let statusMessage = "Balanced, holding";
  let statusColor = "bg-emerald-50 text-emerald-800 border-emerald-300";
  let isBalanced = Math.abs(diff) <= threshold;

  if (diff > threshold) {
    statusMessage = "East is brighter, rotating east";
    statusColor = "bg-blue-50 text-blue-800 border-blue-300";
  } else if (diff < -threshold) {
    statusMessage = "West is brighter, rotating west";
    statusColor = "bg-teal-50 text-teal-800 border-teal-300";
  }

  // Balance meter position mapping
  // Map diff from -150 to +150 into 0% - 100% (center 50%)
  const maxSpan = 150;
  const clampedDiff = Math.max(-maxSpan, Math.min(maxSpan, diff));
  // Note: if East is brighter (diff > 0), moves left towards East bar;
  // If West is brighter (diff < 0), moves right towards West bar.
  // 50% - (clampedDiff / maxSpan) * 45%
  const sliderPositionPct = 50 - (clampedDiff / maxSpan) * 45;

  // Deadband width in percentage: [-threshold, +threshold]
  const deadbandHalfWidthPct = Math.min(45, (threshold / maxSpan) * 45);

  return (
    <div className="card-clean p-6 flex flex-col justify-between bg-white">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
            <SlidersHorizontal className="w-4 h-4" />
          </span>
          <h3 className="font-bold text-slate-800 text-base">Dual-LDR Light Sensors</h3>
        </div>

        <div className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
          Δ Diff: <span className={`font-bold ${Math.abs(diff) > threshold ? 'text-amber-600' : 'text-emerald-600'}`}>{diff > 0 ? `+${diff}` : diff}</span>
        </div>
      </div>

      {/* Main Bar Meters & Horizontal Balance Area */}
      <div className="grid grid-cols-12 gap-4 items-center my-3">
        
        {/* East LDR Bar (Blue) */}
        <div className="col-span-3 flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>East LDR</span>
          </div>

          {/* Bar track */}
          <div className="relative w-14 h-48 bg-slate-100 rounded-2xl p-1.5 border border-slate-200 shadow-inner flex flex-col justify-end overflow-hidden">
            {/* Fill */}
            <div
              className="w-full rounded-xl bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-300 shadow-sm"
              style={{ height: `${eastPercent}%` }}
            />
            {/* Value Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-between py-2 text-center pointer-events-none">
              <span className="text-[10px] font-mono font-bold text-slate-400">1023</span>
              <div className="bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded shadow-xs">
                <span className="font-mono text-xs font-extrabold text-blue-900">{eastPercent}%</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400">0</span>
            </div>
          </div>

          {/* Digits below bar */}
          <div className="mt-2 text-center">
            <div className="font-mono text-xl font-black text-blue-700 leading-tight">
              {east}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">ADC (10-bit)</div>
          </div>
        </div>

        {/* Center Horizontal Balance Meter */}
        <div className="col-span-6 flex flex-col items-center px-1">
          <div className="w-full text-center mb-1">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Optical Equilibrium Meter
            </span>
          </div>

          {/* Balance Slider Track */}
          <div className="w-full my-3">
            <div className="flex justify-between text-[11px] font-mono text-slate-500 font-bold mb-1 px-1">
              <span className="text-blue-600 flex items-center gap-0.5"><ArrowLeft className="w-3 h-3" /> East Brighter</span>
              <span className="text-teal-600 flex items-center gap-0.5">West Brighter <ArrowRight className="w-3 h-3" /></span>
            </div>

            <div className="relative w-full h-9 bg-slate-100 rounded-xl border border-slate-300 shadow-inner overflow-hidden flex items-center">
              
              {/* Deadzone Shaded Green Center Area */}
              <div
                className="absolute h-full bg-emerald-100/90 border-x border-emerald-400/80 flex items-center justify-center transition-all"
                style={{
                  left: `${50 - deadbandHalfWidthPct}%`,
                  width: `${deadbandHalfWidthPct * 2}%`,
                }}
              >
                <span className="text-[9px] font-mono font-black text-emerald-800 tracking-tighter uppercase opacity-80">
                  Deadband (±{threshold})
                </span>
              </div>

              {/* Zero Center Line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-slate-400/70 -translate-x-1/2 z-0" />

              {/* Sliding Balance Knob / Pill */}
              <div
                className={`absolute top-1 bottom-1 w-9 -ml-4.5 rounded-lg flex items-center justify-center text-white font-mono text-xs font-bold shadow-md transition-all duration-300 z-10 ${
                  isBalanced
                    ? 'bg-emerald-500 shadow-emerald-500/30'
                    : 'bg-amber-500 shadow-amber-500/40 animate-pulse'
                }`}
                style={{ left: `${sliderPositionPct}%` }}
              >
                {diff === 0 ? '0' : diff > 0 ? `+${diff}` : diff}
              </div>
            </div>

            <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
              <span>+150</span>
              <span>0 (Null point)</span>
              <span>-150</span>
            </div>
          </div>

          {/* Plain-English Status Message Banner */}
          <div className={`w-full py-2 px-3 rounded-xl border text-center text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all ${statusColor}`}>
            {isBalanced ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            )}
            <span className="tracking-tight">{statusMessage}</span>
          </div>

        </div>

        {/* West LDR Bar (Teal) */}
        <div className="col-span-3 flex flex-col items-center">
          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 uppercase tracking-wider mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
            <span>West LDR</span>
          </div>

          {/* Bar track */}
          <div className="relative w-14 h-48 bg-slate-100 rounded-2xl p-1.5 border border-slate-200 shadow-inner flex flex-col justify-end overflow-hidden">
            {/* Fill */}
            <div
              className="w-full rounded-xl bg-gradient-to-t from-teal-600 to-teal-400 transition-all duration-300 shadow-sm"
              style={{ height: `${westPercent}%` }}
            />
            {/* Value Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-between py-2 text-center pointer-events-none">
              <span className="text-[10px] font-mono font-bold text-slate-400">1023</span>
              <div className="bg-white/90 backdrop-blur-xs px-1.5 py-0.5 rounded shadow-xs">
                <span className="font-mono text-xs font-extrabold text-teal-900">{westPercent}%</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400">0</span>
            </div>
          </div>

          {/* Digits below bar */}
          <div className="mt-2 text-center">
            <div className="font-mono text-xl font-black text-teal-700 leading-tight">
              {west}
            </div>
            <div className="text-[10px] text-slate-400 font-medium">ADC (10-bit)</div>
          </div>
        </div>

      </div>

    </div>
  );
};
