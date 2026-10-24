import { 
  Sun, 
  CloudSun, 
  Moon, 
  Cloud, 
  RotateCw, 
  GitFork, 
  Flame, 
  Timer, 
  TrendingUp
} from 'lucide-react';
import type { SmartMetrics } from '../types';

interface SmartMetricsRowProps {
  metrics: SmartMetrics;
}

export const SmartMetricsRow: React.FC<SmartMetricsRowProps> = ({ metrics }) => {
  // Light level icon helper
  const getLightIcon = () => {
    switch (metrics.lightLevel) {
      case 'Bright':
        return <Sun className="w-5 h-5 text-amber-500" />;
      case 'Partly Sunny':
        return <CloudSun className="w-5 h-5 text-amber-400" />;
      case 'Cloudy':
        return <Cloud className="w-5 h-5 text-slate-400" />;
      case 'Dark':
      default:
        return <Moon className="w-5 h-5 text-indigo-400" />;
    }
  };

  // Lock status color helper
  const getLockBadgeStyle = () => {
    switch (metrics.lockState) {
      case 'LOCKED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'TRACKING':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'SEARCHING':
      default:
        return 'bg-rose-100 text-rose-800 border-rose-300';
    }
  };

  // SVG Radial Ring for Lock Quality
  const ringSize = 64;
  const strokeWidth = 6;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (metrics.lockQuality / 100) * circumference;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
      
      {/* 1. Lock Quality & State */}
      <div className="card-clean p-4 flex flex-col justify-between bg-white relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Lock Quality
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getLockBadgeStyle()}`}>
            {metrics.lockState}
          </span>
        </div>

        <div className="flex items-center gap-3 my-2">
          {/* Circular progress ring */}
          <div className="relative w-12 h-12 flex-shrink-0">
            <svg width="48" height="48" viewBox={`0 0 ${ringSize} ${ringSize}`} className="-rotate-90">
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="#E2E8F0"
                strokeWidth={strokeWidth}
              />
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke={metrics.lockQuality > 80 ? '#10B981' : metrics.lockQuality > 50 ? '#F59E0B' : '#EF4444'}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-black text-slate-800">
              {metrics.lockQuality}%
            </div>
          </div>

          <div>
            <div className="text-[11px] text-slate-500 font-medium">Pointing err</div>
            <div className="font-mono text-base font-extrabold text-slate-900 leading-tight">
              {metrics.pointingError}°
            </div>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 font-medium">
          Scaled from |ΔDiff|
        </div>
      </div>

      {/* 2. Light Condition Classifier */}
      <div className="card-clean p-4 flex flex-col justify-between bg-white">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Light Level
          </span>
          {getLightIcon()}
        </div>

        <div className="my-1.5">
          <div className="font-bold text-slate-900 text-lg tracking-tight">
            {metrics.lightLevel}
          </div>
          <div className="font-mono text-xs font-semibold text-slate-600 mt-0.5">
            Avg: <span className="text-slate-900 font-bold">{metrics.avgLight}</span> / 1023
          </div>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-amber-400 to-amber-500 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, (metrics.avgLight / 1023) * 100)}%` }}
          />
        </div>
      </div>

      {/* 3. Total Travel Degrees */}
      <div className="card-clean p-4 flex flex-col justify-between bg-white">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Servo Travel
          </span>
          <RotateCw className="w-4 h-4 text-slate-400" />
        </div>

        <div className="my-1.5">
          <div className="font-mono text-2xl font-black text-slate-900 leading-tight">
            {metrics.totalDegreesTravelled}°
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Odometer travel
          </div>
        </div>

        <div className="text-[10px] text-slate-400 font-medium">
          ~{(metrics.totalDegreesTravelled / 360).toFixed(1)} full rotations
        </div>
      </div>

      {/* 4. Reversal Count (Hunting indicator) */}
      <div className="card-clean p-4 flex flex-col justify-between bg-white">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Reversals
          </span>
          <GitFork className="w-4 h-4 text-slate-400" />
        </div>

        <div className="my-1.5">
          <div className="font-mono text-2xl font-black text-slate-900 leading-tight">
            {metrics.reversalCount}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Direction flips
          </div>
        </div>

        <div className="text-[10px] text-slate-400 font-medium">
          Hunting indicator
        </div>
      </div>

      {/* 5. Peak Brightness */}
      <div className="card-clean p-4 flex flex-col justify-between bg-white">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Peak Lumens
          </span>
          <Flame className="w-4 h-4 text-orange-500" />
        </div>

        <div className="my-1.5">
          <div className="font-mono text-2xl font-black text-orange-600 leading-tight">
            {metrics.peakBrightness.value}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            At {metrics.peakBrightness.time}
          </div>
        </div>

        <div className="text-[10px] text-slate-400 font-medium">
          Session maximum
        </div>
      </div>

      {/* 6. Time Spent Locked % */}
      <div className="card-clean p-4 flex flex-col justify-between bg-white">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Time Locked
          </span>
          <Timer className="w-4 h-4 text-emerald-600" />
        </div>

        <div className="my-1.5">
          <div className="font-mono text-2xl font-black text-emerald-700 leading-tight">
            {metrics.timeLockedPercent}%
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Within ±threshold
          </div>
        </div>

        <div className="text-[10px] text-slate-400 font-medium">
          Overall lock stability
        </div>
      </div>

      {/* 7. Estimated Tracking Gain (Cosine Law) */}
      <div className="card-clean p-4 flex flex-col justify-between bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-white border-amber-300">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
            Energy Gain
          </span>
          <TrendingUp className="w-4 h-4 text-amber-600" />
        </div>

        <div className="my-1.5">
          <div className="font-mono text-2xl font-black text-amber-600 leading-tight">
            +{metrics.energyGainPercent}%
          </div>
          <div className="text-[11px] text-amber-900 font-medium mt-0.5">
            vs Fixed 90° Panel
          </div>
        </div>

        <div className="text-[10px] text-amber-800 font-medium">
          Lambert Cosine model
        </div>
      </div>

    </div>
  );
};
