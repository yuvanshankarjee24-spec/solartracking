import type { TelemetryData, StatusResponse, LogType } from '../types';

export interface ParseResult {
  type: 'telemetry' | 'status' | 'response' | 'error' | 'info' | 'ignored';
  telemetry?: TelemetryData;
  status?: StatusResponse;
  message?: string;
  logType?: LogType;
}

/**
 * Regex for telemetry lines:
 * Demo: [t=12s]  [DEMO] Sun: 72  East: 592  West: 609  Diff: -17  Target: 72  Servo: 70
 * Live: [t=12s]  East: 592  West: 609  Diff: -17  Target: 72  Servo: 70
 * 
 * Supports flexible whitespace between tokens.
 */
const TELEMETRY_REGEX = /^\[t=(\d+)s\]\s+(?:\[(DEMO)\]\s+Sun:\s*(\d+)\s+)?East:\s*(\d+)\s+West:\s*(\d+)\s+Diff:\s*(-?\d+)\s+Target:\s*(\d+)\s+Servo:\s*(\d+)/i;

/**
 * Regex for status command response:
 * Mode: LIVE  Tracking: ON  Threshold: 10  Print every: 1000 ms  Target: 90  Servo: 90
 */
const STATUS_REGEX = /^Mode:\s*(LIVE|DEMO)\s+Tracking:\s*(ON|OFF)\s+Threshold:\s*(\d+)\s+Print every:\s*(\d+)\s*ms\s+Target:\s*(\d+)\s+Servo:\s*(\d+)/i;

/**
 * Clamp a number between min and max
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

/**
 * Parse a single line received from the Arduino serial port.
 */
export function parseArduinoLine(rawLine: string): ParseResult {
  const line = rawLine.trim();
  if (!line) {
    return { type: 'ignored' };
  }

  // 1. Try matching Telemetry Line
  const telemetryMatch = line.match(TELEMETRY_REGEX);
  if (telemetryMatch) {
    const uptime = parseInt(telemetryMatch[1], 10);
    const isDemo = Boolean(telemetryMatch[2]);
    const sunVal = telemetryMatch[3] !== undefined ? parseInt(telemetryMatch[3], 10) : null;
    const east = parseInt(telemetryMatch[4], 10);
    const west = parseInt(telemetryMatch[5], 10);
    const diff = parseInt(telemetryMatch[6], 10);
    const target = parseInt(telemetryMatch[7], 10);
    const servo = parseInt(telemetryMatch[8], 10);

    const safeEast = isNaN(east) ? 512 : east;
    const safeWest = isNaN(west) ? 512 : west;
    const safeDiff = isNaN(diff) ? 0 : diff;
    const safeTarget = isNaN(target) ? 90 : target;
    const safeServo = isNaN(servo) ? 90 : servo;

    const telemetry: TelemetryData = {
      t: isNaN(uptime) ? 0 : uptime,
      mode: isDemo ? 'DEMO' : 'LIVE',
      sun: sunVal !== null && !isNaN(sunVal) ? clamp(sunVal, 30, 150) : null,
      east: clamp(safeEast, 0, 1023),
      west: clamp(safeWest, 0, 1023),
      diff: safeDiff,
      target: clamp(safeTarget, 30, 150),
      servo: clamp(safeServo, 30, 150),
      timestamp: Date.now(),
    };

    return {
      type: 'telemetry',
      telemetry,
    };
  }

  // 2. Try matching Status Line
  const statusMatch = line.match(STATUS_REGEX);
  if (statusMatch) {
    const status: StatusResponse = {
      mode: statusMatch[1].toUpperCase() === 'DEMO' ? 'DEMO' : 'LIVE',
      tracking: statusMatch[2].toUpperCase() === 'ON',
      threshold: parseInt(statusMatch[3], 10),
      printIntervalMs: parseInt(statusMatch[4], 10),
      target: parseInt(statusMatch[5], 10),
      servo: parseInt(statusMatch[6], 10),
    };

    return {
      type: 'status',
      status,
      message: line,
      logType: 'info',
    };
  }

  // 3. Error lines
  if (line.startsWith('ERR:') || line.toLowerCase().includes('error')) {
    return {
      type: 'error',
      message: line,
      logType: 'error',
    };
  }

  // 4. Command OK acknowledgements
  if (line.startsWith('OK:')) {
    return {
      type: 'response',
      message: line,
      logType: 'response',
    };
  }

  // 5. General Info (e.g., "Solar tracker ready...", "Commands: ...")
  return {
    type: 'info',
    message: line,
    logType: 'info',
  };
}

/**
 * Line buffer helper to accumulate chunks into complete lines ending with \n or \r\n.
 */
export class LineBuffer {
  private buffer: string = '';

  public push(chunk: string): string[] {
    this.buffer += chunk;
    const lines = this.buffer.split(/\r?\n/);
    // The last element is whatever comes after the last newline (could be empty or incomplete line)
    this.buffer = lines.pop() || '';
    return lines;
  }

  public flush(): string | null {
    if (this.buffer.trim().length > 0) {
      const remaining = this.buffer;
      this.buffer = '';
      return remaining;
    }
    this.buffer = '';
    return null;
  }

  public clear(): void {
    this.buffer = '';
  }
}
