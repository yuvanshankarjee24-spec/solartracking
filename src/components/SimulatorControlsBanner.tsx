import { CloudRain, Sunrise, Cpu } from 'lucide-react';

interface SimulatorControlsBannerProps {
  isCloudActive: boolean;
  demoDuration: number;
  onTriggerCloud: () => void;
  onTriggerSunriseReset: () => void;
}

export const SimulatorControlsBanner: React.FC<SimulatorControlsBannerProps> = ({
  isCloudActive,
  demoDuration,
  onTriggerCloud,
  onTriggerSunriseReset,
}) => {
  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-300/80 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
      
      {/* Left: Badge and Description */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-sm shadow-amber-500/25">
          <Cpu className="w-3.5 h-3.5" />
          <span>SIMULATOR RUNNING</span>
        </div>
        <div className="text-xs text-slate-600 font-medium">
          Emulating Arduino Uno + SG90 Servo + Dual CdS LDRs (<code className="text-amber-800 font-bold">LDR = 600 ± 4×error + noise</code>)
        </div>
      </div>

      {/* Right: Interactive Simulator Actions */}
      <div className="flex flex-wrap items-center gap-2.5">
        
        {/* Simulate Cloud Button */}
        <button
          onClick={onTriggerCloud}
          disabled={isCloudActive}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
            isCloudActive
              ? 'bg-slate-700 text-white animate-pulse'
              : 'bg-white text-slate-700 hover:bg-slate-50 border border-amber-200'
          }`}
          title="Simulate a passing cloud dropping solar irradiance for 5 seconds"
        >
          <CloudRain className="w-4 h-4 text-sky-500" />
          <span>{isCloudActive ? 'Cloud Passing (5s)...' : 'Simulate Cloud'}</span>
        </button>

        {/* Simulate Sunrise Reset Button */}
        <button
          onClick={onTriggerSunriseReset}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 border border-amber-200 transition-all shadow-xs cursor-pointer"
          title="Reset the celestial sun position back to 30° East (Dawn)"
        >
          <Sunrise className="w-4 h-4 text-amber-600" />
          <span>Simulate Sunrise Reset (30° E)</span>
        </button>

        <div className="text-[11px] font-mono text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-lg border border-amber-200">
          Sweep: <strong>{demoDuration}s</strong>
        </div>

      </div>

    </div>
  );
};
