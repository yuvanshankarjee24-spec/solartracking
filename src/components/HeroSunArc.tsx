import React from 'react';
import { Sun, Target } from 'lucide-react';
import type { TrackerMode } from '../types';

interface HeroSunArcProps {
  sunAngle: number | null;
  servoAngle: number;
  targetAngle: number;
  mode: TrackerMode;
  threshold: number;
  isCloudActive?: boolean;
}

export const HeroSunArc: React.FC<HeroSunArcProps> = ({
  sunAngle,
  servoAngle,
  targetAngle,
  mode,
  threshold,
  isCloudActive = false,
}) => {
  // 1. Log telemetry values and ensure numbers with safe defaults (servo 90, target 90)
  const safeServo = typeof servoAngle === 'number' && !isNaN(servoAngle) ? Number(servoAngle) : 90;
  const safeTarget = typeof targetAngle === 'number' && !isNaN(targetAngle) ? Number(targetAngle) : 90;
  const safeSun = sunAngle !== null && typeof sunAngle === 'number' && !isNaN(sunAngle) ? Number(sunAngle) : null;

  console.log('[HeroSunArc] Received telemetry:', {
    servo: safeServo,
    target: safeTarget,
    sun: safeSun,
    raw: { servoAngle, targetAngle, sunAngle },
  });

  // SVG Canvas dimensions
  const width = 800;
  const height = 380;
  const cx = 400;
  const cy = 300;
  const radius = 230;
  // Pivot point for the rotating array (top pin of the pedestal bearing)
  const pivotX = 400;
  const pivotY = 252; // 300 - 48

  // 2. Map angle 30-150 to arc sweep with (angle - 30) / 120 and clamp it
  const clamp01 = (val: number) => Math.max(0, Math.min(1, val));

  // Angular mapping: 30° East = -60°, 90° Zenith = 0°, 150° West = +60°
  const mapAngleToRotationDeg = (angle: number) => {
    const t = clamp01((angle - 30) / 120);
    return -60 + t * 120;
  };

  const angleToCoord = (angle: number, r: number = radius) => {
    const rotDeg = mapAngleToRotationDeg(angle);
    const alphaRad = (rotDeg * Math.PI) / 180;
    const x = cx + r * Math.sin(alphaRad);
    const y = cy - r * Math.cos(alphaRad);
    return { x, y, rotDeg };
  };

  // Generate SVG path for the tracking sky arc
  const startP = angleToCoord(25, radius);
  const endP = angleToCoord(155, radius);
  const arcPath = `M ${startP.x} ${startP.y} A ${radius} ${radius} 0 0 1 ${endP.x} ${endP.y}`;

  // Ticks definition (every 10 deg from 30 to 150)
  const ticks = [];
  for (let deg = 30; deg <= 150; deg += 10) {
    const isMajor = deg === 30 || deg === 60 || deg === 90 || deg === 120 || deg === 150;
    const innerR = isMajor ? radius - 16 : radius - 8;
    const outerR = radius + 2;
    const p1 = angleToCoord(deg, innerR);
    const p2 = angleToCoord(deg, outerR);
    const labelP = angleToCoord(deg, radius - 30);
    ticks.push({ deg, p1, p2, labelP, isMajor });
  }

  // Active Sun Position
  const activeSunAngle = safeSun !== null ? safeSun : safeTarget;
  const sunPos = angleToCoord(activeSunAngle, radius);

  // 3. Rotation angles for Servo and Ghost Target
  const panelRotation = mapAngleToRotationDeg(safeServo);
  const ghostRotation = mapAngleToRotationDeg(safeTarget);

  // Pointing Error
  const rawError = safeSun !== null ? Math.abs(safeSun - safeServo) : Math.abs(safeTarget - safeServo);
  const pointingError = Math.round(rawError * 10) / 10;
  const isLocked = pointingError <= threshold;

  return (
    <div className="card-clean p-6 lg:p-8 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-white via-slate-50/40 to-slate-100/60">
      
      {/* Top Header Row of Hero */}
      <div className="flex flex-wrap items-center justify-between gap-3 z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
              <Sun className="w-5 h-5" />
            </span>
            <h2 className="text-lg lg:text-xl font-bold text-slate-900 tracking-tight">
              Sun-Tracking Sky Arc
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time optical alignment between celestial sun path and dual-LDR photovoltaic array
          </p>
        </div>

        {/* Dynamic Error Status Badge */}
        <div className="flex items-center gap-2.5">
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold shadow-xs transition-all ${
            isLocked
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-amber-50 text-amber-700 border-amber-300 ring-2 ring-amber-400/10'
          }`}>
            <Target className={`w-4 h-4 ${isLocked ? 'text-emerald-600' : 'text-amber-600 animate-pulse'}`} />
            <span>ALIGNMENT ERROR:</span>
            <span className="font-mono text-sm font-extrabold">{pointingError.toFixed(1)}°</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold ${
              isLocked ? 'bg-emerald-200/80 text-emerald-900' : 'bg-amber-200/80 text-amber-900'
            }`}>
              {isLocked ? 'LOCK HELD' : 'SEEKING'}
            </span>
          </div>

          {isCloudActive && (
            <div className="px-2.5 py-1 rounded-lg bg-slate-200/90 text-slate-700 text-xs font-semibold animate-pulse border border-slate-300">
              ☁ Cloud Event Active
            </div>
          )}
        </div>
      </div>

      {/* SVG Canvas for Arc, Sun, Rays, and Rotating Array */}
      <div className="w-full relative flex items-center justify-center my-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[840px] h-auto select-none overflow-visible"
        >
          <defs>
            {/* Sky glow gradient */}
            <radialGradient id="skyDomeGlow" cx="50%" cy="85%" r="65%">
              <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#F8FAFC" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#F8FAFC" stopOpacity="0" />
            </radialGradient>

            {/* Sun Radial Glow */}
            <radialGradient id="sunGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="40%" stopColor="#FDE047" />
              <stop offset="85%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </radialGradient>

            {/* Solar panel gradient */}
            <linearGradient id="panelGlass" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="50%" stopColor="#0F172A" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>

            {/* Solar cell grid pattern */}
            <pattern id="solarGrid" width="12" height="12" patternUnits="userSpaceOnUse">
              <path d="M 12 0 L 0 0 0 12" fill="none" stroke="#334155" strokeWidth="0.8" />
            </pattern>
          </defs>

          {/* Sky Dome Background Fill */}
          <path
            d={`M 150 ${cy} A ${radius + 20} ${radius + 20} 0 0 1 650 ${cy} Z`}
            fill="url(#skyDomeGlow)"
          />

          {/* Ground Horizon Line */}
          <line
            x1="80"
            y1={cy}
            x2="720"
            y2={cy}
            stroke="#E2E8F0"
            strokeWidth="2"
            strokeDasharray="4 4"
          />

          {/* Pedestal Ground Mount Base */}
          <ellipse cx={cx} cy={cy} rx="65" ry="14" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="2" />
          <path d={`M ${cx - 24} ${cy} L ${cx - 16} ${pivotY} L ${cx + 16} ${pivotY} L ${cx + 24} ${cy} Z`} fill="#94A3B8" />
          <circle cx={pivotX} cy={pivotY} r="10" fill="#475569" stroke="#334155" strokeWidth="2" />

          {/* Sky Arc Track */}
          <path
            d={arcPath}
            fill="none"
            stroke="#CBD5E1"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Active Track Highlight from 30 to 150 */}
          {(() => {
            const p30 = angleToCoord(30, radius);
            const p150 = angleToCoord(150, radius);
            return (
              <path
                d={`M ${p30.x} ${p30.y} A ${radius} ${radius} 0 0 1 ${p150.x} ${p150.y}`}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2.5"
                strokeOpacity="0.5"
                strokeDasharray="3 3"
              />
            );
          })()}

          {/* Angle Tick Marks & Labels */}
          {ticks.map(({ deg, p1, p2, labelP, isMajor }) => (
            <g key={deg}>
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={isMajor ? '#64748B' : '#94A3B8'}
                strokeWidth={isMajor ? 2.5 : 1.5}
                strokeLinecap="round"
              />
              {isMajor && (
                <text
                  x={labelP.x}
                  y={labelP.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-[12px] font-mono font-bold fill-slate-500"
                >
                  {deg}°
                </text>
              )}
            </g>
          ))}

          {/* Cardinal Labels */}
          <text x="180" y={cy + 25} textAnchor="middle" className="text-[13px] font-bold fill-blue-600 tracking-wider">
            30° EAST (Sunrise)
          </text>
          <text x={cx} y="55" textAnchor="middle" className="text-[13px] font-bold fill-amber-600 tracking-wider">
            90° ZENITH (High Noon)
          </text>
          <text x="620" y={cy + 25} textAnchor="middle" className="text-[13px] font-bold fill-teal-600 tracking-wider">
            150° WEST (Sunset)
          </text>

          {/* Laser Sight Beam from Panel Pivot to Sun */}
          {(mode === 'DEMO' || safeSun !== null) && (
            <g>
              <line
                x1={pivotX}
                y1={pivotY}
                x2={sunPos.x}
                y2={sunPos.y}
                stroke={isLocked ? '#10B981' : '#F59E0B'}
                strokeWidth="1.5"
                strokeDasharray="4 3"
                opacity="0.8"
                style={{ transition: 'all 150ms linear' }}
              />
              <circle
                cx={sunPos.x}
                cy={sunPos.y}
                r="30"
                fill="none"
                stroke={isLocked ? '#10B981' : '#F59E0B'}
                strokeWidth="1"
                strokeOpacity="0.4"
                strokeDasharray="2 2"
                style={{ transition: 'all 150ms linear' }}
              />
            </g>
          )}

          {/* Ghost Panel Outline (Target Angle) - Pivots at (pivotX, pivotY) */}
          <g
            transform={`rotate(${ghostRotation} ${pivotX} ${pivotY})`}
            style={{
              transformBox: 'view-box',
              transformOrigin: `${pivotX}px ${pivotY}px`,
              transform: `rotate(${ghostRotation}deg)`,
              transition: 'transform 150ms linear',
            }}
            opacity="0.38"
          >
            <rect
              x={pivotX - 65}
              y={pivotY - 14}
              width="130"
              height="28"
              rx="5"
              fill="none"
              stroke="#64748B"
              strokeWidth="2"
              strokeDasharray="3 3"
            />
            <text x={pivotX} y={pivotY + 3} textAnchor="middle" className="text-[10px] font-mono fill-slate-500 font-bold">
              TARGET {safeTarget}°
            </text>
          </g>

          {/* Physical Solar Panel Assembly (Servo Angle) - Pivots at base (pivotX, pivotY) */}
          <g
            transform={`rotate(${panelRotation} ${pivotX} ${pivotY})`}
            style={{
              transformBox: 'view-box',
              transformOrigin: `${pivotX}px ${pivotY}px`,
              transform: `rotate(${panelRotation}deg)`,
              transition: 'transform 150ms linear',
            }}
          >
            {/* Panel Normal Vector / Line of Sight */}
            <line
              x1={pivotX}
              y1={pivotY}
              x2={pivotX}
              y2={pivotY - 90}
              stroke={isLocked ? '#10B981' : '#3B82F6'}
              strokeWidth="2"
              strokeDasharray="4 2"
            />
            <circle cx={pivotX} cy={pivotY - 90} r="3" fill={isLocked ? '#10B981' : '#3B82F6'} />

            {/* Main Photovoltaic Panel Frame */}
            <rect
              x={pivotX - 70}
              y={pivotY - 15}
              width="140"
              height="30"
              rx="6"
              fill="url(#panelGlass)"
              stroke="#475569"
              strokeWidth="2.5"
              filter="drop-shadow(0 4px 6px rgba(0,0,0,0.15))"
            />

            {/* Blue PV Cell Grid Texture */}
            <rect
              x={pivotX - 66}
              y={pivotY - 12}
              width="132"
              height="24"
              rx="3"
              fill="url(#solarGrid)"
            />

            {/* Center Solar Cell Divider */}
            <line x1={pivotX} y1={pivotY - 12} x2={pivotX} y2={pivotY + 12} stroke="#60A5FA" strokeWidth="1.5" opacity="0.6" />

            {/* Dual-LDR Sensors */}
            {/* East LDR Sensor (Left side of panel) */}
            <circle cx={pivotX - 50} cy={pivotY - 20} r="6" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="1.5" />
            <text x={pivotX - 50} y={pivotY - 30} textAnchor="middle" className="text-[10px] font-black fill-blue-600">
              E
            </text>

            {/* West LDR Sensor (Right side of panel) */}
            <circle cx={pivotX + 50} cy={pivotY - 20} r="6" fill="#0D9488" stroke="#FFFFFF" strokeWidth="1.5" />
            <text x={pivotX + 50} y={pivotY - 30} textAnchor="middle" className="text-[10px] font-black fill-teal-600">
              W
            </text>

            {/* Light Sensor Divider Shade Fin in the middle */}
            <path d={`M ${pivotX} ${pivotY - 15} L ${pivotX - 2} ${pivotY - 34} L ${pivotX + 2} ${pivotY - 34} Z`} fill="#64748B" stroke="#334155" strokeWidth="1" />

            {/* Center Pivot Hub */}
            <circle cx={pivotX} cy={pivotY} r="8" fill="#F8FAFC" stroke="#0F172A" strokeWidth="2.5" />
            <circle cx={pivotX} cy={pivotY} r="3" fill="#F59E0B" />
          </g>

          {/* Animated Glowing Sun Icon */}
          {(mode === 'DEMO' || safeSun !== null) && (
            <g
              transform={`translate(${sunPos.x}, ${sunPos.y})`}
              style={{
                transformBox: 'view-box',
                transformOrigin: '0px 0px',
                transform: `translate(${sunPos.x}px, ${sunPos.y}px)`,
                transition: 'transform 150ms linear',
              }}
            >
              {/* Outer soft glow ring */}
              <circle
                cx="0"
                cy="0"
                r={isCloudActive ? "24" : "34"}
                fill="#F59E0B"
                opacity={isCloudActive ? "0.15" : "0.35"}
                className={isCloudActive ? "" : "animate-sun-glow"}
              />

              {/* Sun Core Disc */}
              <circle
                cx="0"
                cy="0"
                r={isCloudActive ? "16" : "20"}
                fill="url(#sunGradient)"
                stroke="#D97706"
                strokeWidth="2"
              />

              {/* Sun Rays */}
              {!isCloudActive && [0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                <line
                  key={angle}
                  x1="0"
                  y1="0"
                  x2="28"
                  y2="0"
                  transform={`rotate(${angle})`}
                  stroke="#F59E0B"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.8"
                />
              ))}

              {/* Center Sun Degree Label */}
              <rect
                x="-22"
                y="24"
                width="44"
                height="18"
                rx="4"
                fill="#1E293B"
                opacity="0.9"
              />
              <text
                x="0"
                y="36"
                textAnchor="middle"
                className="text-[11px] font-mono font-bold fill-white"
              >
                {Math.round(activeSunAngle)}°
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Hero Footer Legend & Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-200/80 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-3.5 h-2 rounded bg-slate-900 border border-slate-700 inline-block" />
            <span>Active Array: <strong className="text-slate-900 font-mono">{safeServo}°</strong></span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span className="w-3.5 h-2 rounded border-2 border-dashed border-slate-400 inline-block" />
            <span>Target: <strong className="text-slate-700 font-mono">{safeTarget}°</strong></span>
          </div>
          {(mode === 'DEMO' || safeSun !== null) && (
            <div className="flex items-center gap-1.5 font-medium text-amber-700">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block ring-2 ring-amber-300" />
              <span>Sun Position: <strong className="font-mono">{Math.round(activeSunAngle)}°</strong></span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 font-mono text-slate-500">
          <span>Servo Sweeping Zone: <strong>30° (East) — 150° (West)</strong></span>
        </div>
      </div>

    </div>
  );
};
