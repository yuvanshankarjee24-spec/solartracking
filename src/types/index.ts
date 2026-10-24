export type TrackerMode = 'LIVE' | 'DEMO';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'simulator';

export interface TelemetryData {
  t: number;                 // Uptime in seconds
  mode: TrackerMode;         // 'LIVE' or 'DEMO'
  sun: number | null;        // Sun angle 30-150 (demo mode only or simulated)
  east: number;              // LDR East value 0-1023
  west: number;              // LDR West value 0-1023
  diff: number;              // East - West
  target: number;            // Target angle 30-150
  servo: number;             // Actual Servo angle 30-150
  timestamp: number;         // Date.now() timestamp
}

export interface StatusResponse {
  mode: TrackerMode;
  tracking: boolean;
  threshold: number;
  printIntervalMs: number;
  target: number;
  servo: number;
}

export type LogType = 'command' | 'response' | 'error' | 'info' | 'raw';

export interface LogEntry {
  id: string;
  timestamp: string;         // HH:mm:ss format
  type: LogType;
  text: string;
}

export type LightLevel = 'Dark' | 'Cloudy' | 'Partly Sunny' | 'Bright';
export type LockState = 'LOCKED' | 'TRACKING' | 'SEARCHING';

export interface SmartMetrics {
  lockQuality: number;       // 0 - 100%
  lockState: LockState;
  lightLevel: LightLevel;
  avgLight: number;
  totalDegreesTravelled: number;
  reversalCount: number;
  peakBrightness: {
    value: number;
    time: string;
  };
  timeLockedPercent: number;
  energyGainPercent: number;
  pointingError: number;     // Absolute or signed difference between Sun and Servo
  servoLag: number;          // Target - Servo
}
