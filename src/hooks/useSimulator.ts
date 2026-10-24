import { useState, useRef, useEffect, useCallback } from 'react';
import type { TrackerMode } from '../types';

interface SimulatorOptions {
  onLine: (line: string) => void;
}

export function useSimulator({ onLine }: SimulatorOptions) {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [mode, setMode] = useState<TrackerMode>('DEMO');
  const [tracking, setTracking] = useState<boolean>(true);
  const [threshold, setThreshold] = useState<number>(10);
  const [printInterval, setPrintInterval] = useState<number>(1000);
  const [demoDuration, setDemoDuration] = useState<number>(20); // seconds to sweep 30 -> 150
  const [isCloudActive, setIsCloudActive] = useState<boolean>(false);

  // Internal physical simulation state
  const simState = useRef({
    sun: 35.0,           // Current Sun angle (30 - 150)
    sunDirection: 1,     // 1 for East->West, -1 for West->East sweep
    target: 90.0,        // Tracker target angle (30 - 150)
    servo: 90.0,         // Actual physical servo angle (30 - 150)
    uptimeSec: 0,
    cloudEndTime: 0,
    mode: 'DEMO' as TrackerMode,
    tracking: true,
    threshold: 10,
    printInterval: 1000,
    demoDuration: 20,
  });

  // Keep ref synchronized with state
  useEffect(() => {
    simState.current.mode = mode;
    simState.current.tracking = tracking;
    simState.current.threshold = threshold;
    simState.current.printInterval = printInterval;
    simState.current.demoDuration = demoDuration;
  }, [mode, tracking, threshold, printInterval, demoDuration]);

  const onLineRef = useRef(onLine);
  useEffect(() => {
    onLineRef.current = onLine;
  }, [onLine]);

  // Main simulation high-frequency loop (runs every 15ms for physics: servo stepping + sensing)
  useEffect(() => {
    if (!isActive) return;

    let lastPhysicsTime = performance.now();
    let lastPrintTime = performance.now();
    let lastSecTime = performance.now();

    const intervalId = setInterval(() => {
      const now = performance.now();
      const dtPhysics = (now - lastPhysicsTime) / 1000;
      lastPhysicsTime = now;

      const state = simState.current;

      // 1. Advance Uptime seconds
      if (now - lastSecTime >= 1000) {
        state.uptimeSec += 1;
        lastSecTime = now;
      }

      // 2. Check cloud simulation timer
      const cloudActive = now < state.cloudEndTime;
      setIsCloudActive(cloudActive);

      // 3. Sun movement: crosses 30 to 150 deg in demoDuration seconds
      if (state.mode === 'DEMO') {
        const sweepSpeed = 120 / Math.max(2, state.demoDuration); // deg per second
        state.sun += state.sunDirection * sweepSpeed * dtPhysics;

        if (state.sun >= 150) {
          state.sun = 150;
          state.sunDirection = -1; // bounce back
        } else if (state.sun <= 30) {
          state.sun = 30;
          state.sunDirection = 1;
        }
      } else {
        // In LIVE simulation mode, sun slowly drifts around 85-115 with subtle perturbations
        state.sun = 85 + Math.sin(now * 0.0003) * 35;
      }

      // 4. LDR simulation based on pointing error
      const pointingError = state.sun - state.servo;
      const baseBrightness = cloudActive ? 210 : 620;
      const noiseE = (Math.random() - 0.5) * 6;
      const noiseW = (Math.random() - 0.5) * 6;

      const eastRaw = baseBrightness - 4.2 * pointingError + noiseE;
      const westRaw = baseBrightness + 4.2 * pointingError + noiseW;

      const east = Math.round(Math.min(1023, Math.max(0, eastRaw)));
      const west = Math.round(Math.min(1023, Math.max(0, westRaw)));
      const diff = east - west;

      // 5. Arduino Tracker Control Logic (sensing & target updates)
      if (state.tracking) {
        if (Math.abs(diff) > state.threshold) {
          const step = diff > 0 ? -1.8 : 1.8;
          state.target = Math.min(150, Math.max(30, state.target + step));
        }
      }

      // 6. Physical Servo stepping: steps 1 deg toward target every ~15ms
      if (Math.abs(state.target - state.servo) > 0.4) {
        const servoStep = 0.8 * Math.sign(state.target - state.servo);
        state.servo = Math.min(150, Math.max(30, state.servo + servoStep));
      } else {
        state.servo = state.target;
      }

      // 7. Output telemetry line at printInterval
      if (now - lastPrintTime >= state.printInterval) {
        lastPrintTime = now;

        const roundSun = Math.min(150, Math.max(30, Math.round(state.sun)));
        const roundTarget = Math.min(150, Math.max(30, Math.round(state.target)));
        const roundServo = Math.min(150, Math.max(30, Math.round(state.servo)));

        let outputLine = '';
        if (state.mode === 'DEMO') {
          outputLine = `[t=${state.uptimeSec}s]  [DEMO] Sun: ${roundSun}  East: ${east}  West: ${west}  Diff: ${diff}  Target: ${roundTarget}  Servo: ${roundServo}`;
        } else {
          outputLine = `[t=${state.uptimeSec}s]  East: ${east}  West: ${west}  Diff: ${diff}  Target: ${roundTarget}  Servo: ${roundServo}`;
        }

        onLineRef.current(outputLine);
      }
    }, 16);

    return () => clearInterval(intervalId);
  }, [isActive]);


  // Command handler that mimics Arduino sketch command parsing
  const sendCommand = useCallback((rawCommand: string) => {
    const cmd = rawCommand.trim();
    if (!cmd) return;

    const lower = cmd.toLowerCase();
    const state = simState.current;

    if (lower === 'pause') {
      setTracking(false);
      state.tracking = false;
      onLine('OK: tracking paused');
    } else if (lower === 'resume') {
      setTracking(true);
      state.tracking = true;
      onLine('OK: tracking resumed');
    } else if (lower === 'home') {
      state.target = 40;
      state.tracking = false;
      setTracking(false);
      onLine('OK: going home (40°), tracking paused');
    } else if (lower.startsWith('angle')) {
      const match = cmd.match(/^angle\s+(\d+)/i);
      if (match) {
        const angle = parseInt(match[1], 10);
        if (angle >= 30 && angle <= 150) {
          state.target = angle;
          state.tracking = false;
          setTracking(false);
          onLine(`OK: moving to ${angle}, tracking paused`);
        } else {
          onLine('ERR: angle must be between 30 and 150');
        }
      } else {
        onLine('ERR: usage: angle <30-150>');
      }
    } else if (lower.startsWith('threshold')) {
      const match = cmd.match(/^threshold\s+(\d+)/i);
      if (match) {
        const val = parseInt(match[1], 10);
        setThreshold(val);
        state.threshold = val;
        onLine(`OK: threshold = ${val}`);
      } else {
        onLine('ERR: usage: threshold <0-1023>');
      }
    } else if (lower.startsWith('print')) {
      const match = cmd.match(/^print\s+(\d+)/i);
      if (match) {
        const ms = parseInt(match[1], 10);
        if (ms >= 100) {
          setPrintInterval(ms);
          state.printInterval = ms;
          onLine(`OK: printing every ${ms} ms`);
        } else {
          onLine('ERR: print interval must be >= 100 ms');
        }
      } else {
        onLine('ERR: usage: print <ms>');
      }
    } else if (lower === 'demo off') {
      setMode('LIVE');
      state.mode = 'LIVE';
      onLine('OK: DEMO OFF - using real LDRs');
    } else if (lower.startsWith('demo')) {
      const match = cmd.match(/^demo(?:\s+(\d+))?/i);
      const secs = match && match[1] ? parseInt(match[1], 10) : 20;
      const clampedSecs = Math.min(600, Math.max(5, secs));
      setDemoDuration(clampedSecs);
      state.demoDuration = clampedSecs;
      setMode('DEMO');
      state.mode = 'DEMO';
      onLine(`OK: DEMO ON - sun crosses in ${clampedSecs} s`);
    } else if (lower === 'status') {
      const statusLine = `Mode: ${state.mode}  Tracking: ${state.tracking ? 'ON' : 'OFF'}  Threshold: ${state.threshold}  Print every: ${state.printInterval} ms  Target: ${Math.round(state.target)}  Servo: ${Math.round(state.servo)}`;
      onLine(statusLine);
    } else if (lower === 'help') {
      onLine('Available commands: pause, resume, home, angle <30-150>, threshold <0-1023>, print <ms>, demo, demo <sec>, demo off, status, help');
    } else {
      onLine(`ERR: unknown command "${cmd}"`);
    }
  }, [onLine]);

  // Simulator unique actions
  const triggerCloud = useCallback(() => {
    simState.current.cloudEndTime = performance.now() + 5000;
    setIsCloudActive(true);
    onLine('INFO: [SIMULATOR] Cloud event started (5s brightness reduction)');
  }, [onLine]);

  const triggerSunriseReset = useCallback(() => {
    simState.current.sun = 30;
    simState.current.sunDirection = 1;
    onLine('INFO: [SIMULATOR] Sunrise reset: Sun jumped to 30° East');
  }, [onLine]);

  const startSimulator = useCallback(() => {
    setIsActive(true);
    simState.current.uptimeSec = 0;
    simState.current.sun = 35;
    simState.current.sunDirection = 1;
    simState.current.target = 90;
    simState.current.servo = 90;
    onLine('Solar tracker ready (SIMULATOR mode)');
    onLine('OK: DEMO ON - sun crosses in 20 s');
  }, [onLine]);

  const stopSimulator = useCallback(() => {
    setIsActive(false);
  }, []);

  return {
    isActive,
    startSimulator,
    stopSimulator,
    sendCommand,
    triggerCloud,
    triggerSunriseReset,
    isCloudActive,
    mode,
    tracking,
    threshold,
    printInterval,
    demoDuration,
  };
}
