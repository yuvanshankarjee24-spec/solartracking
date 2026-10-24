import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { HeroSunArc } from './components/HeroSunArc';
import { ServoGaugeCard } from './components/ServoGaugeCard';
import { LDRComparisonCard } from './components/LDRComparisonCard';
import { LiveCharts } from './components/LiveCharts';
import { SmartMetricsRow } from './components/SmartMetricsRow';
import { ControlPanel } from './components/ControlPanel';
import { EventLogTerminal } from './components/EventLogTerminal';
import { SimulatorControlsBanner } from './components/SimulatorControlsBanner';
import { EmptyState } from './components/EmptyState';

import { useSerial } from './hooks/useSerial';
import { useSimulator } from './hooks/useSimulator';
import { useTelemetry } from './hooks/useTelemetry';
import type { ConnectionStatus, TrackerMode } from './types';

export function App() {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Telemetry Manager
  const {
    currentTelemetry,
    historySamples,
    logs,
    rawLines,
    metrics,
    threshold,
    ingestLine,
    logCommand,
    clearSession,
    exportCsv,
  } = useTelemetry();


  const handleLine = useCallback((line: string) => {
    ingestLine(line);
  }, [ingestLine]);

  // Web Serial Hook
  const serial = useSerial({
    onLine: handleLine,
    onError: (err) => {
      setErrorMessage(err);
      setTimeout(() => setErrorMessage(null), 6000);
    },
  });

  // Simulator Hook
  const simulator = useSimulator({
    onLine: handleLine,
  });


  // Determine Overall Connection Status
  const connectionStatus: ConnectionStatus = serial.isConnected
    ? 'connected'
    : simulator.isActive
    ? 'simulator'
    : serial.isConnecting
    ? 'connecting'
    : 'disconnected';

  // Determine current active mode
  const activeMode: TrackerMode = currentTelemetry?.mode ?? (simulator.isActive ? simulator.mode : 'LIVE');

  // Command dispatcher
  const handleSendCommand = useCallback((cmd: string) => {
    logCommand(cmd);

    if (serial.isConnected) {
      serial.sendCommand(cmd);
    } else if (simulator.isActive) {
      simulator.sendCommand(cmd);
    }
  }, [serial, simulator, logCommand]);

  // Fullscreen toggle handler
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
        setIsFullscreen(!isFullscreen);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {
        setIsFullscreen(false);
      });
    }
  };

  // Sync fullscreen state with ESC / browser exits
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Default values when no telemetry received yet
  const defaultServo = 90;
  const defaultTarget = 90;
  const defaultEast = 512;
  const defaultWest = 512;
  const defaultDiff = 0;
  const defaultSun = 90;

  const servoAngle = typeof currentTelemetry?.servo === 'number' && !isNaN(currentTelemetry.servo)
    ? Number(currentTelemetry.servo)
    : defaultServo;

  const targetAngle = typeof currentTelemetry?.target === 'number' && !isNaN(currentTelemetry.target)
    ? Number(currentTelemetry.target)
    : defaultTarget;

  const sunAngle = currentTelemetry?.sun !== null && typeof currentTelemetry?.sun === 'number' && !isNaN(currentTelemetry.sun)
    ? Number(currentTelemetry.sun)
    : (simulator.isActive ? defaultSun : null);

  const eastLDR = typeof currentTelemetry?.east === 'number' && !isNaN(currentTelemetry.east)
    ? Number(currentTelemetry.east)
    : defaultEast;

  const westLDR = typeof currentTelemetry?.west === 'number' && !isNaN(currentTelemetry.west)
    ? Number(currentTelemetry.west)
    : defaultWest;

  const diffVal = typeof currentTelemetry?.diff === 'number' && !isNaN(currentTelemetry.diff)
    ? Number(currentTelemetry.diff)
    : defaultDiff;

  const uptimeSec = typeof currentTelemetry?.t === 'number' && !isNaN(currentTelemetry.t)
    ? Number(currentTelemetry.t)
    : 0;


  return (
    <div className={`min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans transition-all ${
      isFullscreen ? 'presentation-fullscreen' : ''
    }`}>
      
      {/* 1. Top Bar */}
      <Header
        connectionStatus={connectionStatus}
        mode={activeMode}
        uptimeSeconds={uptimeSec}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onConnectSerial={() => {
          if (simulator.isActive) simulator.stopSimulator();
          serial.connect();
        }}
        onDisconnectSerial={() => {
          serial.disconnect();
        }}
        onToggleSimulator={() => {
          if (simulator.isActive) {
            simulator.stopSimulator();
          } else {
            if (serial.isConnected) serial.disconnect();
            simulator.startSimulator();
          }
        }}
        onClearSession={clearSession}
        onExportCsv={exportCsv}
        isWebSerialSupported={serial.isSupported}
      />

      {/* Floating Error Notification Toast */}
      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-rose-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-bounce">
          <span>⚠️ {errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-white/80 hover:text-white font-bold ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Dashboard Container */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        
        {/* Simulator Banner (Appears when simulator is running) */}
        {simulator.isActive && (
          <SimulatorControlsBanner
            isCloudActive={simulator.isCloudActive}
            demoDuration={simulator.demoDuration}
            onTriggerCloud={simulator.triggerCloud}
            onTriggerSunriseReset={simulator.triggerSunriseReset}
          />
        )}

        {/* Empty State Banner if Disconnected and not in simulator */}
        {connectionStatus === 'disconnected' && historySamples.length === 0 && (
          <EmptyState
            onConnectSerial={serial.connect}
            onLaunchSimulator={simulator.startSimulator}
            isWebSerialSupported={serial.isSupported}
          />
        )}

        {/* TOP ROW: Hero Sun Arc (7 cols) + Servo Gauge (5 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Hero: Sun-Tracking Sky Arc (Large visual) */}
          <div className="lg:col-span-7 flex flex-col hero-arc-container">
            <HeroSunArc
              sunAngle={sunAngle}
              servoAngle={servoAngle}
              targetAngle={targetAngle}
              mode={activeMode}
              threshold={threshold}
              isCloudActive={simulator.isActive && simulator.isCloudActive}
            />
          </div>

          {/* Right Column: Servo Dial Gauge + LDR Comparison */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <ServoGaugeCard
              servoAngle={servoAngle}
              targetAngle={targetAngle}
            />
            
            <LDRComparisonCard
              east={eastLDR}
              west={westLDR}
              diff={diffVal}
              threshold={threshold}
            />
          </div>

        </div>

        {/* SMART METRICS ROW */}
        <SmartMetricsRow metrics={metrics} />

        {/* LIVE CHARTS (Rolling 60s / 5min window) */}
        <LiveCharts
          samples={historySamples}
        />

        {/* BOTTOM ROW: Interactive Control Panel + Serial Terminal Log */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Control Panel (7 cols) */}
          <div className="lg:col-span-7 flex flex-col">
            <ControlPanel
              connectionStatus={connectionStatus}
              mode={activeMode}
              threshold={threshold}
              onSendCommand={handleSendCommand}
            />
          </div>

          {/* Event Log & Serial Terminal (5 cols) */}
          <div className="lg:col-span-5 flex flex-col">
            <EventLogTerminal
              logs={logs}
              rawLines={rawLines}
              connectionStatus={connectionStatus}
              onSendCommand={handleSendCommand}
            />
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/60 py-4 px-6 text-center text-xs text-slate-400">
        <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>SolarTrack Live — Arduino Dual-LDR Single-Axis Solar Tracker Presentation Console</span>
          <span className="font-mono">Web Serial 9600 Baud • 60fps Telemetry Engine • Lambert Cosine Model</span>
        </div>
      </footer>

    </div>
  );
}

export default App;
