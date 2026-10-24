import React from 'react';
import { 
  Sun, 
  Usb, 
  Radio, 
  Clock, 
  Maximize2, 
  Minimize2, 
  Download, 
  RotateCcw, 
  Play, 
  Square,
  AlertCircle
} from 'lucide-react';
import type { ConnectionStatus, TrackerMode } from '../types';

interface HeaderProps {
  connectionStatus: ConnectionStatus;
  mode: TrackerMode;
  uptimeSeconds: number;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onConnectSerial: () => void;
  onDisconnectSerial: () => void;
  onToggleSimulator: () => void;
  onClearSession: () => void;
  onExportCsv: () => void;
  isWebSerialSupported: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  connectionStatus,
  mode,
  uptimeSeconds,
  isFullscreen,
  onToggleFullscreen,
  onConnectSerial,
  onDisconnectSerial,
  onToggleSimulator,
  onClearSession,
  onExportCsv,
  isWebSerialSupported,
}) => {
  // Format uptime HH:MM:SS or MM:SS
  const formatUptime = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3.5 transition-all">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20 text-white">
            <Sun className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 leading-none">
                SolarTrack <span className="text-amber-500">Live</span>
              </h1>
              <span className="text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                v2.4
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Arduino Dual-LDR Real-time Presentation Dashboard
            </p>
          </div>
        </div>

        {/* Status Indicators Pill Group */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Connection Status Pill */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            connectionStatus === 'connected'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : connectionStatus === 'simulator'
              ? 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-400/20'
              : connectionStatus === 'connecting'
              ? 'bg-blue-50 text-blue-700 border-blue-200'
              : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-emerald-500 animate-pulse'
                : connectionStatus === 'simulator'
                ? 'bg-amber-500 animate-pulse'
                : connectionStatus === 'connecting'
                ? 'bg-blue-500 animate-ping'
                : 'bg-slate-400'
            }`} />
            <span>
              {connectionStatus === 'connected' && 'ARDUINO CONNECTED (9600 BAUD)'}
              {connectionStatus === 'simulator' && 'SIMULATOR ACTIVE'}
              {connectionStatus === 'connecting' && 'CONNECTING PORT...'}
              {connectionStatus === 'disconnected' && 'HARDWARE DISCONNECTED'}
            </span>
          </div>

          {/* Mode Badge (LIVE vs DEMO) */}
          <div className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
            mode === 'DEMO'
              ? 'bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-500/30'
              : 'bg-indigo-600 text-white border-indigo-700 shadow-sm shadow-indigo-600/30'
          }`}>
            <Radio className="w-3.5 h-3.5" />
            <span>{mode} MODE</span>
          </div>

          {/* Uptime Display */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-400">UPTIME</span>
            <span className="font-bold text-slate-900">{formatUptime(uptimeSeconds)}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Web Serial Connect / Disconnect Button */}
          {connectionStatus === 'connected' ? (
            <button
              onClick={onDisconnectSerial}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors shadow-sm cursor-pointer"
              title="Disconnect Arduino serial stream"
            >
              <Usb className="w-3.5 h-3.5" />
              <span>Disconnect</span>
            </button>
          ) : (
            <button
              onClick={onConnectSerial}
              disabled={connectionStatus === 'connecting'}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm shadow-slate-900/20 active:scale-95 cursor-pointer disabled:opacity-50"
              title={isWebSerialSupported ? "Connect Arduino via USB Serial" : "Web Serial not supported in this browser"}
            >
              <Usb className="w-3.5 h-3.5 text-amber-400" />
              <span>Connect Arduino</span>
            </button>
          )}

          {/* Simulator Toggle Button */}
          <button
            onClick={onToggleSimulator}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              connectionStatus === 'simulator'
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
            title="Toggle offline simulator physics without hardware"
          >
            {connectionStatus === 'simulator' ? (
              <>
                <Square className="w-3.5 h-3.5 fill-amber-700 text-amber-700" />
                <span>Stop Sim</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-slate-700" />
                <span>Use Simulator</span>
              </>
            )}
          </button>

          {/* Export CSV */}
          <button
            onClick={onExportCsv}
            className="p-2 rounded-xl text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm cursor-pointer"
            title="Export session telemetry to CSV"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Reset / Clear Session */}
          <button
            onClick={onClearSession}
            className="p-2 rounded-xl text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-rose-600 transition-colors shadow-sm cursor-pointer"
            title="Reset telemetry and clear logs"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Fullscreen Presentation Mode Toggle */}
          <button
            onClick={onToggleFullscreen}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm cursor-pointer ${
              isFullscreen
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle Fullscreen Projector Mode (Enlarges everything)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit Presentation' : 'Projector View'}</span>
          </button>
        </div>

      </div>

      {/* Browser Warning if Web Serial not supported */}
      {!isWebSerialSupported && (
        <div className="mt-2 text-xs bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              <strong>Note:</strong> Web Serial API is supported in <strong>Google Chrome, Microsoft Edge, and Opera</strong>. On other browsers, use the <strong>Simulator Mode</strong> above.
            </span>
          </div>
        </div>
      )}
    </header>
  );
};
