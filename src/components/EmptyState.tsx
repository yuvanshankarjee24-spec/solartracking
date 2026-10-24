import { Sun, Usb, Play, CheckCircle2 } from 'lucide-react';

interface EmptyStateProps {
  onConnectSerial: () => void;
  onLaunchSimulator: () => void;
  isWebSerialSupported?: boolean;
}

export const EmptyState = ({
  onConnectSerial,
  onLaunchSimulator,
}: EmptyStateProps) => {

  return (
    <div className="card-clean p-8 lg:p-12 text-center bg-white border border-slate-200/80 shadow-md max-w-4xl mx-auto my-6">
      
      {/* Decorative Solar Array Illustration */}
      <div className="relative w-36 h-36 mx-auto mb-6 flex items-center justify-center">
        {/* Glowing Sun Ambient */}
        <div className="absolute top-0 right-4 w-12 h-12 rounded-full bg-amber-400 blur-md opacity-60 animate-pulse" />
        <div className="absolute top-2 right-6 w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-white shadow-md shadow-amber-500/30">
          <Sun className="w-5 h-5 animate-spin-slow" />
        </div>

        {/* Central Solar Panel Frame */}
        <div className="w-28 h-20 bg-slate-900 rounded-2xl border-4 border-slate-700 shadow-xl flex flex-col items-center justify-center relative rotate-[-12deg] transition-transform hover:rotate-0 duration-300">
          {/* Dual LDR dots */}
          <div className="absolute -top-3 left-3 w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-sm flex items-center justify-center text-[8px] font-black text-white">
            E
          </div>
          <div className="absolute -top-3 right-3 w-4 h-4 rounded-full bg-teal-500 border-2 border-white shadow-sm flex items-center justify-center text-[8px] font-black text-white">
            W
          </div>

          <div className="w-20 h-12 border border-slate-700 rounded grid grid-cols-3 grid-rows-2 gap-1 p-1 bg-slate-800">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-blue-950/70 rounded-xs border border-blue-500/20" />
            ))}
          </div>

          {/* Pivot Base */}
          <div className="absolute -bottom-5 w-6 h-6 bg-slate-600 rounded-sm" />
        </div>
      </div>

      {/* Main Title & Subtitle */}
      <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
        Ready to Track the Sun
      </h2>
      <p className="text-sm text-slate-500 max-w-lg mx-auto mb-8 leading-relaxed">
        Connect your dual-LDR Arduino solar tracker via USB Serial to monitor real-time angles and light equilibrium, or launch the built-in physics simulator.
      </p>

      {/* Dual Big Call To Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
        
        {/* Launch Simulator Button (Recommended for instant presentation) */}
        <button
          onClick={onLaunchSimulator}
          className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-sm shadow-md shadow-amber-500/30 transition-all cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Launch Simulator Demo</span>
          <span className="text-[10px] bg-amber-600/80 px-2 py-0.5 rounded-full font-semibold uppercase">
            Offline
          </span>
        </button>

        {/* Connect Arduino Button */}
        <button
          onClick={onConnectSerial}
          className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-sm shadow-md shadow-slate-900/20 transition-all cursor-pointer"
        >
          <Usb className="w-4 h-4 text-amber-400" />
          <span>Connect Arduino (9600 Baud)</span>
        </button>

      </div>

      {/* Capability Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-100 text-left">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-slate-800">Sun Arc & Servo Needle</div>
            <div className="text-[11px] text-slate-500">Live angle convergence with ghost target tracking</div>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-slate-800">Dual LDR & Deadband Meter</div>
            <div className="text-[11px] text-slate-500">Calm blue & teal bars with optical null equilibrium</div>
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-slate-800">3 Telemetry Charts & Gain</div>
            <div className="text-[11px] text-slate-500">Rolling waveforms + Lambert cosine energy gain</div>
          </div>
        </div>
      </div>

    </div>
  );
};
