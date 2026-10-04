import React, { useState, useEffect } from 'react';
import {
  Network,
  Activity,
  AlertTriangle,
  Layers,
  Thermometer,
  Gauge,
  Sliders,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Info,
  Wind,
  Eye
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export interface PipelineAnimationProps {
  pipelineId?: string;
  fromAsset?: string;
  toAsset?: string;
  inletPressure?: number;
  outletPressure?: number;
  temperature?: number;
  heatLossRate?: number;
  status?: string;
  anomalyDetected?: boolean;
}

export const PipelineAnimation: React.FC<PipelineAnimationProps> = ({
  pipelineId = 'SP-01',
  fromAsset = 'SG-01',
  toAsset = 'IW-01',
  inletPressure = 88.0,
  outletPressure = 84.2,
  temperature = 278.0,
  heatLossRate = 4.1,
  status = 'NORMAL',
  anomalyDetected = false,
}) => {
  // Viewports: 'isometric' (3D cutaway + FLIR), 'hydraulic' (pressure profile), 'stress' (hoop stress)
  const [activeTab, setActiveTab] = useState<'isometric' | 'hydraulic' | 'stress'>('isometric');
  const [flirMode, setFlirMode] = useState<boolean>(anomalyDetected);

  const deltaP = Math.max(0, inletPressure - outletPressure);
  const isSteam = pipelineId.startsWith('SP');

  // Animation pulse
  const [flowPulse, setFlowPulse] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setFlowPulse((p) => (p + 1) % 100), 40);
    return () => clearInterval(timer);
  }, []);

  // Compute exact coordinates along the pipeline centerline and through the Omega expansion loop
  const getPipelinePoint = (distance: number): { x: number; y: number } => {
    const d = ((distance % 679) + 679) % 679;

    // Segment 1: Left straight pipe (0 to 170) -> X: 30 to 200, Y: 178
    if (d < 170) {
      return { x: 30 + d, y: 178 };
    }
    // Segment 2: Loop upward vertical leg (170 to 258) -> X: 200, Y: 178 down to 90
    if (d < 258) {
      const segD = d - 170;
      return { x: 200, y: 178 - segD };
    }
    // Segment 3: Loop top-left elbow bend (258 to 289.4) -> Arc around (220, 90) R=20
    if (d < 289.4) {
      const t = (d - 258) / 31.4;
      const angle = Math.PI - t * (Math.PI / 2);
      return {
        x: 220 + 20 * Math.cos(angle),
        y: 90 - 20 * Math.sin(angle),
      };
    }
    // Segment 4: Loop top horizontal span (289.4 to 389.4) -> X: 220 to 320, Y: 70
    if (d < 389.4) {
      const segD = d - 289.4;
      return { x: 220 + segD, y: 70 };
    }
    // Segment 5: Loop top-right elbow bend (389.4 to 420.8) -> Arc around (320, 90) R=20
    if (d < 420.8) {
      const t = (d - 389.4) / 31.4;
      const angle = (Math.PI / 2) - t * (Math.PI / 2);
      return {
        x: 320 + 20 * Math.cos(angle),
        y: 90 - 20 * Math.sin(angle),
      };
    }
    // Segment 6: Loop downward vertical leg (420.8 to 508.8) -> X: 340, Y: 90 to 178
    if (d < 508.8) {
      const segD = d - 420.8;
      return { x: 340, y: 90 + segD };
    }
    // Segment 7: Right straight pipe (508.8 to 678.8) -> X: 340 to 510, Y: 178
    const segD = d - 508.8;
    return { x: 340 + segD, y: 178 };
  };

  return (
    <div className="relative w-full bg-[#071322] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
      {/* TOP TELEMETRY HUD BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-gradient-to-r from-[#0B1E36] via-[#0D2442] to-[#08172A] border-b border-slate-800/80 z-20">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className={`w-3 h-3 rounded-full ${anomalyDetected ? 'bg-amber-400 animate-ping' : 'bg-cyan-400'} absolute`}></span>
            <span className={`w-3 h-3 rounded-full ${anomalyDetected ? 'bg-amber-500' : 'bg-cyan-500'} relative`}></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-widest text-white uppercase">
                {pipelineId} HYDRAULIC & STRUCTURAL DIGITAL TWIN
              </span>
              <StatusBadge status={anomalyDetected ? 'WARNING' : status} size="sm" />
            </div>
            <p className="text-[10px] font-mono text-slate-400">
              {fromAsset} ➔ {toAsset} • 8" SCH 80 ASTM A106 • CALCIUM SILICATE INSULATION • 620m SPAN
            </p>
          </div>
        </div>

        {/* Live Telemetry Readouts */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 flex items-center gap-2">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">INLET:</span>
            <span className="text-white font-bold">{inletPressure.toFixed(1)} bar</span>
          </div>

          <div className="px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 flex items-center gap-2">
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">ΔP DROP:</span>
            <span className={`font-bold ${deltaP > 4.5 ? 'text-amber-400' : 'text-cyan-300'}`}>
              {deltaP.toFixed(1)} bar
            </span>
          </div>

          <div className="px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 flex items-center gap-2">
            <Thermometer className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-slate-400">TEMP:</span>
            <span className="text-rose-300 font-bold">{temperature.toFixed(1)} °C</span>
          </div>

          <div className="hidden sm:flex px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 items-center gap-2">
            <span className="text-slate-400">HEAT LOSS:</span>
            <span className={`font-bold ${heatLossRate > 6.0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {heatLossRate.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* VIEWPORT CONTROLS */}
      <div className="flex items-center justify-between px-5 py-2 bg-slate-950/60 border-b border-slate-800/60 z-10 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 uppercase text-[10px] tracking-wider">VIEWPORT:</span>
          <button
            onClick={() => setActiveTab('isometric')}
            className={`px-3 py-1 rounded-md transition-all font-semibold ${
              activeTab === 'isometric'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Isometric CAD & FLIR Thermal Scan
          </button>
          <button
            onClick={() => setActiveTab('hydraulic')}
            className={`px-3 py-1 rounded-md transition-all font-semibold ${
              activeTab === 'hydraulic'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Longitudinal Hydraulic Profile (ΔP)
          </button>
          <button
            onClick={() => setActiveTab('stress')}
            className={`px-3 py-1 rounded-md transition-all font-semibold ${
              activeTab === 'stress'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            ASME B31.3 Hoop Stress & U-Loop
          </button>
        </div>

        {/* FLIR IR Scanner Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFlirMode(!flirMode)}
            className={`px-2.5 py-1 rounded border text-[11px] font-mono transition-all flex items-center gap-1.5 ${
              flirMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>FLIR INFRARED SCANNER {flirMode ? '[ON]' : '[OFF]'}</span>
          </button>
        </div>
      </div>

      {/* MAIN VIEWPORT DISPLAY */}
      <div className="relative w-full h-[360px] sm:h-[400px] bg-gradient-to-b from-[#061527] via-[#05111F] to-[#030912] flex items-center justify-center overflow-hidden">
        {/* VIEW 1: ISOMETRIC CAD & FLIR INFRARED CUTAWAY */}
        {activeTab === 'isometric' && (
          <div className="w-full h-full flex flex-col md:flex-row items-center justify-between p-6 gap-6">
            <div className="relative w-full md:w-3/5 h-full flex items-center justify-center">
              <svg viewBox="0 0 540 320" className="w-full h-full max-h-[310px] select-none">
                <defs>
                  {/* Steel Pipe Metallic Gradient */}
                  <linearGradient id="pipeSteel" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#475569" />
                    <stop offset="30%" stopColor="#94A3B8" />
                    <stop offset="70%" stopColor="#334155" />
                    <stop offset="100%" stopColor="#1E293B" />
                  </linearGradient>

                  {/* Insulation Calcium Silicate Gradient */}
                  <linearGradient id="insulationGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#CA8A04" />
                    <stop offset="50%" stopColor="#EAB308" />
                    <stop offset="100%" stopColor="#854D0E" />
                  </linearGradient>

                  {/* Aluminum Weather Cladding Jacket */}
                  <linearGradient id="aluminumJacket" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#94A3B8" />
                    <stop offset="50%" stopColor="#E2E8F0" />
                    <stop offset="100%" stopColor="#64748B" />
                  </linearGradient>

                  {/* FLIR Infrared False Color Gradient */}
                  <linearGradient id="flirHeatGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="40%" stopColor="#10B981" />
                    <stop offset="70%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#EF4444" />
                  </linearGradient>
                </defs>

                {/* Ground Datum Line & Support Footings */}
                <line x1="20" y1="260" x2="520" y2="260" stroke="#334155" strokeWidth="1.5" strokeDasharray="6 4" />
                <text x="270" y="280" fill="#475569" fontSize="8" fontFamily="monospace" textAnchor="middle">
                  EXPANSION ZONE: +48mm FLEXURE • GROUND DATUM (ASME B31.3)
                </text>

                {/* Ground Support Footings (Positioned at spans and loop guides, keeping flex bay clear) */}
                {[90, 180, 360, 450].map((gx) => (
                  <g key={gx}>
                    <rect x={gx - 15} y="220" width="30" height="40" fill="#1E293B" stroke="#334155" strokeWidth="1.5" />
                    <line x1={gx - 20} y1="260" x2={gx + 20} y2="260" stroke="#475569" strokeWidth="3" />
                    {/* Teflon Sliding Shoe Support */}
                    <rect x={gx - 12} y="196" width="24" height="24" fill="#0F172A" stroke="#0284C7" strokeWidth="1.5" />
                  </g>
                ))}

                {/* MAIN PIPELINE RUN WITH OMEGA EXPANSION LOOP (X = 30 to 510, Y = 178) */}
                {/* 1. Straight Section from Left into Loop */}
                <rect
                  x="30"
                  y="160"
                  width="170"
                  height="36"
                  rx="4"
                  fill={flirMode ? 'url(#flirHeatGrad)' : 'url(#aluminumJacket)'}
                  stroke="#475569"
                  strokeWidth="2"
                />

                {/* 2. THE OMEGA EXPANSION LOOP (Flexing U-Bend from X=200 to X=340) */}
                <path
                  d="M 200 178 L 200 90 Q 200 70 220 70 L 320 70 Q 340 70 340 90 L 340 178"
                  fill="none"
                  stroke={flirMode ? (anomalyDetected ? '#EF4444' : '#F59E0B') : 'url(#aluminumJacket)'}
                  strokeWidth="36"
                  strokeLinecap="butt"
                  strokeLinejoin="round"
                />

                {/* Weld Seam Rings at loop inlet and outlet */}
                <line x1="200" y1="160" x2="200" y2="196" stroke="#1E293B" strokeWidth="2" />
                <line x1="340" y1="160" x2="340" y2="196" stroke="#1E293B" strokeWidth="2" />

                {/* Inner Carrier Core Tube inside Loop */}
                <path
                  d="M 200 178 L 200 90 Q 200 70 220 70 L 320 70 Q 340 70 340 90 L 340 178"
                  fill="none"
                  stroke={isSteam ? '#38BDF8' : '#F59E0B'}
                  strokeWidth="12"
                  strokeLinecap="butt"
                  strokeLinejoin="round"
                  opacity="0.8"
                />

                {/* 3. Straight Section from Loop to Right */}
                <rect
                  x="340"
                  y="160"
                  width="170"
                  height="36"
                  rx="4"
                  fill={flirMode ? (anomalyDetected ? '#EF4444' : 'url(#flirHeatGrad)') : 'url(#aluminumJacket)'}
                  stroke="#475569"
                  strokeWidth="2"
                />

                {/* LAYER CUTAWAY CALLOUTS ON LEFT SECTION */}
                {!flirMode && (
                  <g>
                    {/* Layer 2: Calcium Silicate Insulation Cutaway (X = 60 to 110) */}
                    <rect x="70" y="166" width="50" height="24" fill="url(#insulationGrad)" stroke="#B45309" strokeWidth="1" />
                    {/* Layer 1: Steel Core Carrier Pipe Cutaway (X = 120 to 160) */}
                    <rect x="120" y="170" width="40" height="16" fill="url(#pipeSteel)" stroke="#38BDF8" strokeWidth="1" />
                    {/* Inner Steam Vapor Flow Core */}
                    <line x1="120" y1="178" x2="160" y2="178" stroke="#38BDF8" strokeWidth="6" />
                  </g>
                )}

                {/* DYNAMIC FLUID FLOW PARTICLES THAT TRACK ALONG THE REAL PIPELINE PATH & OMEGA LOOP */}
                {[0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650].map((baseDist, idx) => {
                  const currentDist = (baseDist + flowPulse * 6.79) % 679;
                  const pt = getPipelinePoint(currentDist);
                  return (
                    <circle
                      key={idx}
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      fill={isSteam ? '#38BDF8' : '#F59E0B'}
                      className="animate-pulse"
                    />
                  );
                })}

                {/* LOCALIZED ANOMALY HOT SPOT PLUME (If anomaly detected, e.g. SP-02) */}
                {anomalyDetected && (
                  <g transform="translate(425, 178)">
                    {/* Thermal Plume Aura */}
                    <circle cx="0" cy="0" r="28" fill="#EF4444" opacity="0.35" className="animate-ping" />
                    <circle cx="0" cy="0" r="14" fill="#F59E0B" opacity="0.6" className="animate-pulse" />
                    <circle cx="0" cy="0" r="6" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />

                    {/* Anomaly Callout Box */}
                    <rect x="-65" y="-70" width="130" height="42" rx="6" fill="#450A0A" stroke="#EF4444" strokeWidth="2" />
                    <text x="0" y="-52" fill="#FCA5A5" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      ⚠️ THERMAL ANOMALY: SPAN 3-B
                    </text>
                    <text x="0" y="-38" fill="#FDA4AF" fontSize="7.5" fontFamily="monospace" textAnchor="middle">
                      ΔP: {deltaP.toFixed(1)} bar • Heat Loss: {heatLossRate.toFixed(1)}%
                    </text>
                    <line x1="0" y1="-28" x2="0" y2="-6" stroke="#EF4444" strokeWidth="2" strokeDasharray="3 2" />
                  </g>
                )}

                {/* Cladding Stainless Steel Bands */}
                {[45, flirMode ? 85 : 55, flirMode ? 125 : 190, 350, 400, 455, 490].map((bx) => (
                  <line key={bx} x1={bx} y1="160" x2={bx} y2="196" stroke="#0F172A" strokeWidth="2.5" />
                ))}

                {/* Inlet & Delivery Telemetry Badges (Symmetrically elevated at top corners, clear of anomaly callouts) */}
                <g>
                  <rect x="30" y="68" width="104" height="22" rx="4" fill="#081E34" stroke="#0284C7" strokeWidth="1" />
                  <circle cx="41" cy="79" r="3" fill="#38BDF8" className="animate-pulse" />
                  <text x="75" y="83" fill="#38BDF8" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    INLET: {inletPressure.toFixed(1)} bar
                  </text>
                </g>

                <g>
                  <rect x="406" y="68" width="104" height="22" rx="4" fill="#081E34" stroke="#0284C7" strokeWidth="1" />
                  <circle cx="417" cy="79" r="3" fill="#38BDF8" className="animate-pulse" />
                  <text x="460" y="83" fill="#38BDF8" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                    DELIVERY: {outletPressure.toFixed(1)} bar
                  </text>
                </g>

                <text x="270" y="48" fill="#F59E0B" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  THERMAL EXPANSION OMEGA LOOP (FLEXURE: +48mm)
                </text>
              </svg>
            </div>

            {/* Right Spec & FLIR Diagnostics Card */}
            <div className="w-full md:w-2/5 space-y-3 font-mono text-xs">
              <div className="petro-card p-4 border-slate-800 bg-slate-900/90 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    THERMAL HYDRAULIC SCANNER
                  </span>
                  <StatusBadge status={anomalyDetected ? 'WARNING' : 'NORMAL'} size="sm" />
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Carrier Material:</span>
                    <span className="text-white font-bold">ASTM A106 Gr. B (8" Sch 80)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Insulation Thickness:</span>
                    <span className="text-cyan-300 font-bold">50mm Calcium Silicate</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Measured ΔP Drop:</span>
                    <span className={`font-bold ${deltaP > 4.5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {deltaP.toFixed(1)} bar {deltaP > 4.5 && '(Elevated)'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">FLIR Infrared State:</span>
                    <span className={`font-bold ${anomalyDetected ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {anomalyDetected ? 'ANOMALY PINPOINTED' : 'UNIFORM THERMAL GRADIENT'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Weather Dissipation:</span>
                    <span className="text-slate-200 font-bold">{heatLossRate.toFixed(1)}% Convective</span>
                  </div>
                </div>

                {anomalyDetected && (
                  <div className="p-2.5 rounded bg-amber-950/40 border border-amber-500/40 text-[10px] text-amber-300 space-y-1">
                    <strong>Diagnostic Finding:</strong> Measured differential pressure drop exceeds allowable baseline (4.0 bar). Localized FLIR thermal scan detects potential insulation wetness or bypass at span 3-B.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: LONGITUDINAL HYDRAULIC PROFILE */}
        {activeTab === 'hydraulic' && (
          <div className="w-full h-full flex flex-col md:flex-row items-center justify-between p-6 gap-6">
            <div className="relative w-full md:w-3/5 h-full flex items-center justify-center">
              <svg viewBox="0 0 450 280" className="w-full h-full max-h-[280px] select-none">
                <rect x="50" y="20" width="370" height="230" fill="#0A1626" stroke="#1E293B" strokeWidth="2" rx="4" />
                {/* Y-Axis Gridlines (Pressure: 75 to 95 bar) */}
                {[60, 110, 160, 210].map((gy, i) => (
                  <g key={gy}>
                    <line x1="50" y1={gy} x2="420" y2={gy} stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
                    <text x="45" y={gy + 3} fill="#64748B" fontSize="8" fontFamily="monospace" textAnchor="end">
                      {i === 0 ? '90b' : i === 1 ? '85b' : i === 2 ? '80b' : '75b'}
                    </text>
                  </g>
                ))}

                {/* X-Axis Gridlines (Span: 0m to 620m) */}
                {[120, 200, 280, 360].map((gx, i) => (
                  <g key={gx}>
                    <line x1={gx} y1="20" x2={gx} y2="250" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
                    <text x={gx} y="265" fill="#64748B" fontSize="8" fontFamily="monospace" textAnchor="middle">
                      {i === 0 ? '150m' : i === 1 ? '300m' : i === 2 ? '450m' : '600m'}
                    </text>
                  </g>
                ))}

                {/* Allowable Pressure Corridor Reference */}
                <polygon
                  points="60,65 410,135 410,165 60,95"
                  fill="#0284C7"
                  fillOpacity="0.08"
                  stroke="#0284C7"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />

                {/* Measured Pressure Curve */}
                <path
                  d={`M 60 70 Q 200 95 ${anomalyDetected ? '260 120 L 320 145' : '260 110 L 320 125'} L 410 ${anomalyDetected ? '170' : '140'}`}
                  fill="none"
                  stroke={anomalyDetected ? '#F59E0B' : '#38BDF8'}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Anomaly Drop Marker on SP-02 */}
                {anomalyDetected && (
                  <g>
                    <circle cx="260" cy="120" r="5" fill="#EF4444" className="animate-ping" />
                    <circle cx="260" cy="120" r="4" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
                    <text x="260" y="105" fill="#EF4444" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                      ΔP STEP DROP (6.8b)
                    </text>
                  </g>
                )}

                <text x="235" y="15" fill="#38BDF8" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  HYDRAULIC PRESSURE GRADIENT vs SPAN DISTANCE (620m)
                </text>
              </svg>
            </div>

            <div className="w-full md:w-2/5 space-y-3 font-mono text-xs">
              <div className="petro-card p-4 border-slate-800 bg-slate-900/90 rounded-xl space-y-2">
                <span className="font-bold text-white uppercase text-xs flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  HYDRAULIC FLOW CAPACITY
                </span>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Flow Velocity:</span>
                    <span className="text-white font-bold">{isSteam ? '18.4 m/s' : '1.42 m/s'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Reynolds Number (Re):</span>
                    <span className="text-cyan-300 font-bold">142,500 (Turbulent)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Friction Factor (f):</span>
                    <span className="text-slate-200 font-bold">0.0182 Darcy</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Allowable ΔP Limit:</span>
                    <span className="text-emerald-400 font-bold">4.0 bar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: ASME B31.3 HOOP STRESS ANALYSIS */}
        {activeTab === 'stress' && (
          <div className="w-full h-full flex flex-col md:flex-row items-center justify-between p-6 gap-6">
            <div className="relative w-full md:w-3/5 h-full flex items-center justify-center">
              <svg viewBox="0 0 450 280" className="w-full h-full max-h-[280px] select-none">
                {/* Pipe Cross-Section Ring Gauge */}
                <circle cx="225" cy="130" r="85" fill="#0F172A" stroke="#334155" strokeWidth="8" />
                <circle cx="225" cy="130" r="72" fill="#0B1320" stroke="#0284C7" strokeWidth="12" />
                <circle cx="225" cy="130" r="60" fill="#040D18" />

                {/* Stress Vector Arrows pointing radially outward */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map((ang) => {
                  const rad = (ang * Math.PI) / 180;
                  const x1 = 225 + Math.cos(rad) * 45;
                  const y1 = 130 + Math.sin(rad) * 45;
                  const x2 = 225 + Math.cos(rad) * 65;
                  const y2 = 130 + Math.sin(rad) * 65;
                  return (
                    <line
                      key={ang}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#38BDF8"
                      strokeWidth="2.5"
                      markerEnd="url(#arrow)"
                    />
                  );
                })}

                <text x="225" y="125" fill="#FFFFFF" fontSize="16" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  142.4 MPa
                </text>
                <text x="225" y="145" fill="#38BDF8" fontSize="9" fontFamily="monospace" textAnchor="middle">
                  HOOP STRESS (Sh)
                </text>

                <text x="225" y="245" fill="#94A3B8" fontSize="9" fontFamily="monospace" textAnchor="middle">
                  ALLOWABLE STRESS: 220 MPa (ASTM A106 Gr. B • 64.7% OF SMYS)
                </text>
              </svg>
            </div>

            <div className="w-full md:w-2/5 space-y-3 font-mono text-xs">
              <div className="petro-card p-4 border-slate-800 bg-slate-900/90 rounded-xl space-y-2">
                <span className="font-bold text-white uppercase text-xs flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  ASME B31.3 STRUCTURAL SAFETY
                </span>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Specified Min Yield (SMYS):</span>
                    <span className="text-white font-bold">241 MPa</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Design Hoop Stress:</span>
                    <span className="text-cyan-300 font-bold">142.4 MPa (Safe)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Yield Utilization:</span>
                    <span className="text-emerald-400 font-bold">64.7% (Within 72% Code)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Thermal Expansion:</span>
                    <span className="text-amber-300 font-bold">+48 mm (Loop Absorbent)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER DISCLAIMER */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-5 py-3 bg-[#05111F] border-t border-slate-800/80 text-[11px] font-mono text-slate-400 z-10">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${anomalyDetected ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
          <span className="text-slate-300">
            {anomalyDetected
              ? 'WARNING: Differential pressure anomaly detected across span 3-B (FLIR inspection advised)'
              : 'Pipeline Hydraulic Twin: Operating in normal ASME B31.3 steady-state flow corridor.'}
          </span>
        </div>

        <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-cyan-500" />
          <span>PetroNexus 360 Digital Twin — Real-time physics simulation and predictive analytics platform.</span>
        </div>
      </div>
    </div>
  );
};
