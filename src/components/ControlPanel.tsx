import { useState } from 'react';
import { 
  Play, 
  Pause, 
  Home, 
  Send, 
  Sliders, 
  Radio, 
  Info, 
  HelpCircle, 
  Lock
} from 'lucide-react';

import type { ConnectionStatus, TrackerMode } from '../types';

interface ControlPanelProps {
  connectionStatus: ConnectionStatus;
  mode: TrackerMode;
  threshold: number;
  onSendCommand: (cmd: string) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  connectionStatus,
  mode,
  threshold: currentThreshold,
  onSendCommand,
}) => {
  const isConnected = connectionStatus === 'connected' || connectionStatus === 'simulator';

  // Local input states
  const [manualAngle, setManualAngle] = useState<number>(90);
  const [thresholdVal, setThresholdVal] = useState<number>(currentThreshold || 10);
  const [isTrackingPaused, setIsTrackingPaused] = useState<boolean>(false);
  const [selectedInterval, setSelectedInterval] = useState<number>(1000);
  const [demoDuration, setDemoDuration] = useState<number>(20);

  // Send helpers
  const handleTogglePause = () => {
    if (isTrackingPaused) {
      onSendCommand('resume');
      setIsTrackingPaused(false);
    } else {
      onSendCommand('pause');
      setIsTrackingPaused(true);
    }
  };

  const handleHome = () => {
    onSendCommand('home');
    setIsTrackingPaused(true);
  };

  const handleSendAngle = (angle: number) => {
    onSendCommand(`angle ${angle}`);
    setIsTrackingPaused(true);
  };

  const handleSendThreshold = (val: number) => {
    setThresholdVal(val);
    onSendCommand(`threshold ${val}`);
  };

  const handleSendInterval = (ms: number) => {
    setSelectedInterval(ms);
    onSendCommand(`print ${ms}`);
  };

  const handleToggleDemo = () => {
    if (mode === 'DEMO') {
      onSendCommand('demo off');
    } else {
      onSendCommand(`demo ${demoDuration}`);
    }
  };

  const handleSetDemoDuration = (secs: number) => {
    setDemoDuration(secs);
    if (mode === 'DEMO') {
      onSendCommand(`demo ${secs}`);
    }
  };

  return (
    <div className={`card-clean p-6 bg-white relative transition-all ${
      !isConnected ? 'opacity-70 pointer-events-none' : ''
    }`}>
      
      {/* Overlay when disconnected */}
      {!isConnected && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-xs rounded-2xl z-20 flex flex-col items-center justify-center p-6 text-center">
          <div className="p-3 rounded-full bg-slate-100 text-slate-500 mb-2">
            <Lock className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-800 text-base">Hardware Controls Locked</h4>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Connect your Arduino via USB Serial or start the Simulator above to send interactive commands to the solar tracker.
          </p>
        </div>
      )}

      {/* Control Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
            <Sliders className="w-4 h-4" />
          </span>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Interactive Tracker Control Deck</h3>
            <p className="text-xs text-slate-400">Direct 2-way Web Serial command dispatch & hardware actuator overrides</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSendCommand('status')}
            disabled={!isConnected}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
            title="Query Arduino firmware status report"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Query Status</span>
          </button>

          <button
            onClick={() => onSendCommand('help')}
            disabled={!isConnected}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold border border-slate-200 transition-colors cursor-pointer"
            title="Show list of Arduino supported commands"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Help</span>
          </button>
        </div>
      </div>

      {/* Control Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

        {/* 1. Actuator State & Emergency Controls */}
        <div className="flex flex-col justify-between bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
              Actuator State
            </span>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleTogglePause}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
                  isTrackingPaused
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                }`}
              >
                {isTrackingPaused ? (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Resume Auto-Tracking</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-4 h-4 fill-white" />
                    <span>Pause Auto-Tracking</span>
                  </>
                )}
              </button>

              <button
                onClick={handleHome}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 shadow-xs transition-all cursor-pointer"
              >
                <Home className="w-4 h-4 text-slate-600" />
                <span>Go Home (135°)</span>
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-200/60 font-mono">
            State: <strong>{isTrackingPaused ? 'PAUSED' : 'TRACKING ON'}</strong>
          </div>
        </div>

        {/* 2. Manual Angle Slew (30° - 150°) */}
        <div className="flex flex-col justify-between bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Manual Slew (30°-150°)
              </span>
              <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                {manualAngle}°
              </span>
            </div>

            {/* Slider */}
            <input
              type="range"
              min="30"
              max="150"
              value={manualAngle}
              onChange={(e) => setManualAngle(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 my-2"
            />

            {/* Presets + Go Button */}
            <div className="flex items-center justify-between gap-1.5 mt-2">
              {[45, 90, 135].map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setManualAngle(preset);
                    handleSendAngle(preset);
                  }}
                  className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 transition-colors cursor-pointer"
                >
                  {preset}°
                </button>
              ))}

              <button
                onClick={() => handleSendAngle(manualAngle)}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>Go</span>
              </button>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 mt-2 font-mono">
            Command: <code>angle {manualAngle}</code>
          </div>
        </div>

        {/* 3. Deadband Threshold (0 - 100) */}
        <div className="flex flex-col justify-between bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Deadband Threshold
              </span>
              <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ±{thresholdVal}
              </span>
            </div>

            {/* Threshold Slider */}
            <input
              type="range"
              min="0"
              max="60"
              value={thresholdVal}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setThresholdVal(v);
              }}
              onMouseUp={() => handleSendThreshold(thresholdVal)}
              onTouchEnd={() => handleSendThreshold(thresholdVal)}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 my-2"
            />

            {/* Quick Threshold Chips */}
            <div className="flex items-center justify-between gap-1.5 mt-2">
              {[5, 10, 15, 25, 40].map((th) => (
                <button
                  key={th}
                  onClick={() => handleSendThreshold(th)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                    thresholdVal === th
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  ±{th}
                </button>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 mt-2 font-mono">
            Command: <code>threshold {thresholdVal}</code>
          </div>
        </div>

        {/* 4. Telemetry Interval & Demo Mode */}
        <div className="flex flex-col justify-between bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Print Rate & Demo Sweep
            </span>

            {/* Interval chips */}
            <div className="flex items-center gap-1.5 mb-3">
              {[500, 1000, 2000, 5000].map((ms) => (
                <button
                  key={ms}
                  onClick={() => handleSendInterval(ms)}
                  className={`flex-1 py-1 rounded-lg text-[10px] font-mono font-bold border transition-colors cursor-pointer ${
                    selectedInterval === ms
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`}
                </button>
              ))}
            </div>

            {/* Demo Toggle & Duration */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleDemo}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === 'DEMO'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>{mode === 'DEMO' ? 'Demo Active' : 'Start Demo'}</span>
              </button>

              <select
                value={demoDuration}
                onChange={(e) => handleSetDemoDuration(parseInt(e.target.value, 10))}
                className="bg-white border border-slate-300 text-xs font-mono font-bold rounded-xl px-2 py-1.5 text-slate-700 focus:outline-none cursor-pointer"
                title="Sun sweep duration"
              >
                <option value={10}>10s sweep</option>
                <option value={20}>20s sweep</option>
                <option value={60}>60s sweep</option>
              </select>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 mt-2 font-mono">
            Demo: <code>demo {demoDuration}</code>
          </div>
        </div>

      </div>

    </div>
  );
};
