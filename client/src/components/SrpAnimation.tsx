import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  Activity,
  AlertTriangle,
  Layers,
  Zap,
  Gauge,
  Sliders,
  Maximize2,
  RefreshCw,
  Info
} from 'lucide-react';

export interface SrpAnimationProps {
  strokeRate?: number;
  vibration?: number;
  motorTemp?: number;
  status?: string;
  isWarning?: boolean;
}

export const SrpAnimation: React.FC<SrpAnimationProps> = ({
  strokeRate = 7.2,
  vibration = 2.1,
  motorTemp = 62,
  status = 'NORMAL',
  isWarning = false,
}) => {
  // View mode: 'surface' = 2D kinematic pumpjack, 'subsurface' = downhole pump barrel, 'dynagraph' = dynamometer card
  const [activeTab, setActiveTab] = useState<'surface' | 'subsurface' | 'dynagraph'>('surface');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showStressAura, setShowStressAura] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);

  // Linkage geometry constants (Pixel coordinates in viewBox 0 0 900 420)
  const P0 = { x: 400, y: 155 };       // Samson post saddle bearing center
  const Lrear = 190;                   // Distance from saddle bearing to tail equalizer pin
  const Lfront = 220;                  // Distance from saddle bearing to horsehead front arc
  const Xwell = P0.x - Lfront;          // Wellbore centerline = 180
  const Xc = 645, Yc = 265;            // Crankshaft center on gearbox
  const R = 44;                        // Crank arm radius
  const Lpitman = 155;                 // Fixed rigid Pitman arm length

  // Continuous crank rotation state (in radians)
  const [theta, setTheta] = useState<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const animFrameRef = useRef<number | null>(null);

  // Dynagraph trail points (storing last 60 normalized [x, y] coordinates)
  const [dynoTrail, setDynoTrail] = useState<Array<{ pos: number; load: number }>>([]);

  // Animation frame loop
  useEffect(() => {
    const loop = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (isPlaying) {
        // Effective SPM with manual multiplier
        const effectiveSpm = Math.max(1.0, strokeRate * speedMultiplier);
        const omega = (2 * Math.PI * effectiveSpm) / 60; // rad/s
        setTheta((prev) => (prev + omega * dt) % (2 * Math.PI));
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, strokeRate, speedMultiplier]);

  // Exact 4-bar linkage kinematics calculation
  const kinematics = useMemo(() => {
    // 1. Crank pin location
    const pinX = Xc + R * Math.cos(theta);
    const pinY = Yc + R * Math.sin(theta);

    // 2. Distance from center saddle bearing P0 to crank pin
    const dx = pinX - P0.x;
    const dy = pinY - P0.y;
    const d = Math.hypot(dx, dy);

    // Circle-circle intersection to find tail pin (upper intersection)
    const a = (Lrear * Lrear - Lpitman * Lpitman + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, Lrear * Lrear - a * a));
    const p2x = P0.x + (a * dx) / d;
    const p2y = P0.y + (a * dy) / d;

    // Normal vector (-dy/d, dx/d)
    const tailX = p2x - (h * (-dy)) / d;
    const tailY = p2y - (h * dx) / d;

    // 3. Beam rocking angle (in radians & degrees)
    const beamAngle = Math.atan2(-(tailY - P0.y), tailX - P0.x);
    const beamDeg = (beamAngle * 180) / Math.PI;

    // 4. Front horsehead attachment tip
    const frontX = P0.x - (Lfront / Lrear) * (tailX - P0.x);
    const frontY = P0.y - (Lfront / Lrear) * (tailY - P0.y);

    // 5. Horsehead curved front & carrier bar
    // Carrier bar travels strictly vertically along Xwell = 180
    // As front goes up (frontY decreases), carrier bar rises.
    const carrierY = frontY + 70;
    const strokeMinY = 188;
    const strokeMaxY = 282;
    const strokePercent = Math.max(0, Math.min(100, ((carrierY - strokeMinY) / (strokeMaxY - strokeMinY)) * 100));

    // Direction: isUpstroke when carrierY is moving UP (front tip rising)
    // Front rises when crank pin is on back stroke (sin(theta) > 0 or < 0 depending on rotation)
    const isUpstroke = Math.sin(theta) > 0;

    // 6. Dynamic Polished Rod Load (lbs)
    // Upstroke carries fluid column (~18,200 lbs), downstroke carries only buoyant rod weight (~9,400 lbs)
    const baseLoad = isUpstroke ? 17200 : 9400;
    const loadDynamic = baseLoad + Math.sin(theta) * 1600 + (isWarning ? 1200 : 0);
    const prlNormalized = Math.round(loadDynamic);

    // 7. Counterweight angle (offset on crank arm)
    const counterweightDeg = ((theta * 180) / Math.PI + 180) % 360;

    // 8. Gearbox motor torque (kN*m)
    const torqueKnm = Math.max(4.2, Math.abs(Math.sin(theta)) * 28.4 + (isWarning ? 6.5 : 0)).toFixed(1);

    return {
      pinX,
      pinY,
      tailX,
      tailY,
      frontX,
      frontY,
      beamAngle,
      beamDeg,
      carrierY,
      strokePercent,
      isUpstroke,
      prlNormalized,
      counterweightDeg,
      torqueKnm,
    };
  }, [theta, isWarning]);

  // Update dynagraph trail
  useEffect(() => {
    setDynoTrail((prev) => {
      const newPt = { pos: kinematics.strokePercent, load: kinematics.prlNormalized };
      const updated = [...prev, newPt];
      if (updated.length > 75) updated.shift();
      return updated;
    });
  }, [kinematics.strokePercent, kinematics.prlNormalized]);

  return (
    <div className="relative w-full bg-[#071322] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col">
      {/* TOP INDUSTRIAL TELEMETRY HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-gradient-to-r from-[#0B1E36] via-[#0D2442] to-[#08172A] border-b border-slate-800/80 z-20">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className={`w-3 h-3 rounded-full ${isWarning ? 'bg-amber-400' : 'bg-emerald-400'} animate-ping absolute`}></span>
            <span className={`w-3 h-3 rounded-full ${isWarning ? 'bg-amber-500' : 'bg-emerald-500'} relative`}></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-widest text-white uppercase">
                SRP-01 DYNAMIC BEAM DIGITAL TWIN
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                isWarning ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}>
                {isWarning ? 'MECH WARNING' : 'KINEMATICS NORMAL'}
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400">
              API SPEC 11E CLASS C BEAM PUMPING UNIT • REAL-TIME 4-BAR KINEMATIC SYNTHESIS
            </p>
          </div>
        </div>

        {/* Real-time Telemetry Readouts */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">RATE:</span>
            <span className="text-cyan-300 font-bold">{strokeRate} SPM</span>
          </div>

          <div className="px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 flex items-center gap-2">
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">LOAD:</span>
            <span className="text-white font-bold">{kinematics.prlNormalized.toLocaleString()} LBS</span>
          </div>

          <div className="px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 flex items-center gap-2">
            <Zap className={`w-3.5 h-3.5 ${vibration > 4.5 ? 'text-amber-400' : 'text-emerald-400'}`} />
            <span className="text-slate-400">VIB:</span>
            <span className={`font-bold ${vibration > 4.5 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {vibration} mm/s
            </span>
          </div>

          <div className="hidden sm:flex px-2.5 py-1 rounded bg-slate-900/80 border border-slate-800 items-center gap-2">
            <span className="text-slate-400">MOTOR:</span>
            <span className={`font-bold ${motorTemp > 75 ? 'text-rose-400' : 'text-slate-200'}`}>
              {motorTemp}°C
            </span>
          </div>
        </div>
      </div>

      {/* SUB-NAV VIEW SELECTOR & INTERACTIVE CONTROLS */}
      <div className="flex items-center justify-between px-5 py-2 bg-slate-950/60 border-b border-slate-800/60 z-10 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 uppercase text-[10px] tracking-wider">VIEWPORT:</span>
          <button
            onClick={() => setActiveTab('surface')}
            className={`px-3 py-1 rounded-md transition-all font-semibold ${
              activeTab === 'surface'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Mechanical Kinematics
          </button>
          <button
            onClick={() => setActiveTab('subsurface')}
            className={`px-3 py-1 rounded-md transition-all font-semibold ${
              activeTab === 'subsurface'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Downhole Barrel Cutaway
          </button>
          <button
            onClick={() => setActiveTab('dynagraph')}
            className={`px-3 py-1 rounded-md transition-all font-semibold ${
              activeTab === 'dynagraph'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            Real-time Dynagraph
          </button>
        </div>

        {/* Animation Play/Pause & Speed Multiplier */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-md px-2 py-0.5">
            <span className="text-[10px] text-slate-500">SPEED:</span>
            {[0.5, 1.0, 1.5].map((spd) => (
              <button
                key={spd}
                onClick={() => setSpeedMultiplier(spd)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  speedMultiplier === spd ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowStressAura(!showStressAura)}
            className={`px-2 py-1 rounded border text-[10px] font-mono transition-all flex items-center gap-1 ${
              showStressAura
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
            title="Toggle mechanical stress & thermal heatmap aura"
          >
            <Activity className="w-3 h-3" />
            STRESS AURA
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-1.5 rounded-md border flex items-center justify-center transition-all ${
              isPlaying
                ? 'bg-slate-800 text-cyan-400 border-slate-700 hover:bg-slate-700'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
            }`}
            title={isPlaying ? 'Pause Motion' : 'Play Motion'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* MAIN VIEWPORT CANVAS */}
      <div className="relative w-full h-[360px] sm:h-[420px] bg-gradient-to-b from-[#061527] via-[#05111F] to-[#030912] flex items-center justify-center overflow-hidden">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(#38BDF8 1px, transparent 1px), linear-gradient(to right, #0F2D54 1px, transparent 1px), linear-gradient(to bottom, #0F2D54 1px, transparent 1px)',
            backgroundSize: '32px 32px, 64px 64px, 64px 64px',
          }}
        />

        {/* VIEW 1: HIGH-PRECISION 2D SURFACE PUMPJACK KINEMATICS */}
        {activeTab === 'surface' && (
          <svg viewBox="0 0 900 420" className="w-full h-full select-none">
            <defs>
              {/* Gradients */}
              <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0B233D" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#040D18" stopOpacity="0.8" />
              </linearGradient>

              {/* Steel I-beam metallic gradient */}
              <linearGradient id="beamSteelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="25%" stopColor="#94A3B8" />
                <stop offset="70%" stopColor="#334155" />
                <stop offset="100%" stopColor="#1E293B" />
              </linearGradient>

              {/* Chrome Polished Rod mirror gradient */}
              <linearGradient id="chromeRodGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#94A3B8" />
                <stop offset="35%" stopColor="#FFFFFF" />
                <stop offset="70%" stopColor="#CBD5E1" />
                <stop offset="100%" stopColor="#64748B" />
              </linearGradient>

              {/* Heavy Cast Iron Counterweights gradient */}
              <linearGradient id="counterweightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="40%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#78350F" />
              </linearGradient>

              {/* Gearbox housing cast metal */}
              <linearGradient id="gearboxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E293B" />
                <stop offset="50%" stopColor="#0F172A" />
                <stop offset="100%" stopColor="#090D16" />
              </linearGradient>

              {/* Concrete Pad texture */}
              <linearGradient id="concreteGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="15%" stopColor="#1E293B" />
                <stop offset="100%" stopColor="#0B1320" />
              </linearGradient>

              {/* Crude oil fluid pulse */}
              <linearGradient id="oilFlowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="50%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>

              {/* Thermal / Stress Glow Filter */}
              <filter id="stressGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* GROUND & CONCRETE FOUNDATION PAD */}
            <g id="foundation">
              {/* Soil / subterranean background */}
              <rect x="0" y="340" width="900" height="80" fill="url(#concreteGrad)" opacity="0.9" />
              <line x1="0" y1="340" x2="900" y2="340" stroke="#0EA5E9" strokeWidth="1.5" strokeOpacity="0.3" />

              {/* Chamfered Reinforced Concrete Base */}
              <polygon
                points="70,340 100,315 800,315 830,340"
                fill="#1E293B"
                stroke="#334155"
                strokeWidth="2"
              />
              <line x1="100" y1="315" x2="800" y2="315" stroke="#475569" strokeWidth="2.5" />

              {/* Anchor Bolt Plates with Hex Studs */}
              {[120, 240, 340, 460, 590, 720, 770].map((boltX, i) => (
                <g key={i}>
                  <rect x={boltX - 8} y="311" width="16" height="5" fill="#64748B" rx="1" />
                  <circle cx={boltX} cy="313" r="2.5" fill="#E2E8F0" />
                  <line x1={boltX} y1="316" x2={boltX} y2="324" stroke="#475569" strokeWidth="2" />
                </g>
              ))}

              {/* Foundation Label */}
              <text x="820" y="333" fill="#64748B" fontSize="9" fontFamily="monospace" textAnchor="end">
                REINFORCED CONCRETE PAD • GRADE C35
              </text>
            </g>

            {/* SAMSON POST (A-FRAME TOWER WITH HEAVY STRUCTURAL TRUSS) */}
            <g id="samson-post">
              {/* Left & Right Main Legs */}
              <polygon
                points="335,315 390,155 410,155 465,315 445,315 403,175 397,175 355,315"
                fill="#1A283D"
                stroke="#38BDF8"
                strokeWidth="1.5"
                strokeOpacity="0.8"
              />

              {/* Horizontal structural cross-struts */}
              <line x1="365" y1="265" x2="435" y2="265" stroke="#334155" strokeWidth="4" />
              <line x1="365" y1="265" x2="435" y2="265" stroke="#38BDF8" strokeWidth="1" strokeOpacity="0.5" />

              <line x1="380" y1="210" x2="420" y2="210" stroke="#334155" strokeWidth="4" />
              <line x1="380" y1="210" x2="420" y2="210" stroke="#38BDF8" strokeWidth="1" strokeOpacity="0.5" />

              {/* Diagonal Cross-Lattice bracing */}
              <line x1="365" y1="265" x2="420" y2="210" stroke="#334155" strokeWidth="2.5" />
              <line x1="435" y1="265" x2="380" y2="210" stroke="#334155" strokeWidth="2.5" />
              <line x1="355" y1="315" x2="435" y2="265" stroke="#1E293B" strokeWidth="2" />
              <line x1="445" y1="315" x2="365" y2="265" stroke="#1E293B" strokeWidth="2" />

              {/* Access Ladder rungs on Samson post leg */}
              {[295, 275, 255, 235, 215, 195, 175].map((ry) => (
                <line key={ry} x1="337" y1={ry} x2="348" y2={ry} stroke="#475569" strokeWidth="2" />
              ))}
              <line x1="337" y1="170" x2="337" y2="315" stroke="#475569" strokeWidth="2" />
              <line x1="348" y1="170" x2="348" y2="315" stroke="#475569" strokeWidth="2" />

              {/* Center Saddle Bearing Housing at P0 (400, 155) */}
              <rect x="382" y="142" width="36" height="26" rx="4" fill="#0F172A" stroke="#0284C7" strokeWidth="2" />
              <circle cx={P0.x} cy={P0.y} r="8" fill="#38BDF8" stroke="#0369A1" strokeWidth="2.5" />
              <circle cx={P0.x} cy={P0.y} r="3" fill="#FFFFFF" />

              {/* Grease fitting cap */}
              <rect x="397" y="136" width="6" height="6" fill="#F59E0B" rx="1" />
            </g>

            {/* WELLHEAD ("CHRISTMAS TREE"), CASING & FLOW TEE AT Xwell = 180 */}
            <g id="wellhead">
              {/* Subsurface Casing Flange & Conductor Pipe */}
              <rect x={Xwell - 22} y="315" width="44" height="28" fill="#0F172A" stroke="#334155" strokeWidth="2" rx="2" />
              <rect x={Xwell - 16} y="340" width="32" height="40" fill="#090D16" stroke="#1E293B" strokeWidth="1.5" />

              {/* Master Gate Valve with handwheel */}
              <rect x={Xwell - 18} y="280" width="36" height="24" fill="#0E7490" stroke="#06B6D4" strokeWidth="2" rx="2" />
              {/* Valve Handwheel */}
              <ellipse cx={Xwell - 28} cy="292" rx="5" ry="11" fill="#0F172A" stroke="#F59E0B" strokeWidth="2" />
              <line x1={Xwell - 28} y1="292" x2={Xwell - 18} y2="292" stroke="#F59E0B" strokeWidth="2" />

              {/* Flow Tee Pipe branching to the right (Production Flowline) */}
              <path
                d={`M ${Xwell} 265 L ${Xwell + 60} 265 L ${Xwell + 60} 315 L ${Xwell + 110} 315`}
                fill="none"
                stroke="#0284C7"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d={`M ${Xwell} 265 L ${Xwell + 60} 265 L ${Xwell + 60} 315 L ${Xwell + 110} 315`}
                fill="none"
                stroke="#38BDF8"
                strokeWidth="4"
                strokeDasharray="8 6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-pulse"
              />

              {/* Wellhead Flowline Pressure Gauge */}
              <circle cx={Xwell + 40} cy="250" r="10" fill="#0F172A" stroke="#38BDF8" strokeWidth="2" />
              <line x1={Xwell + 40} y1="250" x2={Xwell + 46} y2="246" stroke="#22C55E" strokeWidth="2" />
              <text x={Xwell + 40} y="235" fill="#38BDF8" fontSize="8" fontFamily="monospace" textAnchor="middle">
                14.2 BAR
              </text>

              {/* Stuffing Box with Brass Gland Nut */}
              <rect x={Xwell - 14} y="238" width="28" height="28" fill="#155E75" stroke="#22D3EE" strokeWidth="2" rx="3" />
              <rect x={Xwell - 18} y="232" width="36" height="8" fill="#D97706" stroke="#F59E0B" strokeWidth="1.5" rx="2" />
              <text x={Xwell - 24} y="228" fill="#94A3B8" fontSize="8" fontFamily="monospace">
                STUFFING BOX
              </text>

              {/* POLISHED ROD (Reciprocating Chrome Steel Rod) */}
              {/* Passes from carrier bar at kinematics.carrierY down through stuffing box */}
              <rect
                x={Xwell - 4.5}
                y={kinematics.carrierY}
                width="9"
                height={Math.max(10, 310 - kinematics.carrierY)}
                fill="url(#chromeRodGrad)"
                stroke="#64748B"
                strokeWidth="1"
                rx="2"
              />
              {/* Highlight specular line on polished rod */}
              <line
                x1={Xwell - 1}
                y1={kinematics.carrierY}
                x2={Xwell - 1}
                y2={305}
                stroke="#FFFFFF"
                strokeWidth="2"
                opacity="0.85"
              />

              {/* CARRIER BAR (Clamps polished rod to bridle cables) */}
              <g transform={`translate(${Xwell}, ${kinematics.carrierY})`}>
                <rect x="-24" y="-7" width="48" height="14" rx="3" fill="#0F172A" stroke="#38BDF8" strokeWidth="2" />
                <circle cx="0" cy="0" r="4.5" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
                {/* Cable Thimbles on Carrier Bar */}
                <circle cx="-16" cy="-4" r="3" fill="#64748B" />
                <circle cx="16" cy="-4" r="3" fill="#64748B" />
                {/* Live Polished Rod Load readout pin badge */}
                <text x="32" y="4" fill="#38BDF8" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  {kinematics.prlNormalized.toLocaleString()} LBS
                </text>
              </g>
            </g>

            {/* GEARBOX, ELECTRIC MOTOR & ROTATING CRANK/COUNTERWEIGHTS */}
            <g id="drive-unit">
              {/* Gearbox Foundation Stand */}
              <rect x="585" y="275" width="125" height="40" fill="#0F172A" stroke="#334155" strokeWidth="2" rx="3" />
              {/* Main Ribbed Cast Gearbox Housing */}
              <rect x="605" y="215" width="85" height="75" fill="url(#gearboxGrad)" stroke="#475569" strokeWidth="2.5" rx="5" />
              {/* Reinforcing Cooling Ribs on Gearbox */}
              {[228, 244, 260, 276].map((gy) => (
                <line key={gy} x1="608" y1={gy} x2="687" y2={gy} stroke="#334155" strokeWidth="2" />
              ))}
              {/* Oil level inspection sight glass */}
              <circle cx="618" cy="270" r="4.5" fill="#F59E0B" stroke="#78350F" strokeWidth="1.5" />
              <text x="647" y="284" fill="#94A3B8" fontSize="8" fontFamily="monospace" textAnchor="middle">
                HEAVY DOUBLE REDUCTION
              </text>

              {/* Electric Motor (45 kW) behind gearbox */}
              <rect x="715" y="245" width="60" height="70" fill="#0F172A" stroke="#0284C7" strokeWidth="2" rx="4" />
              {/* Motor cooling fins */}
              {[255, 265, 275, 285, 295, 305].map((my) => (
                <line key={my} x1="718" y1={my} x2="772" y2={my} stroke="#1E293B" strokeWidth="2" />
              ))}
              {/* Motor Terminal Box */}
              <rect x="735" y="235" width="20" height="12" fill="#0284C7" rx="2" />
              <text x="745" y="325" fill="#38BDF8" fontSize="8" fontFamily="monospace" textAnchor="middle">
                45 kW MOTOR
              </text>

              {/* V-Belt Drive Guard connecting motor to gearbox */}
              <path
                d="M 685 260 L 720 260 L 720 310 L 685 310 Z"
                fill="#1E293B"
                stroke="#64748B"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />

              {/* Safety perimeter wire mesh handrail cage */}
              <path
                d="M 570 315 L 570 230 L 785 230 L 785 315"
                fill="none"
                stroke="#475569"
                strokeWidth="2"
                strokeDasharray="6 4"
                opacity="0.4"
              />

              {/* ROTATING CRANK ARM & HEAVY COUNTERWEIGHTS (Mounted at Xc=645, Yc=265) */}
              <g transform={`translate(${Xc}, ${Yc})`}>
                {/* Crank sweep orbit guide circle */}
                <circle cx="0" cy="0" r={R} fill="none" stroke="#38BDF8" strokeWidth="1" strokeDasharray="3 4" opacity="0.3" />

                {/* Rotating group driven by continuous angle theta */}
                <g transform={`rotate(${(theta * 180) / Math.PI})`}>
                  {/* Heavy Cast Steel Crank Arm */}
                  <rect x="-14" y="-12" width={R + 24} height="24" rx="10" fill="#1E293B" stroke="#475569" strokeWidth="2" />

                  {/* MASSIVE COUNTERWEIGHTS (API Class C Lead-Filled Counterbalance) */}
                  {/* Offset on crank arm to counterbalance upstroke rod string */}
                  <path
                    d={`M -20 -38 C -45 -35 -48 35 -20 38 L 8 28 C -5 20 -5 -20 8 -28 Z`}
                    fill="url(#counterweightGrad)"
                    stroke="#D97706"
                    strokeWidth="2"
                  />
                  <line x1="-30" y1="-22" x2="-30" y2="22" stroke="#78350F" strokeWidth="3" />
                  <circle cx="-25" cy="0" r="4" fill="#0F172A" />

                  {/* Crankshaft Center Hub Pin */}
                  <circle cx="0" cy="0" r="14" fill="#0F172A" stroke="#38BDF8" strokeWidth="2.5" />
                  <circle cx="0" cy="0" r="5" fill="#38BDF8" />

                  {/* Crank Pin (Wrist Pin at radius R) */}
                  <circle cx={R} cy="0" r="8" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
                  <circle cx={R} cy="0" r="3.5" fill="#FFFFFF" />

                  {/* Mechanical Stress Aura on Wrist Pin Bearing (pulsates when isWarning is active) */}
                  {showStressAura && isWarning && (
                    <circle
                      cx={R}
                      cy="0"
                      r="18"
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="3"
                      className="animate-ping"
                      opacity="0.8"
                    />
                  )}
                </g>
              </g>

              {/* Torque Factor Telemetry Badge */}
              <text x="645" y="360" fill="#38BDF8" fontSize="9" fontFamily="monospace" textAnchor="middle">
                TORQUE: {kinematics.torqueKnm} kN·m ({kinematics.counterweightDeg.toFixed(0)}°)
              </text>
            </g>

            {/* RIGID PITMAN ARMS (Connects Crank Pin to Tail Equalizer Pin) */}
            {/* Always 100% mathematically attached at both ends! */}
            <g id="pitman-arm">
              {/* Twin Pitman Arm Links */}
              <line
                x1={kinematics.pinX - 3}
                y1={kinematics.pinY}
                x2={kinematics.tailX - 3}
                y2={kinematics.tailY}
                stroke="#475569"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <line
                x1={kinematics.pinX}
                y1={kinematics.pinY}
                x2={kinematics.tailX}
                y2={kinematics.tailY}
                stroke="#64748B"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <line
                x1={kinematics.pinX}
                y1={kinematics.pinY}
                x2={kinematics.tailX}
                y2={kinematics.tailY}
                stroke="#38BDF8"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.7"
              />

              {/* Lower Wrist Pin Spherical Bearing Housing */}
              <circle cx={kinematics.pinX} cy={kinematics.pinY} r="10" fill="#0F172A" stroke="#F59E0B" strokeWidth="2.5" />
              <circle cx={kinematics.pinX} cy={kinematics.pinY} r="4" fill="#FFFFFF" />

              {/* Upper Tail Equalizer Pin Bearing */}
              <circle cx={kinematics.tailX} cy={kinematics.tailY} r="9" fill="#0F172A" stroke="#38BDF8" strokeWidth="2.5" />
              <circle cx={kinematics.tailX} cy={kinematics.tailY} r="3.5" fill="#38BDF8" />
            </g>

            {/* WALKING BEAM WITH HORSEHEAD (Pivots at P0: 400, 155) */}
            <g id="walking-beam">
              {/* The Walking Beam rotates rigidly by kinematics.beamDeg around P0 (400, 155) */}
              <g transform={`translate(${P0.x}, ${P0.y}) rotate(${kinematics.beamDeg})`}>
                {/* Structural Wide-Flange I-Beam Body */}
                {/* Web plate */}
                <polygon
                  points={`-${Lfront},-14 ${Lrear},-10 ${Lrear},10 -${Lfront},14`}
                  fill="url(#beamSteelGrad)"
                  stroke="#334155"
                  strokeWidth="2"
                />

                {/* Top and Bottom Flanges with 3D Depth */}
                <line x1={-Lfront} y1="-14" x2={Lrear} y2="-10" stroke="#94A3B8" strokeWidth="4.5" />
                <line x1={-Lfront} y1="14" x2={Lrear} y2="10" stroke="#1E293B" strokeWidth="4.5" />

                {/* Beam Stiffener Ribs */}
                {[-160, -110, -55, 60, 120].map((stiffX) => (
                  <line key={stiffX} x1={stiffX} y1="-12" x2={stiffX} y2="12" stroke="#64748B" strokeWidth="3" />
                ))}

                {/* PetroNexus 360 Heavy Beam Branding */}
                <text
                  x="-20"
                  y="4"
                  fill="#38BDF8"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  letterSpacing="2"
                  textAnchor="middle"
                >
                  PETRONEXUS HD-320
                </text>

                {/* Saddle Center Clamping Housing */}
                <rect x="-24" y="-18" width="48" height="36" fill="#0F172A" stroke="#0284C7" strokeWidth="2.5" rx="3" />
                <circle cx="0" cy="0" r="7" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.5" />

                {/* Rear Tail Pin Mount */}
                <circle cx={Lrear} cy="0" r="10" fill="#0F172A" stroke="#F59E0B" strokeWidth="2" />
                <circle cx={Lrear} cy="0" r="4" fill="#F59E0B" />

                {/* AUTHENTIC HORSEHEAD (Curved Front Fabricated Steel Head) */}
                {/* Radius of outer front arc is exactly Lfront = 220 from saddle bearing! */}
                <g transform={`translate(-${Lfront}, 0)`}>
                  {/* Horsehead sickle/scimitar curved body */}
                  <path
                    d="M 0,-70 C -45,-45 -55,10 0,65 L 45,35 C 10,10 10,-35 40,-45 Z"
                    fill="#152438"
                    stroke="#38BDF8"
                    strokeWidth="2.5"
                  />

                  {/* Circular Lightening Holes with Beveled Inner Rings */}
                  <circle cx="8" cy="-35" r="7.5" fill="#0A1626" stroke="#475569" strokeWidth="1.5" />
                  <circle cx="-5" cy="0" r="10" fill="#0A1626" stroke="#475569" strokeWidth="1.5" />
                  <circle cx="8" cy="35" r="8" fill="#0A1626" stroke="#475569" strokeWidth="1.5" />

                  {/* Front Curved Cable Guide Channel (Wireline Arc) */}
                  <path
                    d="M 0,-70 C -45,-45 -55,10 0,65"
                    fill="none"
                    stroke="#0284C7"
                    strokeWidth="7"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 0,-70 C -45,-45 -55,10 0,65"
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Top Bridle Cable Anchor Clamp */}
                  <circle cx="0" cy="-70" r="5" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
                </g>
              </g>
            </g>

            {/* DUAL BRAIDED STEEL WIRELINE BRIDLE CABLES */}
            {/* Run vertically down from horsehead front tangent point to carrier bar at Xwell = 180 */}
            <g id="bridle-cables">
              {/* Left Bridle Cable */}
              <line
                x1={Xwell - 12}
                y1={kinematics.frontY - 15}
                x2={Xwell - 12}
                y2={kinematics.carrierY}
                stroke="#94A3B8"
                strokeWidth="2.5"
                strokeDasharray="5 2"
              />
              {/* Right Bridle Cable */}
              <line
                x1={Xwell + 12}
                y1={kinematics.frontY - 15}
                x2={Xwell + 12}
                y2={kinematics.carrierY}
                stroke="#CBD5E1"
                strokeWidth="2.5"
                strokeDasharray="5 2"
              />
            </g>

            {/* MECHANICAL WARNING / VIBRATION STRESS CALLOUT BANNER */}
            {isWarning && showStressAura && (
              <g transform="translate(645, 175)">
                <rect x="-85" y="-18" width="170" height="34" rx="6" fill="#450A0A" stroke="#EF4444" strokeWidth="2" />
                <text x="0" y="3" fill="#FCA5A5" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  CRANKPIN VIB: {vibration} mm/s
                </text>
                <line x1="0" y1="16" x2="0" y2="35" stroke="#EF4444" strokeWidth="2" strokeDasharray="3 3" />
              </g>
            )}

            {/* LIVE STROKE DIRECTION & KINEMATICS HUD (TOP-LEFT OF CANVAS) */}
            <g transform="translate(30, 45)">
              <rect x="0" y="0" width="190" height="70" rx="8" fill="#0B1C30" stroke="#1F5EFF" strokeWidth="1.5" opacity="0.9" />
              <text x="12" y="20" fill="#94A3B8" fontSize="9" fontFamily="monospace">
                STROKE POSITION:
              </text>
              <text x="12" y="40" fill="#38BDF8" fontSize="16" fontFamily="monospace" fontWeight="bold">
                {kinematics.strokePercent.toFixed(1)}%
              </text>
              <text x="120" y="40" fill={kinematics.isUpstroke ? '#22C55E' : '#38BDF8'} fontSize="11" fontFamily="monospace" fontWeight="bold">
                {kinematics.isUpstroke ? '▲ UPSTROKE' : '▼ DOWNSTROKE'}
              </text>

              {/* Progress bar */}
              <rect x="12" y="50" width="166" height="6" rx="3" fill="#1E293B" />
              <rect
                x="12"
                y="50"
                width={(166 * kinematics.strokePercent) / 100}
                height="6"
                rx="3"
                fill={kinematics.isUpstroke ? '#22C55E' : '#38BDF8'}
              />
            </g>
          </svg>
        )}

        {/* VIEW 2: DOWNHOLE PUMP BARREL CUTAWAY */}
        {activeTab === 'subsurface' && (
          <div className="w-full h-full flex flex-col md:flex-row items-center justify-between p-6 gap-6 overflow-hidden">
            {/* Left Subsurface Cross-Section Diagram */}
            <div className="relative w-full md:w-1/2 h-full flex items-center justify-center">
              <svg viewBox="0 0 360 380" className="w-full h-full max-h-[340px]">
                {/* Rock / Sandstone Reservoir Strata */}
                <rect x="0" y="0" width="360" height="380" fill="#171C26" />
                {/* Steam zone glow */}
                <circle cx="180" cy="300" r="140" fill="#EA580C" opacity="0.15" filter="blur(30px)" />

                {/* Perforated Heavy Casing */}
                <rect x="130" y="10" width="100" height="360" fill="#0F172A" stroke="#334155" strokeWidth="3" />

                {/* Perforations allowing hot steam-stimulated crude in */}
                {[260, 280, 300, 320, 340].map((py) => (
                  <g key={py}>
                    <line x1="120" y1={py} x2="132" y2={py} stroke="#F59E0B" strokeWidth="3" />
                    <line x1="228" y1={py} x2="240" y2={py} stroke="#F59E0B" strokeWidth="3" />
                    <circle cx="125" cy={py} r="2" fill="#F59E0B" />
                    <circle cx="235" cy={py} r="2" fill="#F59E0B" />
                  </g>
                ))}

                {/* Production Tubing */}
                <rect x="150" y="10" width="60" height="320" fill="#1E293B" stroke="#0284C7" strokeWidth="2" />

                {/* Pump Barrel at bottom */}
                <rect x="154" y="180" width="52" height="130" fill="#0F172A" stroke="#38BDF8" strokeWidth="2" />

                {/* Heavy Crude Oil Fluid Column */}
                <rect x="156" y="20" width="48" height="290" fill="#78350F" opacity="0.75" />

                {/* Reciprocating Sucker Rod String */}
                <rect
                  x="177"
                  y="10"
                  width="6"
                  height={190 + (kinematics.strokePercent * 0.4)}
                  fill="url(#chromeRodGrad)"
                  stroke="#E2E8F0"
                  strokeWidth="1"
                />

                {/* TRAVELING VALVE (Mounted on Plunger) */}
                <g transform={`translate(160, ${170 + kinematics.strokePercent * 0.4})`}>
                  {/* Plunger Body */}
                  <rect x="0" y="0" width="40" height="45" fill="#0E7490" stroke="#22D3EE" strokeWidth="2" rx="2" />
                  {/* Traveling Valve Ball: Closed on UPSTROKE (lifts oil), Open on DOWNSTROKE */}
                  <circle
                    cx="20"
                    cy={kinematics.isUpstroke ? '22' : '15'}
                    r="8"
                    fill={kinematics.isUpstroke ? '#EF4444' : '#22C55E'}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  <text x="20" y="38" fill="#E2E8F0" fontSize="7" fontFamily="monospace" textAnchor="middle">
                    {kinematics.isUpstroke ? 'CLOSED' : 'OPEN'}
                  </text>
                </g>

                {/* STANDING VALVE (At base of barrel) */}
                <g transform="translate(160, 290)">
                  <rect x="0" y="0" width="40" height="24" fill="#1E293B" stroke="#0284C7" strokeWidth="2" rx="2" />
                  {/* Standing Valve Ball: Open on UPSTROKE (draws fluid in), Closed on DOWNSTROKE */}
                  <circle
                    cx="20"
                    cy={kinematics.isUpstroke ? '9' : '16'}
                    r="7"
                    fill={kinematics.isUpstroke ? '#22C55E' : '#EF4444'}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                </g>

                <text x="180" y="335" fill="#38BDF8" fontSize="9" fontFamily="monospace" textAnchor="middle">
                  STANDING VALVE
                </text>
              </svg>
            </div>

            {/* Right Subsurface Explanatory Card */}
            <div className="w-full md:w-1/2 space-y-4">
              <div className="petro-card p-4 border-slate-800 bg-slate-900/90 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    SUBSURFACE VALVE ACTION DYNAMICS
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                    kinematics.isUpstroke ? 'bg-emerald-500/20 text-emerald-300' : 'bg-cyan-500/20 text-cyan-300'
                  }`}>
                    {kinematics.isUpstroke ? 'PHASE 1: UPSTROKE (PRODUCING)' : 'PHASE 2: DOWNSTROKE (RE-FILLING)'}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80">
                    <strong className="text-cyan-400 font-mono">Traveling Valve (Plunger):</strong>{' '}
                    {kinematics.isUpstroke
                      ? 'SEATED (CLOSED). Fluid column weight is transferred to the sucker rod string, lifting heavy oil to surface.'
                      : 'UNSEATED (OPEN). Plunger sinks through viscous heavy oil emulsion, allowing barrel to re-charge with fluid.'}
                  </div>

                  <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80">
                    <strong className="text-amber-400 font-mono">Standing Valve (Barrel Base):</strong>{' '}
                    {kinematics.isUpstroke
                      ? 'UNSEATED (OPEN). Low barrel pressure draws hot oil from the perforated formation into the chamber.'
                      : 'SEATED (CLOSED). High hydrostatic pressure closes ball, holding fluid column inside the production tubing.'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-2 border-t border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Subsurface Depth</span>
                    <div className="text-white font-bold">1,180 m MD</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Pump Fillage Efficiency</span>
                    <div className="text-emerald-400 font-bold">91.4%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: REAL-TIME DYNAMOMETER CARD (SURFACE & PUMP DYNAGRAPH) */}
        {activeTab === 'dynagraph' && (
          <div className="w-full h-full flex flex-col md:flex-row items-center justify-between p-6 gap-6">
            <div className="relative w-full md:w-3/5 h-full flex items-center justify-center">
              <svg viewBox="0 0 450 300" className="w-full h-full max-h-[300px]">
                {/* Card Background & Grid */}
                <rect x="40" y="20" width="380" height="240" fill="#0A1626" stroke="#1E293B" strokeWidth="2" rx="4" />

                {/* Grid Lines */}
                {[60, 100, 140, 180, 220].map((gy) => (
                  <line key={gy} x1="40" y1={gy} x2="420" y2={gy} stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
                ))}
                {[100, 160, 220, 280, 340, 400].map((gx) => (
                  <line key={gx} x1={gx} y1="20" x2={gx} y2="260" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
                ))}

                {/* Y-Axis (Load in lbs) Labels */}
                <text x="35" y="65" fill="#64748B" fontSize="9" fontFamily="monospace" textAnchor="end">20k</text>
                <text x="35" y="125" fill="#64748B" fontSize="9" fontFamily="monospace" textAnchor="end">15k</text>
                <text x="35" y="185" fill="#64748B" fontSize="9" fontFamily="monospace" textAnchor="end">10k</text>
                <text x="35" y="245" fill="#64748B" fontSize="9" fontFamily="monospace" textAnchor="end">5k</text>

                {/* X-Axis (Position in inches) Labels */}
                <text x="50" y="278" fill="#64748B" fontSize="9" fontFamily="monospace">0" (Bottom)</text>
                <text x="230" y="278" fill="#64748B" fontSize="9" fontFamily="monospace" textAnchor="middle">72" (Mid-Stroke)</text>
                <text x="410" y="278" fill="#64748B" fontSize="9" fontFamily="monospace" textAnchor="end">144" (Top)</text>

                {/* Ideal Dynagraph Card Reference Envelope */}
                <polygon
                  points="65,190 85,80 395,70 405,175 160,195 90,195"
                  fill="#0284C7"
                  fillOpacity="0.1"
                  stroke="#0284C7"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />

                {/* Live Dynagraph Path from dynoTrail */}
                {dynoTrail.length > 2 && (
                  <polyline
                    fill="none"
                    stroke="#38BDF8"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={dynoTrail
                      .map((pt) => {
                        // Map pos (0 to 100) to X (60 to 400)
                        const px = 60 + (pt.pos / 100) * 340;
                        // Map load (5000 to 22000) to Y (245 to 55)
                        const py = 245 - ((pt.load - 5000) / 17000) * 190;
                        return `${px.toFixed(1)},${py.toFixed(1)}`;
                      })
                      .join(' ')}
                  />
                )}

                {/* Current Operating Point Pin */}
                {dynoTrail.length > 0 && (() => {
                  const curr = dynoTrail[dynoTrail.length - 1];
                  const curX = 60 + (curr.pos / 100) * 340;
                  const curY = 245 - ((curr.load - 5000) / 17000) * 190;
                  return (
                    <g>
                      <circle cx={curX} cy={curY} r="7" fill="#F59E0B" className="animate-ping" opacity="0.75" />
                      <circle cx={curX} cy={curY} r="5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1.5" />
                    </g>
                  );
                })()}

                {/* Axis Titles */}
                <text x="230" y="15" fill="#38BDF8" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  POLISHED ROD LOAD vs STROKE DISPLACEMENT (DYNAGRAPH CARD)
                </text>
              </svg>
            </div>

            {/* Dynagraph Diagnostic Analysis Panel */}
            <div className="w-full md:w-2/5 space-y-3">
              <div className="petro-card p-4 border-slate-800 bg-slate-900/90 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    DYNAMOMETER CARD DIAGNOSIS
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                    FULL FILLAGE
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Peak Polished Rod Load (PPRL):</span>
                    <span className="text-white font-bold">18,650 LBS</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Min Polished Rod Load (MPRL):</span>
                    <span className="text-white font-bold">9,180 LBS</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Net Fluid Lift Stroke:</span>
                    <span className="text-cyan-300 font-bold">138.4 in</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Fluid Pound / Gas Interference:</span>
                    <span className="text-emerald-400 font-bold">NONE DETECTED</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <strong className="text-cyan-400">Analytical Twin:</strong> The card exhibits an ideal parallelogram with sharp load pickup at bottom-dead-center, verifying complete pump chamber fillage with hot steam-stimulated bitumen.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER DIAGNOSTIC & PROTOTYPE DISCLAIMER */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-5 py-3 bg-[#05111F] border-t border-slate-800/80 text-[11px] font-mono text-slate-400 z-10">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isWarning ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
          <span className="text-slate-300">
            {isWarning
              ? 'WARNING: Elevated crankpin vibration detected (> 4.5 mm/s) — inspect wrist-pin bearings'
              : 'Status: Dynamically balanced Class C unit. Zero mechanical phase slip.'}
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
