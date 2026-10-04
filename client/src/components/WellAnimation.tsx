import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Droplet,
  Layers,
  Activity,
  Gauge,
  Thermometer,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  ChevronRight,
  Maximize2,
  Info,
  CircleDot
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export interface WellAnimationProps {
  wellTag?: string;
  wellType?: 'INJECTION' | 'PRODUCTION' | 'BACKUP' | string;
  pressure?: number;
  temperature?: number;
  flowRate?: number;
  status?: string;
  depthMd?: number;
}

export const WellAnimation: React.FC<WellAnimationProps> = ({
  wellTag = 'IW-01',
  wellType = 'INJECTION',
  pressure = 84.0,
  temperature = 268.0,
  flowRate = 2.9,
  status = 'NORMAL',
  depthMd = 1180,
}) => {
  // Viewports: 'subsurface' (downhole strata), 'surface' (Christmas tree), 'log' (pressure/temp depth profile)
  const [activeTab, setActiveTab] = useState<'subsurface' | 'surface' | 'log'>('subsurface');
  const [selectedDepthStrata, setSelectedDepthStrata] = useState<string>('payzone');

  const isInjector = wellType === 'INJECTION' || wellTag.startsWith('IW');
  const isProducer = wellType === 'PRODUCTION' || wellTag.startsWith('PW');

  // Animation pulse counter
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setPulse((p) => (p + 1) % 100), 50);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full bg-[#071322] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
      {/* TOP TELEMETRY HUD BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-gradient-to-r from-[#0B1E36] via-[#0D2442] to-[#08172A] border-b border-slate-800/80 z-20">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className={`w-3 h-3 rounded-full ${isInjector ? 'bg-cyan-400' : 'bg-amber-400'} animate-ping absolute`}></span>
            <span className={`w-3 h-3 rounded-full ${isInjector ? 'bg-cyan-500' : 'bg-amber-500'} relative`}></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-widest text-white uppercase">
                {wellTag} WELLBORE & DOWNHOLE DIGITAL TWIN
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                isInjector
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {isInjector ? 'THERMAL STEAM INJECTOR' : 'HEAVY OIL PRODUCER'}
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400">
              API SPEC 5CT CASING STRINGS • CAPROCK SEAL INTEGRITY • 1,200m MD PERFORATED PAY ZONE
            </p>
          </div>
        </div>

        {/* Live Telemetry Readouts */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 flex items-center gap-2">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">PRESSURE:</span>
            <span className="text-cyan-300 font-bold">{pressure.toFixed(1)} bar</span>
          </div>

          <div className="px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 flex items-center gap-2">
            <Thermometer className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-slate-400">TEMP:</span>
            <span className="text-white font-bold">{temperature.toFixed(1)} °C</span>
          </div>

          <div className="px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 flex items-center gap-2">
            {isInjector ? <Flame className="w-3.5 h-3.5 text-cyan-400" /> : <Droplet className="w-3.5 h-3.5 text-amber-400" />}
            <span className="text-slate-400">{isInjector ? 'STEAM:' : 'OIL RATE:'}</span>
            <span className={`font-bold ${isInjector ? 'text-cyan-300' : 'text-amber-300'}`}>
              {isInjector ? `${flowRate.toFixed(1)} t/hr` : `${(flowRate > 10 ? flowRate : flowRate * 150).toFixed(0)} BPD`}
            </span>
          </div>

          <div className="hidden sm:flex px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 items-center gap-2">
            <span className="text-slate-400">DEPTH:</span>
            <span className="font-bold text-slate-200">{depthMd} m MD</span>
          </div>
        </div>
      </div>

      {/* VIEWPORT CONTROLS */}
      <div className="flex items-center justify-between px-5 py-2 bg-slate-950/60 border-b border-slate-800/60 z-10 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 uppercase text-[10px] tracking-wider">VIEWPORT:</span>
          <button
            onClick={() => setActiveTab('subsurface')}
            className={`px-3 py-1 rounded-md transition-all font-semibold ${
              activeTab === 'subsurface'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Subsurface Stratigraphy & Wellbore
          </button>
          <button
            onClick={() => setActiveTab('surface')}
            className={`px-3 py-1 rounded-md transition-all font-semibold ${
              activeTab === 'surface'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Surface Christmas Tree & Manifold
          </button>
          <button
            onClick={() => setActiveTab('log')}
            className={`px-3 py-1 rounded-md transition-all font-semibold ${
              activeTab === 'log'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Pressure & Thermal Depth Log
          </button>
        </div>

        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Caprock Fracture Margin: <strong className="text-emerald-300">+{(94.0 - pressure).toFixed(1)} bar (Safe)</strong>
          </span>
        </div>
      </div>

      {/* MAIN VIEWPORT DISPLAY */}
      <div className="relative w-full h-[360px] sm:h-[400px] bg-gradient-to-b from-[#061527] via-[#05111F] to-[#030912] flex items-center justify-center overflow-hidden">
        {/* VIEW 1: SUBSURFACE WELLBORE & STRATIGRAPHY */}
        {activeTab === 'subsurface' && (
          <div className="w-full h-full flex flex-col md:flex-row items-center justify-between p-4 sm:p-6 gap-6 overflow-hidden">
            {/* Left Subsurface SVG */}
            <div className="relative w-full md:w-3/5 h-full flex items-center justify-center">
              <svg viewBox="0 0 600 360" className="w-full h-full max-h-[350px] select-none">
                <defs>
                  {/* Rock Formation Gradients */}
                  <linearGradient id="overburdenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#1E293B" />
                    <stop offset="100%" stopColor="#0F172A" />
                  </linearGradient>
                  <linearGradient id="caprockGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#132338" />
                    <stop offset="100%" stopColor="#0D1C2E" />
                  </linearGradient>
                  <linearGradient id="payzoneGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#451A03" />
                    <stop offset="50%" stopColor="#78350F" />
                    <stop offset="100%" stopColor="#1C0A00" />
                  </linearGradient>
                  {/* Steam / Oil Flow Gradients */}
                  <linearGradient id="casingSteel" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#64748B" />
                    <stop offset="50%" stopColor="#CBD5E1" />
                    <stop offset="100%" stopColor="#475569" />
                  </linearGradient>
                </defs>

                {/* GEOLOGICAL STRATIGRAPHIC HORIZONS */}
                {/* 1. Surface Overburden (0m - 300m) */}
                <rect x="20" y="30" width="560" height="70" fill="url(#overburdenGrad)" stroke="#334155" strokeWidth="1" />
                <text x="35" y="55" fill="#94A3B8" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  SURFACE OVERBURDEN (0 - 320m)
                </text>
                <text x="35" y="70" fill="#64748B" fontSize="8" fontFamily="monospace">
                  Quaternary glacial till & sandstone aquifer
                </text>

                {/* 2. Colorado Shale Caprock Seal (320m - 880m) */}
                <rect x="20" y="100" width="560" height="110" fill="url(#caprockGrad)" stroke="#0284C7" strokeWidth="1.5" strokeDasharray="3 3" />
                <text x="35" y="130" fill="#38BDF8" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  COLORADO SHALE CAPROCK SEAL (320 - 920m)
                </text>
                <text x="35" y="145" fill="#0EA5E9" fontSize="8" fontFamily="monospace">
                  Impermeable geological containment barrier • Fracture Ceiling: 94.0 bar
                </text>
                <text x="35" y="160" fill="#10B981" fontSize="8" fontFamily="monospace">
                  Current Pore Pressure: {pressure.toFixed(1)} bar • Status: INTACT & SAFE
                </text>

                {/* 3. Clearwater Heavy Oil Reservoir Sand (920m - 1,200m) */}
                <rect x="20" y="210" width="560" height="130" fill="url(#payzoneGrad)" stroke="#D97706" strokeWidth="1.5" />
                <text x="35" y="235" fill="#FBBF24" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  CLEARWATER PAY SAND RESERVOIR (920 - 1,200m MD)
                </text>
                <text x="35" y="250" fill="#FDE68A" fontSize="8" fontFamily="monospace">
                  Viscous Bitumen Formation • Stimulated Viscosity: 85 cP
                </text>

                {/* HEATED STEAM CHAMBER EXPANSION AURA (For Injector) */}
                {isInjector && (
                  <g>
                    <ellipse cx="300" cy="275" rx="140" ry="55" fill="#EA580C" opacity="0.25" className="animate-pulse" />
                    <circle cx="300" cy="275" r="70" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4 3" />
                    <text x="450" y="278" fill="#FDE047" fontSize="8" fontFamily="monospace">
                      Thermal Wave: ~48m
                    </text>
                  </g>
                )}

                {/* WELLBORE CASING ARCHITECTURE (Centered at X = 300) */}
                {/* Surface Casing (13-3/8" OD) down to Y=90 */}
                <rect x="272" y="20" width="56" height="75" fill="none" stroke="#64748B" strokeWidth="3" />
                {/* Intermediate Production Casing (9-5/8" OD) down to Y=210 */}
                <rect x="280" y="20" width="40" height="190" fill="none" stroke="url(#casingSteel)" strokeWidth="3" />

                {/* Perforated Casing Liner (7" OD) in pay zone (Y=210 to Y=320) */}
                <rect x="282" y="210" width="36" height="110" fill="#0F172A" stroke="#F59E0B" strokeWidth="2.5" strokeDasharray="4 3" />
                {/* Perforation holes injecting steam or gathering oil */}
                {[225, 245, 265, 285, 305].map((py) => (
                  <g key={py}>
                    <line x1="262" y1={py} x2="282" y2={py} stroke={isInjector ? '#38BDF8' : '#F59E0B'} strokeWidth="3" />
                    <line x1="318" y1={py} x2="338" y2={py} stroke={isInjector ? '#38BDF8' : '#F59E0B'} strokeWidth="3" />
                    <circle cx="260" cy={py} r="2.5" fill={isInjector ? '#38BDF8' : '#F59E0B'} />
                    <circle cx="340" cy={py} r="2.5" fill={isInjector ? '#38BDF8' : '#F59E0B'} />
                  </g>
                ))}

                {/* THERMAL PACKER (Seals tubing to casing at top of reservoir Y=200) */}
                <rect x="280" y="195" width="40" height="15" fill="#D97706" stroke="#F59E0B" strokeWidth="1.5" rx="2" />
                <text x="300" y="206" fill="#0F172A" fontSize="7" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  THERMAL PACKER
                </text>

                {/* INSULATED TUBING STRING (Inner 3-1/2" pipe) */}
                <rect x="292" y="10" width="16" height="260" fill="#1E293B" stroke={isInjector ? '#38BDF8' : '#F59E0B'} strokeWidth="2" />

                {/* DYNAMIC FLUID FLOW PARTICLES INSIDE TUBING */}
                {[30, 70, 110, 150, 190, 230, 270].map((fy, idx) => {
                  const animatedY = (fy + (isInjector ? pulse * 2 : -pulse * 2)) % 260 + 10;
                  return (
                    <circle
                      key={idx}
                      cx="300"
                      cy={animatedY}
                      r="3"
                      fill={isInjector ? '#38BDF8' : '#F59E0B'}
                      opacity="0.9"
                    />
                  );
                })}

                {/* Depth Milestones */}
                <text x="560" y="35" fill="#64748B" fontSize="8" fontFamily="monospace" textAnchor="end">0m (Surface)</text>
                <text x="560" y="105" fill="#64748B" fontSize="8" fontFamily="monospace" textAnchor="end">320m MD</text>
                <text x="560" y="215" fill="#64748B" fontSize="8" fontFamily="monospace" textAnchor="end">920m MD</text>
                <text x="560" y="325" fill="#64748B" fontSize="8" fontFamily="monospace" textAnchor="end">1,200m MD (TD)</text>
              </svg>
            </div>

            {/* Right Subsurface Information & Strata Panel */}
            <div className="w-full md:w-2/5 space-y-3 font-mono text-xs">
              <div className="petro-card p-4 border-slate-800 bg-slate-900/90 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    SUBSURFACE INTEGRITY AUDIT
                  </span>
                  <StatusBadge status="SAFE" size="sm" />
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Wellhead Injection P:</span>
                    <span className="text-white font-bold">{pressure.toFixed(1)} bar</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Bottomhole Sandface T:</span>
                    <span className="text-rose-400 font-bold">{temperature.toFixed(1)} °C</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Caprock Fracture Ceiling:</span>
                    <span className="text-cyan-300 font-bold">94.0 bar</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Fracture Safety Buffer:</span>
                    <span className="text-emerald-400 font-bold">+{(94.0 - pressure).toFixed(1)} bar (SAFE)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Thermal Packer Status:</span>
                    <span className="text-emerald-400 font-bold">SEALED (960m MD)</span>
                  </div>
                </div>

                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300 leading-relaxed">
                  <strong className="text-cyan-400">Geomechanical Envelope:</strong> The Colorado Shale seal exhibits zero micro-fracturing. Injected thermal volume is effectively isolated within the target Clearwater sand interval.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: SURFACE CHRISTMAS TREE & WELLHEAD MANIFOLD */}
        {activeTab === 'surface' && (
          <div className="w-full h-full flex flex-col md:flex-row items-center justify-between p-6 gap-6">
            <div className="relative w-full md:w-3/5 h-full flex items-center justify-center">
              <svg viewBox="0 0 500 320" className="w-full h-full max-h-[300px] select-none">
                {/* Surface Ground Base */}
                <rect x="0" y="270" width="500" height="50" fill="#1E293B" opacity="0.8" />
                <line x1="0" y1="270" x2="500" y2="270" stroke="#334155" strokeWidth="2" />

                {/* Well Cellar & Conductor Flange */}
                <rect x="210" y="250" width="80" height="20" fill="#0F172A" stroke="#475569" strokeWidth="2" rx="2" />
                <circle cx="250" cy="260" r="4" fill="#64748B" />

                {/* Lower Master Gate Valve */}
                <rect x="225" y="210" width="50" height="40" fill="#0E7490" stroke="#06B6D4" strokeWidth="2" rx="3" />
                <ellipse cx="205" cy="230" rx="4" ry="12" fill="#0F172A" stroke="#F59E0B" strokeWidth="2" />
                <line x1="205" y1="230" x2="225" y2="230" stroke="#F59E0B" strokeWidth="2" />
                <text x="250" y="234" fill="#FFFFFF" fontSize="8" fontFamily="monospace" textAnchor="middle">
                  L-MASTER
                </text>

                {/* Upper Master Gate Valve */}
                <rect x="225" y="160" width="50" height="40" fill="#0E7490" stroke="#06B6D4" strokeWidth="2" rx="3" />
                <ellipse cx="205" cy="180" rx="4" ry="12" fill="#0F172A" stroke="#F59E0B" strokeWidth="2" />
                <line x1="205" y1="180" x2="225" y2="180" stroke="#F59E0B" strokeWidth="2" />
                <text x="250" y="184" fill="#FFFFFF" fontSize="8" fontFamily="monospace" textAnchor="middle">
                  U-MASTER
                </text>

                {/* Flow Cross / Flow Tee at Center */}
                <rect x="220" y="115" width="60" height="35" fill="#155E75" stroke="#22D3EE" strokeWidth="2" rx="4" />

                {/* Top Swab Valve */}
                <rect x="232" y="65" width="36" height="40" fill="#0E7490" stroke="#06B6D4" strokeWidth="2" rx="2" />
                <rect x="238" y="45" width="24" height="15" fill="#64748B" stroke="#94A3B8" strokeWidth="1.5" rx="2" />
                <text x="250" y="88" fill="#FFFFFF" fontSize="7" fontFamily="monospace" textAnchor="middle">
                  SWAB
                </text>

                {/* Pressure Gauge at Tree Top */}
                <circle cx="250" cy="25" r="14" fill="#0B1320" stroke="#38BDF8" strokeWidth="2" />
                <line x1="250" y1="25" x2="258" y2="20" stroke="#22C55E" strokeWidth="2" />
                <text x="250" y="45" fill="#38BDF8" fontSize="8" fontFamily="monospace" textAnchor="middle">
                  {pressure.toFixed(1)} bar
                </text>

                {/* Wing Valve on Right Flowline */}
                <path d="M 280 132 L 360 132 L 360 270" fill="none" stroke="#0284C7" strokeWidth="12" strokeLinejoin="round" />
                <path d="M 280 132 L 360 132 L 360 270" fill="none" stroke="#38BDF8" strokeWidth="4" strokeDasharray="6 4" strokeLinejoin="round" className="animate-pulse" />

                <rect x="305" y="117" width="30" height="30" fill="#0E7490" stroke="#F59E0B" strokeWidth="2" rx="2" />
                <ellipse cx="320" cy="100" rx="10" ry="4" fill="#0F172A" stroke="#F59E0B" strokeWidth="2" />
                <line x1="320" y1="100" x2="320" y2="117" stroke="#F59E0B" strokeWidth="2" />
                <text x="320" y="135" fill="#FFFFFF" fontSize="7" fontFamily="monospace" textAnchor="middle">
                  WING
                </text>

                {/* Adjustable Choke Valve */}
                <rect x="345" y="170" width="30" height="26" fill="#D97706" stroke="#F59E0B" strokeWidth="1.5" rx="2" />
                <text x="390" y="185" fill="#F59E0B" fontSize="8" fontFamily="monospace">
                  CHOKE: 65% OPEN
                </text>

                {/* Annulus A Pressure Gauge */}
                <circle cx="150" cy="240" r="10" fill="#0B1320" stroke="#94A3B8" strokeWidth="1.5" />
                <line x1="150" y1="240" x2="210" y2="240" stroke="#64748B" strokeWidth="2" />
                <text x="150" y="260" fill="#94A3B8" fontSize="8" fontFamily="monospace" textAnchor="middle">
                  ANNULUS A: 2.1b
                </text>
              </svg>
            </div>

            {/* Right Surface Spec Panel */}
            <div className="w-full md:w-2/5 space-y-3 font-mono text-xs">
              <div className="petro-card p-4 border-slate-800 bg-slate-900/90 rounded-xl space-y-2.5">
                <span className="font-bold text-white uppercase text-xs flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  CHRISTMAS TREE VALVE MANIFOLD
                </span>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Tree Rating:</span>
                    <span className="text-white font-bold">API 6A 5,000 PSI</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Wing Valve Actuator:</span>
                    <span className="text-emerald-400 font-bold">PNEUMATIC (OPEN)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Annulus B (Intermediate):</span>
                    <span className="text-cyan-300 font-bold">0.4 bar (Zero Gas)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Emergency Shutdown (ESD):</span>
                    <span className="text-emerald-400 font-bold">ARMED & HEALTHY</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: PRESSURE & THERMAL DEPTH LOG */}
        {activeTab === 'log' && (
          <div className="w-full h-full flex flex-col md:flex-row items-center justify-between p-6 gap-6">
            <div className="relative w-full md:w-3/5 h-full flex items-center justify-center">
              <svg viewBox="0 0 450 280" className="w-full h-full max-h-[280px] select-none">
                <rect x="50" y="20" width="370" height="230" fill="#0A1626" stroke="#1E293B" strokeWidth="2" rx="4" />
                {/* Horizontal Depth Gridlines */}
                {[60, 110, 160, 210].map((gy, i) => (
                  <g key={gy}>
                    <line x1="50" y1={gy} x2="420" y2={gy} stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
                    <text x="45" y={gy + 3} fill="#64748B" fontSize="8" fontFamily="monospace" textAnchor="end">
                      {i === 0 ? '300m' : i === 1 ? '600m' : i === 2 ? '900m' : '1,200m'}
                    </text>
                  </g>
                ))}

                {/* Vertical Pressure/Temp Gridlines */}
                {[120, 200, 280, 360].map((gx) => (
                  <line key={gx} x1={gx} y1="20" x2={gx} y2="250" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
                ))}

                {/* Fracture Ceiling Line (94 bar limit) */}
                <line x1="335" y1="20" x2="335" y2="250" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="4 4" />
                <text x="335" y="15" fill="#EF4444" fontSize="8" fontFamily="monospace" textAnchor="middle">
                  FRACTURE LIMIT (94 bar)
                </text>

                {/* Pressure Gradient Curve (Cyan) */}
                <path
                  d={`M ${80 + (pressure * 2.5)} 25 Q ${80 + (pressure * 2.3)} 120 ${80 + (pressure * 2.1)} 245`}
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="3"
                />

                {/* Temperature Gradient Curve (Rose) */}
                <path
                  d={`M ${60 + (temperature * 0.9)} 25 Q ${60 + (temperature * 0.85)} 120 ${60 + (temperature * 0.82)} 245`}
                  fill="none"
                  stroke="#F43F5E"
                  strokeWidth="2.5"
                  strokeDasharray="4 2"
                />

                <text x="235" y="270" fill="#38BDF8" fontSize="9" fontFamily="monospace" textAnchor="middle">
                  DEPTH LOG (m MD) vs PRESSURE (bar) & TEMPERATURE (°C)
                </text>
              </svg>
            </div>

            <div className="w-full md:w-2/5 space-y-3 font-mono text-xs">
              <div className="petro-card p-4 border-slate-800 bg-slate-900/90 rounded-xl space-y-2">
                <span className="font-bold text-white uppercase text-xs flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  THERMODYNAMIC GRADIENT METRICS
                </span>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Wellhead Pressure:</span>
                    <span className="text-cyan-300 font-bold">{pressure.toFixed(1)} bar</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Bottomhole Pressure:</span>
                    <span className="text-cyan-300 font-bold">{(pressure * 0.96).toFixed(1)} bar</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Steam Quality (X):</span>
                    <span className="text-emerald-400 font-bold">74% Dry Vapor</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Heat Loss to Formations:</span>
                    <span className="text-amber-300 font-bold">3.2% Conductive</span>
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
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="text-slate-300">
            {isInjector
              ? `Active Cyclic Steam Injection into Clearwater Formation (Cycle #4)`
              : `Active Heavy Crude Extraction via Downhole Sucker Rod String`}
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
