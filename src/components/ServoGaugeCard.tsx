import React from 'react';
import { Gauge } from 'lucide-react';

interface ServoGaugeCardProps {
  servoAngle: number;
  targetAngle: number;
}

export const ServoGaugeCard: React.FC<ServoGaugeCardProps> = ({
  servoAngle,
  targetAngle,
}) => {
  // 1. Log telemetry values and ensure numbers with safe defaults (servo 90, target 90)
  const safeServo = typeof servoAngle === 'number' && !isNaN(servoAngle) ? Number(servoAngle) : 90;
  const safeTarget = typeof targetAngle === 'number' && !isNaN(targetAngle) ? Number(targetAngle) : 90;

  console.log('[ServoGaugeCard] Received telemetry:', {
    servo: safeServo,
    target: safeTarget,
    raw: { servoAngle, targetAngle },
  });

  const lag = safeTarget - safeServo;

  // Gauge dimensions
  const size = 260;
  const center = size / 2; // 130
  const radius = 95;

  // 2. Map servo angle 30-150 to dial sweep with (angle - 30) / 120 and clamp
  const clamp01 = (val: number) => Math.max(0, Math.min(1, val));

  // Range: 30° East = -60°, 90° Zenith = 0°, 150° West = +60°
  const mapAngleToRotationDeg = (angle: number) => {
    const t = clamp01((angle - 30) / 120);
    return -60 + t * 120;
  };

  const angleToCoord = (angle: number, r: number = radius) => {
    const rotDeg = mapAngleToRotationDeg(angle);
    const alphaRad = (rotDeg * Math.PI) / 180;
    const x = center + r * Math.sin(alphaRad);
    const y = center - r * Math.cos(alphaRad);
    return { x, y, rotDeg };
  };

  // Generate background track arc from 30 to 150
  const startP = angleToCoord(30, radius);
  const endP = angleToCoord(150, radius);
  const arcPath = `M ${startP.x} ${startP.y} A ${radius} ${radius} 0 0 1 ${endP.x} ${endP.y}`;

  // Major and minor ticks
  const ticks = [];
  for (let deg = 30; deg <= 150; deg += 15) {
    const isMajor = deg === 30 || deg === 60 || deg === 90 || deg === 120 || deg === 150;
    const p1 = angleToCoord(deg, radius - (isMajor ? 12 : 7));
    const p2 = angleToCoord(deg, radius + 2);
    const labelP = angleToCoord(deg, radius - 22);
    ticks.push({ deg, p1, p2, labelP, isMajor });
  }

  // 3. Rotation angles for Needle and Target Marker
  const needleRotation = mapAngleToRotationDeg(safeServo);
  const targetRotation = mapAngleToRotationDeg(safeTarget);

  return (
    <div className="card-clean p-6 flex flex-col justify-between bg-white relative">
      
      {/* Card Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Gauge className="w-4 h-4" />
          </span>
          <h3 className="font-bold text-slate-800 text-base">Servo Position Dial</h3>
        </div>

        {/* Lag Badge */}
        <div className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 font-mono ${
          Math.abs(lag) <= 1
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
        }`}>
          <span>LAG:</span>
          <span>{lag > 0 ? `+${lag}°` : `${lag}°`}</span>
          <span className="text-[10px] font-sans font-semibold text-slate-500">
            {Math.abs(lag) <= 1 ? '(Synced)' : lag > 0 ? '(Catching)' : '(Settling)'}
          </span>
        </div>
      </div>

      {/* Circular Dial Visual */}
      <div className="relative flex items-center justify-center my-3">
        <svg width={size} height={size * 0.78} viewBox={`0 0 ${size} ${size * 0.78}`} className="overflow-visible select-none">
          <defs>
            <linearGradient id="gaugeArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#0D9488" />
            </linearGradient>

            <filter id="needleGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Track Arc Background */}
          <path
            d={arcPath}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Colorful Arc Gradient */}
          <path
            d={arcPath}
            fill="none"
            stroke="url(#gaugeArcGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* Dial Ticks */}
          {ticks.map(({ deg, p1, p2, labelP, isMajor }) => (
            <g key={deg}>
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={isMajor ? '#475569' : '#94A3B8'}
                strokeWidth={isMajor ? 2.5 : 1.5}
                strokeLinecap="round"
              />
              {isMajor && (
                <text
                  x={labelP.x}
                  y={labelP.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-[10px] font-mono font-bold fill-slate-500"
                >
                  {deg}°
                </text>
              )}
            </g>
          ))}

          {/* Target Angle Marker (Triangle) - Pivots at (center, center) */}
          <g
            transform={`rotate(${targetRotation} ${center} ${center})`}
            style={{
              transformBox: 'view-box',
              transformOrigin: `${center}px ${center}px`,
              transform: `rotate(${targetRotation}deg)`,
              transition: 'transform 150ms linear',
            }}
          >
            <polygon
              points={`${center},${center - radius - 5} ${center - 5},${center - radius - 13} ${center + 5},${center - radius - 13}`}
              fill="#6366F1"
              stroke="#312E81"
              strokeWidth="1"
            />
          </g>

          {/* Central Needle Assembly - Pivots at dial center (center, center) with 150ms linear transition */}
          <g
            transform={`rotate(${needleRotation} ${center} ${center})`}
            style={{
              transformBox: 'view-box',
              transformOrigin: `${center}px ${center}px`,
              transform: `rotate(${needleRotation}deg)`,
              transition: 'transform 150ms linear',
            }}
            filter="url(#needleGlow)"
          >
            {/* Needle shaft pointing straight up toward (center, center - 88) */}
            <path
              d={`M ${center - 3} ${center + 10} L ${center - 1.5} ${center - 82} L ${center} ${center - 88} L ${center + 1.5} ${center - 82} L ${center + 3} ${center + 10} Z`}
              fill="#0F172A"
            />
            {/* Orange Needle Tip Indicator */}
            <polygon
              points={`${center - 2},${center - 60} ${center},${center - 88} ${center + 2},${center - 60}`}
              fill="#F59E0B"
            />
            {/* Needle Pivot Hub */}
            <circle cx={center} cy={center} r="10" fill="#1E293B" stroke="#CBD5E1" strokeWidth="2.5" />
            <circle cx={center} cy={center} r="4" fill="#F59E0B" />
          </g>
        </svg>
      </div>

      {/* Large Numerical Digits Display (Projector-friendly) */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70 text-center">
          <div className="text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-1">
            Actual Servo
          </div>
          <div className="font-mono text-3xl lg:text-4xl font-extrabold text-slate-900 leading-none tracking-tight">
            {safeServo}°
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">
            SG90 Position
          </div>
        </div>

        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/70 text-center">
          <div className="text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-1">
            Target Angle
          </div>
          <div className="font-mono text-3xl lg:text-4xl font-extrabold text-indigo-700 leading-none tracking-tight">
            {safeTarget}°
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">
            Sensed Optimum
          </div>
        </div>
      </div>

    </div>
  );
};
