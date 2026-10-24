import { useState, useCallback, useRef } from 'react';
import type { TelemetryData, LogEntry, SmartMetrics, StatusResponse } from '../types';
import { parseArduinoLine } from '../utils/parser';
import { createInitialHistoryState, computeSmartMetrics } from '../utils/telemetry';
import type { TelemetryHistoryState } from '../utils/telemetry';

export function useTelemetry() {
  const [currentTelemetry, setCurrentTelemetry] = useState<TelemetryData | null>(null);
  const [historySamples, setHistorySamples] = useState<TelemetryData[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [rawLines, setRawLines] = useState<string[]>([]);
  const [lastStatus, setLastStatus] = useState<StatusResponse | null>(null);
  const [metrics, setMetrics] = useState<SmartMetrics>({
    lockQuality: 0,
    lockState: 'SEARCHING',
    lightLevel: 'Bright',
    avgLight: 0,
    totalDegreesTravelled: 0,
    reversalCount: 0,
    peakBrightness: { value: 0, time: '--:--' },
    timeLockedPercent: 0,
    energyGainPercent: 0,
    pointingError: 0,
    servoLag: 0,
  });

  const historyRef = useRef<TelemetryHistoryState>(createInitialHistoryState());
  const thresholdRef = useRef<number>(10);

  // Helper to add log
  const addLog = useCallback((type: LogEntry['type'], text: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: timeStr,
      type,
      text,
    };
    setLogs((prev) => [...prev.slice(-250), entry]);
  }, []);

  // Process incoming line
  const ingestLine = useCallback((rawLine: string) => {
    setRawLines((prev) => [...prev.slice(-150), rawLine]);

    const result = parseArduinoLine(rawLine);

    if (result.type === 'telemetry' && result.telemetry) {
      const sample = result.telemetry;
      setCurrentTelemetry(sample);

      // Compute metrics
      const { metrics: newMetrics, updatedHistory } = computeSmartMetrics(
        sample,
        historyRef.current,
        thresholdRef.current
      );
      historyRef.current = updatedHistory;
      setMetrics(newMetrics);
      setHistorySamples(updatedHistory.samples);
    } else if (result.type === 'status' && result.status) {
      setLastStatus(result.status);
      thresholdRef.current = result.status.threshold;
      addLog('info', `Status: Mode=${result.status.mode}, Tracking=${result.status.tracking ? 'ON' : 'OFF'}, Threshold=${result.status.threshold}, Interval=${result.status.printIntervalMs}ms, Servo=${result.status.servo}°`);
    } else if (result.type === 'response' && result.message) {
      addLog('response', result.message);
      // Check if response contains threshold update
      const thMatch = result.message.match(/threshold\s*=\s*(\d+)/i);
      if (thMatch) {
        thresholdRef.current = parseInt(thMatch[1], 10);
      }
    } else if (result.type === 'error' && result.message) {
      addLog('error', result.message);
    } else if (result.type === 'info' && result.message) {
      addLog('info', result.message);
    }
  }, [addLog]);

  // Log an outgoing command
  const logCommand = useCallback((cmd: string) => {
    addLog('command', `> ${cmd}`);
  }, [addLog]);

  // Clear Session
  const clearSession = useCallback(() => {
    setCurrentTelemetry(null);
    setHistorySamples([]);
    historyRef.current = createInitialHistoryState();
    setMetrics({
      lockQuality: 0,
      lockState: 'SEARCHING',
      lightLevel: 'Bright',
      avgLight: 0,
      totalDegreesTravelled: 0,
      reversalCount: 0,
      peakBrightness: { value: 0, time: '--:--' },
      timeLockedPercent: 0,
      energyGainPercent: 0,
      pointingError: 0,
      servoLag: 0,
    });
    setLogs([]);
    setRawLines([]);
    addLog('info', 'Session data and telemetry history reset');
  }, [addLog]);

  // Export CSV
  const exportCsv = useCallback(() => {
    if (historyRef.current.samples.length === 0) {
      alert('No telemetry data collected yet to export.');
      return;
    }

    const headers = [
      'Timestamp',
      'Uptime_s',
      'Mode',
      'East_LDR',
      'West_LDR',
      'Diff',
      'Target_deg',
      'Servo_deg',
      'Sun_deg',
    ];

    const rows = historyRef.current.samples.map((s) => [
      new Date(s.timestamp).toISOString(),
      s.t,
      s.mode,
      s.east,
      s.west,
      s.diff,
      s.target,
      s.servo,
      s.sun !== null ? s.sun : '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.setAttribute('href', url);
    link.setAttribute('download', `solartrack-telemetry-${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addLog('info', `Exported ${rows.length} telemetry records to CSV`);
  }, [addLog]);

  return {
    currentTelemetry,
    historySamples,
    logs,
    rawLines,
    metrics,
    lastStatus,
    threshold: thresholdRef.current,
    setThresholdValue: (val: number) => { thresholdRef.current = val; },
    ingestLine,
    logCommand,
    clearSession,
    exportCsv,
  };
}
