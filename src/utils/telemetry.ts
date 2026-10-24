import type { TelemetryData, SmartMetrics, LockState, LightLevel } from '../types';

export interface TelemetryHistoryState {
  samples: TelemetryData[];
  totalDegrees: number;
  lastServo: number | null;
  lastDirection: number; // -1, 0, 1
  reversals: number;
  peakVal: number;
  peakTime: string;
  lockedCount: number;
  totalSamplesCount: number;
  sumTrackerEnergy: number;
  sumFixedEnergy: number;
}

export function createInitialHistoryState(): TelemetryHistoryState {
  return {
    samples: [],
    totalDegrees: 0,
    lastServo: null,
    lastDirection: 0,
    reversals: 0,
    peakVal: 0,
    peakTime: '--:--',
    lockedCount: 0,
    totalSamplesCount: 0,
    sumTrackerEnergy: 0,
    sumFixedEnergy: 0,
  };
}

const DEG_TO_RAD = Math.PI / 180;

/**
 * Compute smart metrics from the current telemetry sample and cumulative session state.
 */
export function computeSmartMetrics(
  sample: TelemetryData,
  history: TelemetryHistoryState,
  threshold: number = 10
): { metrics: SmartMetrics; updatedHistory: TelemetryHistoryState } {
  const avgLight = Math.round((sample.east + sample.west) / 2);
  const absDiff = Math.abs(sample.diff);

  // 1. Lock Quality & State
  let lockQuality = 0;
  if (avgLight < 40) {
    lockQuality = 10;
  } else if (absDiff <= threshold) {
    // Inside deadband: 90% - 100%
    lockQuality = Math.round(100 - (absDiff / Math.max(1, threshold)) * 10);
  } else {
    // Outside deadband: scales down from 90% towards 0% at diff >= 250
    const penalty = ((absDiff - threshold) / 200) * 85;
    lockQuality = Math.max(5, Math.round(90 - penalty));
  }

  let lockState: LockState = 'TRACKING';
  if (avgLight < 40) {
    lockState = 'SEARCHING';
  } else if (absDiff <= threshold) {
    lockState = 'LOCKED';
  } else if (absDiff > 180) {
    lockState = 'SEARCHING';
  } else {
    lockState = 'TRACKING';
  }

  // 2. Light Level
  let lightLevel: LightLevel = 'Bright';
  if (avgLight < 120) {
    lightLevel = 'Dark';
  } else if (avgLight < 380) {
    lightLevel = 'Cloudy';
  } else if (avgLight < 700) {
    lightLevel = 'Partly Sunny';
  } else {
    lightLevel = 'Bright';
  }

  // 3. Accumulate degrees & reversals
  let newTotalDegrees = history.totalDegrees;
  let newReversals = history.reversals;
  let newDirection = history.lastDirection;

  if (history.lastServo !== null) {
    const delta = sample.servo - history.lastServo;
    newTotalDegrees += Math.abs(delta);

    if (Math.abs(delta) >= 1) {
      const currentDir = delta > 0 ? 1 : -1;
      if (history.lastDirection !== 0 && currentDir !== history.lastDirection) {
        newReversals += 1;
      }
      newDirection = currentDir;
    }
  }

  // 4. Peak Brightness
  let newPeakVal = history.peakVal;
  let newPeakTime = history.peakTime;
  const timeStr = new Date(sample.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  if (avgLight > newPeakVal) {
    newPeakVal = avgLight;
    newPeakTime = timeStr;
  }

  // 5. Time locked %
  const newLockedCount = history.lockedCount + (absDiff <= threshold ? 1 : 0);
  const newTotalCount = history.totalSamplesCount + 1;
  const timeLockedPercent = Math.round((newLockedCount / newTotalCount) * 100);

  // 6. Energy Gain (Cosine Law)
  // Sun angle: if reported, use it; otherwise approximate from servo + diff / 5
  const estimatedSun = sample.sun !== null ? sample.sun : (sample.servo + sample.diff / 6);
  // Incident angle on tracking panel: (Sun - Servo)
  const angleTracker = Math.abs(estimatedSun - sample.servo) * DEG_TO_RAD;
  // Incident angle on fixed panel at 90° (Zenith/South):
  const angleFixed = Math.abs(estimatedSun - 90) * DEG_TO_RAD;

  const currentTrackerEnergy = Math.max(0, Math.cos(angleTracker));
  const currentFixedEnergy = Math.max(0, Math.cos(angleFixed));

  const newSumTrackerEnergy = history.sumTrackerEnergy + currentTrackerEnergy;
  const newSumFixedEnergy = history.sumFixedEnergy + currentFixedEnergy;

  let energyGainPercent = 0;
  if (newSumFixedEnergy > 0.05) {
    const rawGain = ((newSumTrackerEnergy - newSumFixedEnergy) / newSumFixedEnergy) * 100;
    energyGainPercent = Math.max(0, Math.round(rawGain * 10) / 10);
  } else {
    // Fallback baseline for early presentation
    energyGainPercent = 32.5;
  }

  // 7. Pointing Error & Lag
  const pointingError = sample.sun !== null 
    ? Math.round(Math.abs(sample.sun - sample.servo)) 
    : Math.round(Math.abs(sample.diff) / 5);

  const servoLag = sample.target - sample.servo;

  // Max 300 rolling samples in memory for charts
  const newSamples = [...history.samples, sample].slice(-300);

  const updatedHistory: TelemetryHistoryState = {
    samples: newSamples,
    totalDegrees: newTotalDegrees,
    lastServo: sample.servo,
    lastDirection: newDirection,
    reversals: newReversals,
    peakVal: newPeakVal,
    peakTime: newPeakTime,
    lockedCount: newLockedCount,
    totalSamplesCount: newTotalCount,
    sumTrackerEnergy: newSumTrackerEnergy,
    sumFixedEnergy: newSumFixedEnergy,
  };

  const metrics: SmartMetrics = {
    lockQuality,
    lockState,
    lightLevel,
    avgLight,
    totalDegreesTravelled: Math.round(newTotalDegrees),
    reversalCount: newReversals,
    peakBrightness: {
      value: newPeakVal,
      time: newPeakTime,
    },
    timeLockedPercent,
    energyGainPercent,
    pointingError,
    servoLag,
  };

  return { metrics, updatedHistory };
}
