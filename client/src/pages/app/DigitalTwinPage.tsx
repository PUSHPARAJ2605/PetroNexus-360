import React, { useState, useEffect } from 'react';
import { useOutletContext, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Flame,
  Layers,
  Radio,
  TrendingUp,
  Activity,
  Cpu,
  CheckCircle2,
  Info,
  Maximize2,
  Eye,
  Sliders,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Play,
  RotateCcw,
  ArrowLeft,
  ChevronRight,
  Clock,
  Droplet,
  Gauge,
  Thermometer,
  Wind,
  Check,
  AlertTriangle,
  AlertOctagon,
  FlaskConical,
  Sparkles,
  Box
} from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
import { DisclaimerBanner } from '../../components/DisclaimerBanner';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import { DigitalTwin3D } from '../../components/DigitalTwin3D';

export const DigitalTwinPage: React.FC = () => {
  const { openAssetDrawer } = useOutletContext<{ openAssetDrawer: (tag: string) => void }>();
  const { liveState } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Selected asset for deep inspection
  const [selectedTag, setSelectedTag] = useState<string>('IW-01');

  // Simulation execution state
  const isSimActiveQuery = searchParams.get('simulation') === 'active';
  const stateSimulationResult = location.state?.simulationResult;
  const stateMetrics = location.state?.metrics;

  const [isSimulatedMode, setIsSimulatedMode] = useState<boolean>(
    Boolean(isSimActiveQuery || stateSimulationResult || location.state?.fromSimulator)
  );

  // View dimension: 3D dynamic WebGL model vs 2D schematic PFD
  const [viewDimension, setViewDimension] = useState<'3D' | '2D'>('3D');

  // Active timeline phase in simulation propagation
  const [activePhase, setActivePhase] = useState<number>(2); // 1 = Boiler, 2 = Injection, 3 = Soak, 4 = Production

  // Metrics (either passed from Simulator state or fallback defaults)
  const metrics = stateMetrics || {
    operationType: 'STEAM_INJECTION',
    wellTag: 'IW-02',
    title: 'CSS Cycle Injection Test (IW-02)',
    steamPressure: 105.0,
    steamTemperature: 320.0,
    steamFlowRate: 6.0,
    injectionDurationDays: 1,
    soakDurationDays: 5,
    ambientTemp: 99,
    windSpeed: 93,
  };

  const simSummary = stateSimulationResult?.output?.summary || {
    predictedReservoirTemp: 183.5,
    predictedReservoirPressure: 70.2,
    heatPenetrationIndex: 82.5,
    estimatedHeatLoss: 20.06,
    steamConsumption: 144,
    estimatedOilMobility: 4.8,
    expectedProduction: 166.3,
    energyRequirement: 742,
    pipelineStress: 148.2,
  };

  const simStatus = stateSimulationResult?.output?.status || (metrics.steamPressure > 94 ? 'UNSAFE' : 'SAFE');
  const simRiskScore = stateSimulationResult?.output?.riskScore ?? (metrics.steamPressure > 94 ? 82 : 18);
  const simReasons = stateSimulationResult?.output?.reasons || [];

  // Critical Danger Evaluation (Strictly active only when in Simulated Mode)
  const isSimulationUnsafe =
    simStatus === 'UNSAFE' ||
    simStatus === 'CRITICAL' ||
    simStatus === 'REJECTED' ||
    simRiskScore >= 50 ||
    metrics.steamPressure > 94;
  const isUnsafe = isSimulatedMode && isSimulationUnsafe;

  const isReview = isSimulatedMode && !isUnsafe && (simStatus === 'REVIEW' || simRiskScore >= 30);
  const targetWell = metrics.wellTag || 'IW-02';
  const isTargetIW01 = isSimulatedMode && targetWell === 'IW-01';
  const isTargetIW02 = isSimulatedMode && targetWell === 'IW-02';

  const pressureExceedance = Math.max(0, metrics.steamPressure - 94);

  const assets = liveState?.assets || {};

  const handleAssetClick = (tag: string) => {
    setSelectedTag(tag);
    openAssetDrawer(tag);
  };

  const handleResetSimulation = () => {
    setIsSimulatedMode(false);
    navigate('/app/digital-twin', { replace: true, state: {} });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">Field Digital Twin Topology</h1>
            <span
              className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold tracking-wider uppercase border ${
                isSimulatedMode
                  ? isUnsafe
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 animate-pulse'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                  : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
              }`}
            >
              {isSimulatedMode
                ? isUnsafe
                  ? '🚨 SIMULATED TWIN: CRITICAL DANGER DETECTED'
                  : '🧪 SIMULATED DIGITAL TWIN ACTIVE'
                : '⚡ LIVE PHYSICAL TELEMETRY'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            {isSimulatedMode
              ? isUnsafe
                ? 'CRITICAL DANGER: Simulation indicates hydraulic fracture breakdown and caprock containment breach. Physical application blocked.'
                : 'Simulated field response: Highlighting the systemic propagation of test parameters across all surface and downhole assets.'
              : 'Full-Spectrum Closed Loop: OTSG Generation → Surface Transit → Cyclic Injection → Reservoir Heat Front → SRP Artificial Lift → Gathering'}
          </p>
        </div>

        {/* View State Toggle & Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Dimension Mode Toggle (3D WebGL vs 2D Schematic) */}
          <div className="flex items-center bg-slate-900 border border-cyan-500/40 rounded-lg p-1 text-xs font-mono shadow-lg shadow-cyan-950/30">
            <button
              onClick={() => setViewDimension('3D')}
              className={`px-3 py-1.5 rounded-md transition-all font-bold flex items-center gap-1.5 ${
                viewDimension === '3D'
                  ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-200 border border-cyan-400/60 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>🎮 3D Dynamic Model</span>
            </button>
            <button
              onClick={() => setViewDimension('2D')}
              className={`px-3 py-1.5 rounded-md transition-all font-bold flex items-center gap-1.5 ${
                viewDimension === '2D'
                  ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-200 border border-cyan-400/60 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>📐 2D Schematic</span>
            </button>
          </div>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs font-mono">
            <button
              onClick={() => setIsSimulatedMode(false)}
              className={`px-3 py-1.5 rounded-md transition-all font-semibold flex items-center gap-1.5 ${
                !isSimulatedMode
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Live Baseline</span>
            </button>
            <button
              onClick={() => setIsSimulatedMode(true)}
              className={`px-3 py-1.5 rounded-md transition-all font-semibold flex items-center gap-1.5 ${
                isSimulatedMode
                  ? isUnsafe
                    ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-sm'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Simulated Twin</span>
            </button>
          </div>

          <button
            onClick={() => navigate('/app/simulator')}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition-all"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Modify in Simulator</span>
          </button>
        </div>
      </div>

      {/* CONDITIONAL TOP BANNER: SIMULATED COCKPIT vs LIVE BASELINE MONITORING */}
      {isSimulatedMode ? (
        <div
          className={`petro-card p-5 rounded-2xl shadow-xl space-y-4 border-2 transition-all ${
            isUnsafe
              ? 'border-rose-500/80 bg-gradient-to-r from-rose-950/40 via-slate-900/95 to-rose-950/30 shadow-2xl shadow-rose-900/40'
              : 'border-amber-500/40 bg-gradient-to-r from-amber-950/20 via-slate-900/90 to-cyan-950/20'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl border ${
                  isUnsafe
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-400 animate-bounce'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}
              >
                {isUnsafe ? <AlertOctagon className="w-6 h-6" /> : <Flame className="w-6 h-6 animate-pulse" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-mono font-bold uppercase tracking-wider ${
                      isUnsafe ? 'text-rose-400 animate-pulse' : 'text-amber-400'
                    }`}
                  >
                    {isUnsafe ? '⚠️ UNSAFE SIMULATED SCENARIO DETECTED' : 'SIMULATED OPERATION SCENARIO'}
                  </span>
                  <StatusBadge status={isUnsafe ? 'UNSAFE' : simStatus} size="sm" />
                </div>
                <h2 className="text-base font-bold text-white font-mono">
                  {metrics.title || `CSS Cycle Injection Test (${targetWell})`}
                </h2>
              </div>
            </div>

            {/* Risk Score */}
            <div className="flex items-center gap-3">

              <div
                className={`px-3.5 py-1.5 rounded-xl border text-right font-mono ${
                  isUnsafe
                    ? 'bg-rose-950/80 border-rose-500/70 shadow-lg shadow-rose-900/40'
                    : 'bg-slate-900/90 border-slate-800'
                }`}
              >
                <span className={`text-[10px] uppercase ${isUnsafe ? 'text-rose-300 font-bold' : 'text-slate-400'}`}>
                  Risk Score
                </span>
                <div className={`text-base font-extrabold ${isUnsafe ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                  {simRiskScore} <span className="text-xs text-slate-500">/ 100</span>
                </div>
              </div>
            </div>
          </div>

          {/* DANGER ALERT CALLOUT (If scenario is unsafe) */}
          {isUnsafe && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/80 text-xs font-mono text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-rose-950/50">
              <div className="flex items-start sm:items-center gap-3">
                <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 sm:mt-0 animate-bounce" />
                <div>
                  <div className="font-bold text-rose-300 tracking-wide uppercase flex items-center gap-2">
                    <span>🚨 CRITICAL HAZARD INTERCEPT: FIELD EXECUTION REJECTED</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500 text-black font-extrabold">
                      BLOCKED
                    </span>
                  </div>
                  <div className="text-[11px] text-rose-300/90 mt-0.5">
                    {pressureExceedance > 0
                      ? `Injected steam pressure (${metrics.steamPressure} bar) exceeds reservoir hydraulic breakdown ceiling (94 bar) by +${pressureExceedance.toFixed(1)} bar! High risk of caprock shear, formation fracturing, and steam blowout!`
                      : `Parameters violate thermal, pressure, or ASME B31.3 structural stress containment limits.`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => navigate('/app/simulator')}
                className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-black font-bold text-xs font-mono shrink-0 transition-all shadow-md"
              >
                Return to Simulator
              </button>
            </div>
          )}

          {/* Applied Metrics Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs font-mono">
            {/* Steam Pressure Chip */}
            <div
              className={`p-2.5 rounded-lg border ${
                metrics.steamPressure > 94
                  ? 'bg-rose-950/60 border-rose-500/80 text-rose-200'
                  : 'bg-slate-950/70 border-slate-800'
              }`}
            >
              <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                <Gauge className={`w-3 h-3 ${metrics.steamPressure > 94 ? 'text-rose-400' : 'text-cyan-400'}`} />
                Steam Pressure
              </span>
              <div className={`font-bold mt-0.5 text-sm ${metrics.steamPressure > 94 ? 'text-rose-400 font-extrabold' : 'text-white'}`}>
                {metrics.steamPressure} bar
              </div>
              <div
                className={`text-[10px] font-bold ${
                  metrics.steamPressure > 94 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
                }`}
              >
                {metrics.steamPressure > 94
                  ? `⚠️ DANGER (+${pressureExceedance.toFixed(1)}b > 94b ceiling)`
                  : 'Safe (< 94 bar ceiling)'}
              </div>
            </div>

            {/* Steam Temp Chip */}
            <div
              className={`p-2.5 rounded-lg border ${
                metrics.steamTemperature > 300
                  ? 'bg-rose-950/50 border-rose-500/60 text-rose-200'
                  : 'bg-slate-950/70 border-slate-800'
              }`}
            >
              <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                <Thermometer className={`w-3 h-3 ${metrics.steamTemperature > 300 ? 'text-rose-400' : 'text-rose-400'}`} />
                Steam Temp
              </span>
              <div className={`font-bold mt-0.5 text-sm ${metrics.steamTemperature > 300 ? 'text-rose-400 font-extrabold' : 'text-white'}`}>
                {metrics.steamTemperature} °C
              </div>
              <div className={`text-[10px] ${metrics.steamTemperature > 300 ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                {metrics.steamTemperature > 300 ? '⚠️ High Thermal Stress' : 'Superheated Vapor'}
              </div>
            </div>

            {/* Mass Flow Rate */}
            <div
              className={`p-2.5 rounded-lg border ${
                metrics.steamFlowRate > 4.5
                  ? 'bg-amber-950/50 border-amber-500/60'
                  : 'bg-slate-950/70 border-slate-800'
              }`}
            >
              <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                <Droplet className={`w-3 h-3 ${metrics.steamFlowRate > 4.5 ? 'text-amber-400' : 'text-cyan-400'}`} />
                Mass Flow Rate
              </span>
              <div className="text-white font-bold mt-0.5 text-sm">{metrics.steamFlowRate} t/hr</div>
              <div className="text-[10px] text-cyan-300">Total: {simSummary.steamConsumption} t</div>
            </div>

            {/* Cycle Schedule */}
            <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                Cycle Schedule
              </span>
              <div className="text-white font-bold mt-0.5 text-sm">
                {metrics.injectionDurationDays}d Inj + {metrics.soakDurationDays}d Soak
              </div>
              <div className="text-[10px] text-slate-400">
                {metrics.injectionDurationDays + metrics.soakDurationDays} days cycle
              </div>
            </div>

            {/* Weather Coupled */}
            <div
              className={`p-2.5 rounded-lg border ${
                metrics.windSpeed > 50 || metrics.ambientTemp > 45
                  ? 'bg-rose-950/50 border-rose-500/60 text-rose-200'
                  : 'bg-slate-950/70 border-slate-800'
              }`}
            >
              <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                <Wind className={`w-3 h-3 ${metrics.windSpeed > 50 ? 'text-rose-400' : 'text-blue-400'}`} />
                Weather Coupled
              </span>
              <div className={`font-bold mt-0.5 text-sm ${metrics.windSpeed > 50 ? 'text-rose-300' : 'text-white'}`}>
                {metrics.ambientTemp}°C • {metrics.windSpeed} km/h
              </div>
              <div
                className={`text-[10px] font-bold ${
                  metrics.windSpeed > 50 ? 'text-rose-400' : 'text-amber-400'
                }`}
              >
                {metrics.windSpeed > 50
                  ? `⚠️ Extreme Gale (${simSummary.estimatedHeatLoss}% loss)`
                  : `Heat Loss: ${simSummary.estimatedHeatLoss}%`}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* LIVE BASELINE FIELD MONITORING BANNER */
        <div className="petro-card p-5 rounded-2xl shadow-xl space-y-4 border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-slate-900/90 to-blue-950/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl border bg-cyan-500/10 border-cyan-500/30 text-cyan-400">
                <Activity className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                    REAL-TIME SCADA TELEMETRY STREAM
                  </span>
                  <StatusBadge status="SAFE" size="sm" />
                </div>
                <h2 className="text-base font-bold text-white font-mono">
                  Continuous Physical Baseline Monitoring (Field-Wide Operations)
                </h2>
              </div>
            </div>

            {/* Field Health Indicator */}
            <div className="flex items-center gap-3">
              <div className="px-3.5 py-1.5 rounded-xl border bg-slate-900/90 border-slate-800 text-right font-mono">
                <span className="text-[10px] text-slate-400 uppercase">Field Health Index</span>
                <div className="text-base font-extrabold text-cyan-300">
                  {liveState?.fieldHealthScore || 89.6}% <span className="text-xs text-slate-500">Nominal</span>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Physical Operating Metrics Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded-lg border bg-slate-950/70 border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                <Gauge className="w-3 h-3 text-cyan-400" /> Steam Header
              </span>
              <div className="font-bold mt-0.5 text-sm text-white">
                {liveState?.keyMetrics?.steamPressureBar ? `${liveState.keyMetrics.steamPressureBar} bar` : '86.1 bar'}
              </div>
              <div className="text-[10px] text-cyan-300 font-semibold">OTSG Delivery Stable</div>
            </div>

            <div className="p-2.5 rounded-lg border bg-slate-950/70 border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                <Thermometer className="w-3 h-3 text-cyan-400" /> Steam Temperature
              </span>
              <div className="font-bold mt-0.5 text-sm text-white">
                {liveState?.keyMetrics?.steamTemperatureC ? `${liveState.keyMetrics.steamTemperatureC} °C` : '285.0 °C'}
              </div>
              <div className="text-[10px] text-slate-400">Superheated Vapor</div>
            </div>

            <div className="p-2.5 rounded-lg border bg-slate-950/70 border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                <Droplet className="w-3 h-3 text-amber-400" /> Field Oil Production
              </span>
              <div className="font-bold mt-0.5 text-sm text-white">
                {liveState?.keyMetrics?.oilProductionBpd ? `${liveState.keyMetrics.oilProductionBpd.toLocaleString()} BPD` : '4,820 BPD'}
              </div>
              <div className="text-[10px] text-emerald-400 font-semibold">+2.4% vs Daily Target</div>
            </div>

            <div className="p-2.5 rounded-lg border bg-slate-950/70 border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Geological Caprock
              </span>
              <div className="font-bold mt-0.5 text-sm text-emerald-400">100% Intact</div>
              <div className="text-[10px] text-slate-400">Seal Barrier Secure</div>
            </div>

            <div className="p-2.5 rounded-lg border bg-slate-950/70 border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                <Wind className="w-3 h-3 text-blue-400" /> Field Weather
              </span>
              <div className="font-bold mt-0.5 text-sm text-white">
                {liveState?.weather?.temperature || 34.4} °C • {liveState?.weather?.windSpeed || 21} km/h
              </div>
              <div className="text-[10px] text-cyan-300">Convective Loss: 4.8%</div>
            </div>
          </div>
        </div>
      )}

      {/* DIGITAL TWIN VISUALIZATION CANOPY (3D WEBGL MODEL vs 2D FLOW SCHEMATIC) */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            {viewDimension === '3D' ? <Box className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
          </span>
          <div>
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              {viewDimension === '3D' ? 'WebGL 3D Dynamic Digital Twin' : 'P&ID / Process Flow Schematic'}
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-normal">
                {viewDimension === '3D' ? '✨ Interactive 3D Real-time Mechanics' : '📐 CAD Process Topology'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              {viewDimension === '3D'
                ? 'Rotate (drag), Pan (right-click / 2-finger drag), Zoom (scroll). Click any 3D asset to inspect live telemetry.'
                : 'Click any node in the schematic to inspect live physical asset telemetry or fault isolation.'}
            </p>
          </div>
        </div>

        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs font-mono">
          <button
            onClick={() => setViewDimension('3D')}
            className={`px-3 py-1 rounded font-semibold flex items-center gap-1.5 transition-all ${
              viewDimension === '3D'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>3D Model</span>
          </button>
          <button
            onClick={() => setViewDimension('2D')}
            className={`px-3 py-1 rounded font-semibold flex items-center gap-1.5 transition-all ${
              viewDimension === '2D'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2D Schematic</span>
          </button>
        </div>
      </div>

      {viewDimension === '3D' ? (
        <DigitalTwin3D
          liveState={liveState}
          isSimulatedMode={isSimulatedMode}
          isUnsafe={isUnsafe}
          metrics={metrics}
          simSummary={simSummary}
          onAssetClick={handleAssetClick}
          selectedTag={selectedTag}
        />
      ) : (
        /* INTERACTIVE DIGITAL TWIN CANOPY / SVG FLOW TOPOLOGY */
        <div
          className={`relative petro-card p-4 sm:p-6 border overflow-hidden rounded-2xl shadow-2xl transition-all ${
            isSimulatedMode && isUnsafe
              ? 'border-rose-500/60 bg-gradient-to-b from-[#1A0A0E] via-[#0E060A] to-[#050205] shadow-rose-950/50'
              : 'border-slate-800 bg-gradient-to-b from-[#071A2B] via-[#08223B] to-[#051322]'
          }`}
        >
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#153354_1px,transparent_1px),linear-gradient(to_bottom,#153354_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25 pointer-events-none"></div>

        {/* TOPOLOGY HEADER HAZARD TICKER (When Unsafe) */}
        {isSimulatedMode && isUnsafe && (
          <div className="mb-3 px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-500/80 flex items-center justify-between text-xs font-mono text-rose-300 animate-pulse">
            <span className="flex items-center gap-2 font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              TOPOLOGY HAZARD: HYDRAULIC FRACTURE & OVERPRESSURE BREACH ON {targetWell}
            </span>
            <span className="text-[10px] bg-rose-500 text-black px-2 py-0.5 rounded font-extrabold uppercase">
              CAPROCK COMPROMISED (+{pressureExceedance.toFixed(1)} bar)
            </span>
          </div>
        )}

        {/* SVG Flow Topology */}
        <div className="relative w-full overflow-x-auto">
          <div className="min-w-[980px] py-4">
            <svg viewBox="0 0 1020 480" className="w-full h-auto drop-shadow-lg select-none">
              <defs>
                {/* Gradients */}
                <linearGradient id="steamPipeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06B6D4" />
                  <stop offset="100%" stopColor="#38BDF8" />
                </linearGradient>
                <linearGradient id="oilPipeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#D97706" />
                </linearGradient>
                <linearGradient id="boilerVesselGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1E3E62" />
                  <stop offset="40%" stopColor="#0E2B47" />
                  <stop offset="100%" stopColor="#071A2B" />
                </linearGradient>
                <linearGradient id="tankLiquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#D97706" />
                  <stop offset="60%" stopColor="#92400E" />
                  <stop offset="100%" stopColor="#451A03" />
                </linearGradient>
                <linearGradient id="caprockLayerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1E293B" />
                  <stop offset="50%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#1E293B" />
                </linearGradient>
                <linearGradient id="reservoirGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop
                    offset="0%"
                    stopColor={isSimulatedMode ? (isUnsafe ? '#450A0A' : '#78350F') : '#0F2942'}
                    stopOpacity="0.95"
                  />
                  <stop
                    offset="50%"
                    stopColor={isSimulatedMode ? (isUnsafe ? '#991B1B' : '#EA580C') : '#0D3859'}
                    stopOpacity="0.85"
                  />
                  <stop
                    offset="100%"
                    stopColor={isSimulatedMode ? (isUnsafe ? '#450A0A' : '#78350F') : '#0A1E33'}
                    stopOpacity="0.95"
                  />
                </linearGradient>

                {/* Danger glow filter */}
                <filter id="dangerGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="8" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* SIMULATED THERMAL / DANGER WAVE IN RESERVOIR ZONE */}
              {isSimulatedMode && (
                <g>
                  {isUnsafe ? (
                    <>
                      <ellipse
                        cx="550"
                        cy="245"
                        rx="95"
                        ry="85"
                        fill="#EF4444"
                        opacity="0.35"
                        filter="url(#dangerGlow)"
                        className="animate-pulse"
                      />
                      <circle
                        cx="550"
                        cy="245"
                        r="65"
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="2.5"
                        strokeDasharray="6 4"
                        className="animate-spin"
                        style={{ transformOrigin: '550px 245px', animationDuration: '8s' }}
                      />
                    </>
                  ) : (
                    <>
                      <ellipse
                        cx="550"
                        cy="245"
                        rx="80"
                        ry="70"
                        fill="#EA580C"
                        opacity="0.25"
                        filter="url(#dangerGlow)"
                        className="animate-pulse"
                      />
                      <circle cx="550" cy="245" r="48" fill="none" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4 3" />
                    </>
                  )}
                </g>
              )}

              {/* FLOW CONNECTING PIPELINES - EXPLICIT fill="none" TO PREVENT BLACK TRIANGLE ARTIFACTS */}
              {/* SG-01 to SP-01 & SP-02 Header */}
              <path
                d="M 125 140 L 210 140"
                fill="none"
                stroke={isSimulatedMode ? (isUnsafe ? '#EF4444' : '#38BDF8') : '#06B6D4'}
                strokeWidth={isSimulatedMode ? '5' : '4'}
                className="steam-flow-line"
              />

              {/* Branch to IW-01 (SP-01) */}
              <path
                d="M 210 140 L 210 90 L 325 90"
                fill="none"
                stroke={
                  isSimulatedMode && isTargetIW01
                    ? isUnsafe
                      ? '#EF4444'
                      : '#38BDF8'
                    : '#06B6D4'
                }
                strokeWidth={isSimulatedMode && isTargetIW01 ? '5' : '3.5'}
                className="steam-flow-line"
              />

              {/* Branch to IW-02 (SP-02 Line) */}
              <path
                d="M 210 140 L 210 190 L 325 190"
                fill="none"
                stroke={
                  isSimulatedMode && isTargetIW02
                    ? isUnsafe
                      ? '#EF4444'
                      : '#38BDF8'
                    : assets['SP-02']?.status === 'WARNING'
                    ? '#F43F5E'
                    : '#06B6D4'
                }
                strokeWidth={isSimulatedMode && isTargetIW02 ? '5' : '3.5'}
                strokeDasharray={isSimulatedMode && isTargetIW02 && isUnsafe ? '6 3' : 'none'}
                className="steam-flow-line"
              />

              {/* IW-01 to Reservoir Zone R-01 Downhole Injection */}
              <path
                d="M 390 90 L 440 90 L 440 220 L 485 220"
                fill="none"
                stroke={
                  isSimulatedMode && isTargetIW01
                    ? isUnsafe
                      ? '#EF4444'
                      : '#F59E0B'
                    : '#06B6D4'
                }
                strokeWidth={isSimulatedMode && isTargetIW01 ? '5' : '3'}
                className="steam-flow-line"
              />

              {/* IW-02 to Reservoir Downhole Injection */}
              <path
                d="M 390 190 L 440 190 L 440 250 L 485 250"
                fill="none"
                stroke={
                  isSimulatedMode && isTargetIW02
                    ? isUnsafe
                      ? '#EF4444'
                      : '#F59E0B'
                    : '#06B6D4'
                }
                strokeWidth={isSimulatedMode && isTargetIW02 ? '5' : '3'}
                strokeDasharray={isSimulatedMode && isTargetIW02 && isUnsafe ? '6 3' : 'none'}
                className="steam-flow-line"
              />

              {/* Production Drawdown from R-01 to PW-01 Wellhead */}
              <path
                d="M 625 240 L 665 240 L 665 140 L 695 140"
                fill="none"
                stroke="#F59E0B"
                strokeWidth={isSimulatedMode ? '5' : '3.5'}
                className="oil-flow-line"
              />

              {/* PW-01 to SRP-01 Lift Connection */}
              <path
                d="M 765 140 L 805 140"
                fill="none"
                stroke="#F59E0B"
                strokeWidth={isSimulatedMode ? '4.5' : '3'}
                className="oil-flow-line"
              />

              {/* SRP-01 to OP-01 Pipeline Trunk */}
              <path
                d="M 830 175 L 830 270 L 710 270 L 710 340"
                fill="none"
                stroke="#F59E0B"
                strokeWidth={isSimulatedMode ? '4.5' : '3'}
                className="oil-flow-line"
              />

              {/* OP-01 to Pump Station PS-01 */}
              <path
                d="M 670 370 L 525 370"
                fill="none"
                stroke="#F59E0B"
                strokeWidth={isSimulatedMode ? '5' : '3.5'}
                className="oil-flow-line"
              />

              {/* PS-01 Booster to Storage Tank ST-01 */}
              <path
                d="M 440 370 L 265 370"
                fill="none"
                stroke="#F59E0B"
                strokeWidth={isSimulatedMode ? '5' : '4'}
                className="oil-flow-line"
              />

              {/* ========================================================================= */}
              {/* 1. OTSG BOILER (SG-01) - 2D HORIZONTAL PRESSURE VESSEL & EXHAUST STACK   */}
              {/* ========================================================================= */}
              <g onClick={() => handleAssetClick('SG-01')} className="cursor-pointer group">
                {/* Structural Saddle Supports */}
                <rect x="38" y="160" width="14" height="14" rx="2" fill="#0E2338" stroke="#1E3E62" strokeWidth="1.5" />
                <rect x="88" y="160" width="14" height="14" rx="2" fill="#0E2338" stroke="#1E3E62" strokeWidth="1.5" />

                {/* Vertical Exhaust Chimney Stack */}
                <rect x="42" y="70" width="16" height="42" rx="2" fill="#0B2035" stroke="#0284C7" strokeWidth="1.5" />
                <ellipse cx="50" cy="70" rx="8" ry="3" fill="#1E3E62" stroke="#38BDF8" strokeWidth="1" />
                {/* Thermal exhaust vapor ring */}
                <path d="M 46 62 Q 50 56 54 62" fill="none" stroke="#38BDF8" strokeWidth="1.5" opacity="0.6" className="animate-pulse" />

                {/* Horizontal Boiler Pressure Vessel Body */}
                <rect
                  x="25"
                  y="110"
                  width="95"
                  height="52"
                  rx="16"
                  fill="url(#boilerVesselGrad)"
                  stroke={
                    isSimulatedMode
                      ? isUnsafe
                        ? '#F43F5E'
                        : '#38BDF8'
                      : selectedTag === 'SG-01'
                      ? '#06B6D4'
                      : '#0284C7'
                  }
                  strokeWidth={isSimulatedMode ? '2.5' : '2'}
                  className="transition-all group-hover:brightness-125"
                />

                {/* Vessel Weld Seams & Insulation Ribs */}
                <line x1="55" y1="111" x2="55" y2="161" stroke="#153654" strokeWidth="1.5" strokeDasharray="3 2" />
                <line x1="88" y1="111" x2="88" y2="161" stroke="#153654" strokeWidth="1.5" strokeDasharray="3 2" />

                {/* Top High-Pressure Steam Dome */}
                <rect x="84" y="98" width="18" height="13" rx="3" fill="#0E2A47" stroke="#06B6D4" strokeWidth="1.5" />
                <ellipse cx="93" cy="98" rx="9" ry="3" fill="#0284C7" stroke="#38BDF8" strokeWidth="1" />

                {/* Burner Flame Inspection Window */}
                <circle cx="38" cy="136" r="7" fill="#F59E0B" fillOpacity="0.85" stroke="#EA580C" strokeWidth="1.5" className="animate-pulse" />
                <circle cx="38" cy="136" r="3" fill="#FEF08A" />

                {/* Vessel Labeling */}
                <text x="75" y="132" fill="#FFFFFF" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  SG-01
                </text>
                <text x="75" y="146" fill="#38BDF8" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  OTSG BOILER
                </text>
                <text
                  x="75"
                  y="157"
                  fill={isSimulatedMode ? (isUnsafe ? '#FDA4AF' : '#38BDF8') : '#94A3B8'}
                  fontSize="7.5"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {isSimulatedMode ? `${metrics.steamFlowRate} t/h • ${metrics.steamPressure}b` : '88.0 bar • 289°C'}
                </text>
              </g>

              {/* ========================================================================= */}
              {/* 2. STEAM PIPELINE (SP-01) - 2D INSULATED PIPE, VALVES & PRESSURE GAUGE    */}
              {/* ========================================================================= */}
              <g onClick={() => handleAssetClick('SP-01')} className="cursor-pointer group">
                {/* Insulated Pipe Body */}
                <rect
                  x="225"
                  y="76"
                  width="75"
                  height="26"
                  rx="4"
                  fill="#0B2239"
                  stroke={selectedTag === 'SP-01' ? '#06B6D4' : '#0284C7'}
                  strokeWidth="1.8"
                  className="group-hover:brightness-125"
                />
                {/* Raised-Face Flanges */}
                <rect x="222" y="72" width="5" height="34" rx="1" fill="#153B63" stroke="#06B6D4" strokeWidth="1" />
                <rect x="298" y="72" width="5" height="34" rx="1" fill="#153B63" stroke="#06B6D4" strokeWidth="1" />

                {/* Inline In-Pipe Valve Symbol (Bowtie ⧓) */}
                <polygon points="238,81 252,97 238,97" fill="#0284C7" stroke="#38BDF8" strokeWidth="1" />
                <polygon points="252,81 238,97 252,97" fill="#0284C7" stroke="#38BDF8" strokeWidth="1" />
                {/* Valve Handwheel stem */}
                <line x1="245" y1="89" x2="245" y2="79" stroke="#38BDF8" strokeWidth="1.5" />
                <line x1="241" y1="79" x2="249" y2="79" stroke="#38BDF8" strokeWidth="2" />

                {/* Needle Pressure Transmitter Gauge (Ⓟ) */}
                <circle cx="282" cy="72" r="7" fill="#0B2239" stroke="#38BDF8" strokeWidth="1.2" />
                <line x1="282" y1="79" x2="282" y2="76" stroke="#38BDF8" strokeWidth="1.5" />
                <line x1="282" y1="72" x2="285" y2="69" stroke="#06B6D4" strokeWidth="1.2" />

                {/* Labels */}
                <text x="263" y="114" fill="#FFFFFF" fontSize="9.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  SP-01
                </text>
                <text x="263" y="125" fill="#38BDF8" fontSize="7.5" fontFamily="monospace" textAnchor="middle">
                  {isSimulatedMode ? `Loss: ${simSummary.estimatedHeatLoss}%` : '86.1 bar • 273°C'}
                </text>
              </g>

              {/* ========================================================================= */}
              {/* 3. STEAM PIPELINE (SP-02) - ANOMALY / DIFFERENTIAL PRESSURE WARNING LINE */}
              {/* ========================================================================= */}
              <g onClick={() => handleAssetClick('SP-02')} className="cursor-pointer group">
                {/* Insulated Pipe Body */}
                <rect
                  x="225"
                  y="176"
                  width="75"
                  height="26"
                  rx="4"
                  fill="#0B2239"
                  stroke={
                    isSimulatedMode && isTargetIW02 && isUnsafe
                      ? '#EF4444'
                      : assets['SP-02']?.status === 'WARNING'
                      ? '#F43F5E'
                      : selectedTag === 'SP-02'
                      ? '#06B6D4'
                      : '#0284C7'
                  }
                  strokeWidth={isSimulatedMode && isTargetIW02 && isUnsafe ? '3' : '2'}
                  className={isSimulatedMode && isTargetIW02 && isUnsafe ? 'animate-pulse' : 'group-hover:brightness-125'}
                />
                {/* Raised-Face Flanges */}
                <rect
                  x="222"
                  y="172"
                  width="5"
                  height="34"
                  rx="1"
                  fill="#153B63"
                  stroke={assets['SP-02']?.status === 'WARNING' || (isSimulatedMode && isTargetIW02 && isUnsafe) ? '#F43F5E' : '#06B6D4'}
                  strokeWidth="1"
                />
                <rect
                  x="298"
                  y="172"
                  width="5"
                  height="34"
                  rx="1"
                  fill="#153B63"
                  stroke={assets['SP-02']?.status === 'WARNING' || (isSimulatedMode && isTargetIW02 && isUnsafe) ? '#F43F5E' : '#06B6D4'}
                  strokeWidth="1"
                />

                {/* In-Line Valve with DP Constriction Indicator */}
                <polygon
                  points="238,181 252,197 238,197"
                  fill={assets['SP-02']?.status === 'WARNING' || (isSimulatedMode && isTargetIW02 && isUnsafe) ? '#F43F5E' : '#0284C7'}
                  stroke={assets['SP-02']?.status === 'WARNING' || (isSimulatedMode && isTargetIW02 && isUnsafe) ? '#FECDD3' : '#38BDF8'}
                  strokeWidth="1"
                />
                <polygon
                  points="252,181 238,197 252,197"
                  fill={assets['SP-02']?.status === 'WARNING' || (isSimulatedMode && isTargetIW02 && isUnsafe) ? '#F43F5E' : '#0284C7'}
                  stroke={assets['SP-02']?.status === 'WARNING' || (isSimulatedMode && isTargetIW02 && isUnsafe) ? '#FECDD3' : '#38BDF8'}
                  strokeWidth="1"
                />
                <line
                  x1="245"
                  y1="189"
                  x2="245"
                  y2="179"
                  stroke={assets['SP-02']?.status === 'WARNING' || (isSimulatedMode && isTargetIW02 && isUnsafe) ? '#F43F5E' : '#38BDF8'}
                  strokeWidth="1.5"
                />
                <line
                  x1="241"
                  y1="179"
                  x2="249"
                  y2="179"
                  stroke={assets['SP-02']?.status === 'WARNING' || (isSimulatedMode && isTargetIW02 && isUnsafe) ? '#F43F5E' : '#38BDF8'}
                  strokeWidth="2"
                />

                {/* Differential Pressure Gauge */}
                <circle
                  cx="282"
                  cy="172"
                  r="7"
                  fill="#0B2239"
                  stroke={assets['SP-02']?.status === 'WARNING' || (isSimulatedMode && isTargetIW02 && isUnsafe) ? '#F43F5E' : '#38BDF8'}
                  strokeWidth="1.2"
                />
                <line
                  x1="282"
                  y1="179"
                  x2="282"
                  y2="176"
                  stroke={assets['SP-02']?.status === 'WARNING' || (isSimulatedMode && isTargetIW02 && isUnsafe) ? '#F43F5E' : '#38BDF8'}
                  strokeWidth="1.5"
                />
                <line
                  x1="282"
                  y1="172"
                  x2="286"
                  y2="168"
                  stroke={assets['SP-02']?.status === 'WARNING' || (isSimulatedMode && isTargetIW02 && isUnsafe) ? '#EF4444' : '#06B6D4'}
                  strokeWidth="1.5"
                />

                {/* Labels */}
                <text
                  x="263"
                  y="214"
                  fill={
                    isSimulatedMode && isTargetIW02 && isUnsafe
                      ? '#EF4444'
                      : assets['SP-02']?.status === 'WARNING'
                      ? '#F43F5E'
                      : '#FFFFFF'
                  }
                  fontSize="9.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  SP-02 {isSimulatedMode && isTargetIW02 && isUnsafe ? '🚨' : assets['SP-02']?.status === 'WARNING' ? '⚠️' : ''}
                </text>
                <text
                  x="263"
                  y="225"
                  fill={
                    isSimulatedMode && isTargetIW02 && isUnsafe
                      ? '#FDA4AF'
                      : assets['SP-02']?.status === 'WARNING'
                      ? '#FDA4AF'
                      : '#38BDF8'
                  }
                  fontSize="7.5"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {isSimulatedMode && isTargetIW02 && isUnsafe
                    ? 'HOOP STRESS BREACH'
                    : assets['SP-02']?.status === 'WARNING'
                    ? `${(assets['SP-02']?.telemetry?.outletPressure || 81.2).toFixed(1)} bar • ΔP High`
                    : `${(assets['SP-02']?.telemetry?.outletPressure || 85.8).toFixed(1)} bar • Nominal`}
                </text>
              </g>

              {/* ========================================================================= */}
              {/* 4. INJECTION WELL (IW-01) - 2D CHRISTMAS TREE & DOWNHOLE TUBING           */}
              {/* ========================================================================= */}
              <g onClick={() => handleAssetClick('IW-01')} className="cursor-pointer group">
                {/* Surface Wellhead Base Casing Flange */}
                <rect x="338" y="112" width="46" height="8" rx="1" fill="#0D2D4B" stroke="#0284C7" strokeWidth="1.5" />
                {/* Downhole Conductor & Injection Tubing string */}
                <rect x="358" y="120" width="6" height="26" fill="#071E33" stroke="#06B6D4" strokeWidth="1.2" />
                <path d="M 358 135 L 361 142 L 364 135" fill="none" stroke="#38BDF8" strokeWidth="1.5" />

                {/* Master Valve Body Block */}
                <rect x="354" y="82" width="14" height="30" rx="2" fill="#0A223B" stroke="#06B6D4" strokeWidth="1.5" />
                {/* Master Valve Handwheels */}
                <line x1="348" y1="92" x2="354" y2="92" stroke="#38BDF8" strokeWidth="2" />
                <line x1="368" y1="92" x2="374" y2="92" stroke="#38BDF8" strokeWidth="2" />

                {/* Lateral Steam Injection Wing Valve */}
                <rect x="338" y="86" width="16" height="9" rx="1" fill="#0E3357" stroke="#38BDF8" strokeWidth="1.2" />
                {/* Top Swab Valve and Pressure Gauge */}
                <rect x="358" y="73" width="6" height="9" fill="#0B233D" stroke="#06B6D4" strokeWidth="1.2" />
                <circle cx="361" cy="70" r="5.5" fill="#0E2D4A" stroke="#38BDF8" strokeWidth="1.2" />

                {/* Labels */}
                <text x="361" y="60" fill="#FFFFFF" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  IW-01
                </text>
                <text x="361" y="156" fill="#38BDF8" fontSize="7.5" fontFamily="monospace" textAnchor="middle">
                  CSS Injection (C-4)
                </text>
              </g>

              {/* ========================================================================= */}
              {/* 5. INJECTION WELL (IW-02) - 2D CHRISTMAS TREE (TARGET WELLHEAD)           */}
              {/* ========================================================================= */}
              <g onClick={() => handleAssetClick('IW-02')} className="cursor-pointer group">
                {/* Pulsing ring if in danger */}
                {isSimulatedMode && isTargetIW02 && isUnsafe && (
                  <circle cx="361" cy="188" r="28" fill="none" stroke="#EF4444" strokeWidth="2" className="animate-ping" />
                )}

                {/* Surface Wellhead Base Casing Flange */}
                <rect
                  x="338"
                  y="212"
                  width="46"
                  height="8"
                  rx="1"
                  fill="#0D2D4B"
                  stroke={isSimulatedMode && isTargetIW02 && isUnsafe ? '#EF4444' : '#0284C7'}
                  strokeWidth="1.5"
                />
                {/* Downhole Conductor & Injection Tubing string */}
                <rect
                  x="358"
                  y="220"
                  width="6"
                  height="26"
                  fill="#071E33"
                  stroke={isSimulatedMode && isTargetIW02 && isUnsafe ? '#EF4444' : '#06B6D4'}
                  strokeWidth="1.2"
                />
                <path
                  d="M 358 235 L 361 242 L 364 235"
                  fill="none"
                  stroke={isSimulatedMode && isTargetIW02 && isUnsafe ? '#EF4444' : '#38BDF8'}
                  strokeWidth="1.5"
                />

                {/* Master Valve Body Block */}
                <rect
                  x="354"
                  y="182"
                  width="14"
                  height="30"
                  rx="2"
                  fill="#0A223B"
                  stroke={isSimulatedMode && isTargetIW02 && isUnsafe ? '#EF4444' : '#06B6D4'}
                  strokeWidth="1.5"
                />
                {/* Master Valve Handwheels */}
                <line x1="348" y1="192" x2="354" y2="192" stroke="#38BDF8" strokeWidth="2" />
                <line x1="368" y1="192" x2="374" y2="192" stroke="#38BDF8" strokeWidth="2" />

                {/* Lateral Steam Injection Wing Valve */}
                <rect x="338" y="186" width="16" height="9" rx="1" fill="#0E3357" stroke="#38BDF8" strokeWidth="1.2" />
                {/* Top Swab Valve and Crown Pressure Gauge */}
                <rect x="358" y="173" width="6" height="9" fill="#0B233D" stroke="#06B6D4" strokeWidth="1.2" />
                <circle
                  cx="361"
                  cy="170"
                  r="5.5"
                  fill="#0E2D4A"
                  stroke={isSimulatedMode && isTargetIW02 && isUnsafe ? '#EF4444' : '#38BDF8'}
                  strokeWidth="1.2"
                />

                {/* Labels */}
                <text
                  x="361"
                  y="160"
                  fill={isSimulatedMode && isTargetIW02 && isUnsafe ? '#EF4444' : '#FFFFFF'}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  IW-02 {isSimulatedMode && isTargetIW02 && isUnsafe ? '⚠️' : ''}
                </text>
                <text
                  x="361"
                  y="256"
                  fill={isSimulatedMode && isTargetIW02 && isUnsafe ? '#FDA4AF' : '#94A3B8'}
                  fontSize="7.5"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {isSimulatedMode && isTargetIW02
                    ? isUnsafe
                      ? `⚠️ ${metrics.steamPressure}b OVERPRESSURE`
                      : `${metrics.steamPressure} bar (Sim)`
                    : 'CSS Injection (C-3)'}
                </text>
              </g>

              {/* ========================================================================= */}
              {/* 6. SUBSURFACE RESERVOIR (R-01) - CAPROCK SHALE STRATA & THERMAL FRONT     */}
              {/* ========================================================================= */}
              <g className="select-none">
                {/* Layer 1: Impermeable Caprock Shale Seal Barrier */}
                <rect
                  x="485"
                  y="145"
                  width="140"
                  height="26"
                  rx="6"
                  fill="url(#caprockLayerGrad)"
                  stroke={isSimulatedMode && isUnsafe ? '#EF4444' : '#475569'}
                  strokeWidth={isSimulatedMode && isUnsafe ? '2.5' : '1.5'}
                />
                {/* Shale geological rock striations */}
                <line x1="495" y1="154" x2="525" y2="154" stroke="#64748B" strokeWidth="1" strokeDasharray="3 2" />
                <line x1="535" y1="154" x2="585" y2="154" stroke="#64748B" strokeWidth="1" strokeDasharray="4 2" />
                <line x1="595" y1="154" x2="615" y2="154" stroke="#64748B" strokeWidth="1" strokeDasharray="3 2" />
                <line x1="505" y1="162" x2="555" y2="162" stroke="#64748B" strokeWidth="1" strokeDasharray="5 2" />
                <line x1="565" y1="162" x2="610" y2="162" stroke="#64748B" strokeWidth="1" strokeDasharray="4 2" />

                <text
                  x="555"
                  y="158"
                  fill={isSimulatedMode && isUnsafe ? '#FCA5A5' : '#94A3B8'}
                  fontSize="7.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {isSimulatedMode && isUnsafe ? '⚠️ CAPROCK INTEGRITY BREACHED' : 'CAPROCK SHALE (94 BAR CEILING)'}
                </text>

                {/* Layer 2: Porous Heavy Bitumen Sand Formation */}
                <rect
                  x="485"
                  y="171"
                  width="140"
                  height="162"
                  rx="6"
                  fill="url(#reservoirGrad)"
                  stroke={isSimulatedMode ? (isUnsafe ? '#EF4444' : '#F59E0B') : '#14B8A6'}
                  strokeWidth={isSimulatedMode ? (isUnsafe ? '3' : '2.5') : '1.8'}
                />

                {/* Reservoir Stratum Sandstone Geological Stippling */}
                <circle cx="505" cy="190" r="1" fill="#475569" opacity="0.4" />
                <circle cx="530" cy="182" r="1.2" fill="#475569" opacity="0.4" />
                <circle cx="600" cy="195" r="1" fill="#475569" opacity="0.4" />
                <circle cx="515" cy="275" r="1.2" fill="#475569" opacity="0.4" />
                <circle cx="595" cy="285" r="1" fill="#475569" opacity="0.4" />

                {/* JAGGED FRACTURE CRACKS IN RESERVOIR (If Unsafe) */}
                {isSimulatedMode && isUnsafe ? (
                  <g>
                    {/* Primary Caprock Fault Fracture */}
                    <path
                      d="M 495 200 L 525 215 L 535 205 L 560 235 L 580 220 L 605 245"
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="animate-pulse"
                    />
                    {/* Secondary Branch Fracture */}
                    <path
                      d="M 525 215 L 520 260 L 545 275 L 575 285"
                      fill="none"
                      stroke="#F87171"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                    />
                    {/* Steam Venting Crack to surface */}
                    <path
                      d="M 555 145 L 555 175 L 568 185"
                      fill="none"
                      stroke="#FCA5A5"
                      strokeWidth="2.5"
                      strokeDasharray="3 3"
                      className="animate-pulse"
                    />
                  </g>
                ) : (
                  /* Normal expanding thermal steam isotherms */
                  <g>
                    <ellipse cx="545" cy="235" rx="42" ry="32" fill="none" stroke="#F59E0B" strokeWidth="1" strokeDasharray="3 2" opacity="0.7" />
                    <ellipse cx="545" cy="235" rx="24" ry="18" fill="none" stroke="#F97316" strokeWidth="1.2" opacity="0.85" />
                  </g>
                )}

                <text
                  x="555"
                  y="190"
                  fill={isSimulatedMode ? (isUnsafe ? '#FCA5A5' : '#FEF08A') : '#5EEAD4'}
                  fontSize="11"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  RESERVOIR R-01
                </text>
                <text
                  x="555"
                  y="206"
                  fill={isSimulatedMode ? (isUnsafe ? '#EF4444' : '#FDE047') : '#99F6E4'}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {isSimulatedMode && isUnsafe ? `${metrics.steamPressure} bar (BREACH)` : `${simSummary.predictedReservoirTemp} °C`}
                </text>
                <text
                  x="555"
                  y="222"
                  fill={isSimulatedMode ? (isUnsafe ? '#F87171' : '#FDE047') : '#99F6E4'}
                  fontSize="8.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {isSimulatedMode
                    ? isUnsafe
                      ? `Overpressure: +${pressureExceedance.toFixed(1)} bar Rupture`
                      : `Viscosity: ${simSummary.predictedReservoirTemp > 150 ? '18 cP' : '85 cP'} (Mobilized)`
                    : 'Viscosity: 18 cP (Stimulated)'}
                </text>
                <text
                  x="555"
                  y="238"
                  fill={isSimulatedMode ? (isUnsafe ? '#FCA5A5' : '#A7F3D0') : '#64748B'}
                  fontSize="8"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  Target: Heavy Bitumen Sand
                </text>
                <text
                  x="555"
                  y="254"
                  fill={isSimulatedMode ? (isUnsafe ? '#EF4444' : '#34D399') : '#64748B'}
                  fontSize="7.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {isSimulatedMode
                    ? isUnsafe
                      ? 'HYDRAULIC FRACTURE INTEGRITY: FAILED'
                      : 'Fracture Margin: +8.0 bar SAFE'
                    : 'Initial P: 45.0 bar • Depth: 950m'}
                </text>

                <text
                  x="555"
                  y="318"
                  fill={isSimulatedMode ? (isUnsafe ? '#EF4444' : '#FBBF24') : '#64748B'}
                  fontSize={isSimulatedMode && isUnsafe ? '8.5' : '7.5'}
                  fontFamily="monospace"
                  fontWeight={isSimulatedMode && isUnsafe ? 'bold' : 'normal'}
                  textAnchor="middle"
                >
                  {isSimulatedMode
                    ? isUnsafe
                      ? '🚨 STEAM BLOWOUT / FORMATION SHEAR'
                      : 'Thermal Radius: 48m • Mobilized Drive Front'
                    : 'Subsurface Reservoir Matrix'}
                </text>
              </g>

              {/* ========================================================================= */}
              {/* 7. PRODUCTION WELL (PW-01) - 2D CHRISTMAS TREE & OIL RECOVERY LINER       */}
              {/* ========================================================================= */}
              <g onClick={() => handleAssetClick('PW-01')} className="cursor-pointer group">
                {/* Surface Wellhead Base Casing Flange */}
                <rect x="702" y="112" width="46" height="8" rx="1" fill="#0D2D4B" stroke="#F59E0B" strokeWidth="1.5" />
                {/* Downhole Tubing string with Perforated Slotted Liner */}
                <rect x="722" y="120" width="6" height="26" fill="#071E33" stroke="#F59E0B" strokeWidth="1.2" />
                {/* Upward crude flow chevrons ^ ^ ^ */}
                <path d="M 722 142 L 725 135 L 728 142" fill="none" stroke="#FBBF24" strokeWidth="1.5" />

                {/* Master Valve Body Block */}
                <rect x="718" y="82" width="14" height="30" rx="2" fill="#0A223B" stroke="#F59E0B" strokeWidth="1.5" />
                {/* Lateral Production Wing Valve branching right toward pump */}
                <rect x="732" y="86" width="16" height="9" rx="1" fill="#0E3357" stroke="#FBBF24" strokeWidth="1.2" />

                {/* Top Stuffing Box for Sucker Rod string */}
                <rect x="721" y="72" width="8" height="10" rx="1" fill="#153E6B" stroke="#F59E0B" strokeWidth="1.2" />
                <line x1="725" y1="72" x2="725" y2="64" stroke="#FBBF24" strokeWidth="2" />

                {/* Labels */}
                <text x="725" y="60" fill="#FFFFFF" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  PW-01
                </text>
                <text x="725" y="156" fill="#FBBF24" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  {isSimulatedMode ? `${simSummary.expectedProduction} BPD` : `${assets['PW-01']?.telemetry?.oilRate || 440.2} BPD`}
                </text>
              </g>

              {/* ========================================================================= */}
              {/* 8. SUCKER ROD PUMP (SRP-01) - 2D BEAM PUMPJACK / NODDING DONKEY SILHOUETTE*/}
              {/* ========================================================================= */}
              <g onClick={() => handleAssetClick('SRP-01')} className="cursor-pointer group">
                {/* Steel Skid Foundation Base */}
                <line x1="810" y1="174" x2="915" y2="174" stroke="#1E3A5F" strokeWidth="4" strokeLinecap="round" />

                {/* Samson Post (A-Frame Triangular Structure) */}
                <polygon points="852,174 874,174 863,115" fill="#0B233D" stroke="#0284C7" strokeWidth="1.8" />
                <line x1="857" y1="145" x2="869" y2="145" stroke="#0284C7" strokeWidth="1.2" />

                {/* Center Saddle Bearing atop Samson Post */}
                <circle cx="863" cy="115" r="4.5" fill="#06B6D4" stroke="#FFFFFF" strokeWidth="1" />

                {/* Walking Beam (Rocker Arm I-Beam) */}
                <polygon
                  points="820,110 905,105 905,115 820,120"
                  fill="#0E3052"
                  stroke="#06B6D4"
                  strokeWidth="1.5"
                  className="group-hover:brightness-125"
                />

                {/* Horsehead Curved Sector Head */}
                <path
                  d="M 820 102 Q 806 114 814 134 L 820 131 Q 814 116 822 108 Z"
                  fill="#0B2542"
                  stroke="#06B6D4"
                  strokeWidth="1.5"
                />

                {/* Wireline Bridle & Polished Rod hanging from Horsehead */}
                <line x1="814" y1="134" x2="814" y2="168" stroke="#38BDF8" strokeWidth="1.8" strokeDasharray="3 1" />
                <rect x="811" y="166" width="6" height="5" fill="#0284C7" />

                {/* Rear Pitman Arm connecting Walking Beam to Crank Pin */}
                <line x1="900" y1="110" x2="894" y2="146" stroke="#0284C7" strokeWidth="2.5" />

                {/* Rotating Counterweight Crank Disc */}
                <circle cx="894" cy="146" r="14" fill="#07192C" stroke="#F59E0B" strokeWidth="2" />
                <line x1="894" y1="146" x2="904" y2="152" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
                <circle cx="894" cy="146" r="3" fill="#FFFFFF" />

                {/* Labels */}
                <text x="863" y="94" fill="#FFFFFF" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  SRP-01
                </text>
                <text x="863" y="188" fill={isSimulatedMode ? '#34D399' : '#94A3B8'} fontSize="7.5" fontFamily="monospace" textAnchor="middle">
                  {isSimulatedMode ? '18,400 lbs • 7.2 SPM' : '7.2 SPM • 2.1 mm/s'}
                </text>
              </g>

              {/* ========================================================================= */}
              {/* 9. OIL GATHERING PIPELINE (OP-01) - 2D GATHERING TRUNK SECTION            */}
              {/* ========================================================================= */}
              <g onClick={() => handleAssetClick('OP-01')} className="cursor-pointer group">
                <rect
                  x="670"
                  y="356"
                  width="75"
                  height="26"
                  rx="4"
                  fill="#0B2239"
                  stroke={selectedTag === 'OP-01' ? '#06B6D4' : '#1E3A5F'}
                  strokeWidth="1.8"
                  className="group-hover:brightness-125"
                />
                {/* Flanges */}
                <rect x="667" y="352" width="5" height="34" rx="1" fill="#153B63" stroke="#F59E0B" strokeWidth="1" />
                <rect x="743" y="352" width="5" height="34" rx="1" fill="#153B63" stroke="#F59E0B" strokeWidth="1" />

                {/* In-Line Check Valve (Non-Return) Symbol */}
                <circle cx="707" cy="369" r="6.5" fill="#091E33" stroke="#F59E0B" strokeWidth="1.2" />
                <path d="M 704 365 L 710 369 L 704 373 Z" fill="#F59E0B" />

                <text x="707" y="394" fill="#FFFFFF" fontSize="9.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  OP-01
                </text>
                <text x="707" y="405" fill="#F59E0B" fontSize="7.5" fontFamily="monospace" textAnchor="middle">
                  {isSimulatedMode ? 'Flow: 1.42 m/s' : 'Gathering Trunk'}
                </text>
              </g>

              {/* ========================================================================= */}
              {/* 10. BOOSTER PUMP STATION (PS-01) - 2D CENTRIFUGAL VOLUTE PUMP & MOTOR     */}
              {/* ========================================================================= */}
              <g onClick={() => handleAssetClick('PS-01')} className="cursor-pointer group">
                {/* Centrifugal Volute Pump Snail-Shell Casing */}
                <circle cx="475" cy="370" r="18" fill="#09223D" stroke="#06B6D4" strokeWidth="2" className="group-hover:brightness-125" />
                {/* Tangential Discharge Nozzle to the left */}
                <rect x="445" y="362" width="18" height="12" fill="#0A243F" stroke="#06B6D4" strokeWidth="1.5" />
                <rect x="442" y="359" width="4" height="18" fill="#153E6B" stroke="#06B6D4" strokeWidth="1" />

                {/* Impeller Eye Hub & Vane Blades */}
                <circle cx="475" cy="370" r="8" fill="#0E3052" stroke="#38BDF8" strokeWidth="1.2" />
                <line x1="475" y1="363" x2="475" y2="377" stroke="#38BDF8" strokeWidth="1.5" />
                <line x1="468" y1="370" x2="482" y2="370" stroke="#38BDF8" strokeWidth="1.5" />

                {/* Electric Drive Motor Body coupled to right */}
                <rect x="496" y="357" width="28" height="26" rx="3" fill="#071B2F" stroke="#0284C7" strokeWidth="1.5" />
                {/* Motor Cooling Fin Ribs */}
                <line x1="503" y1="357" x2="503" y2="383" stroke="#15385C" strokeWidth="1" />
                <line x1="510" y1="357" x2="510" y2="383" stroke="#15385C" strokeWidth="1" />
                <line x1="517" y1="357" x2="517" y2="383" stroke="#15385C" strokeWidth="1" />

                {/* Labels */}
                <text x="485" y="348" fill="#FFFFFF" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  PS-01
                </text>
                <text x="485" y="402" fill="#34D399" fontSize="7.5" fontFamily="monospace" textAnchor="middle">
                  {isSimulatedMode ? 'Power: 38.5 kW' : 'Booster Pump (45 bar)'}
                </text>
              </g>

              {/* ========================================================================= */}
              {/* 11. STORAGE TANK (ST-01) - 2D API 650 CYLINDRICAL TANK WITH LIQUID FILL   */}
              {/* ========================================================================= */}
              <g onClick={() => handleAssetClick('ST-01')} className="cursor-pointer group">
                {/* Tank Foundation Concrete Ringwall */}
                <rect x="170" y="408" width="90" height="6" rx="1" fill="#152E47" stroke="#1E3E62" strokeWidth="1" />

                {/* Cylindrical Shell Tank with Conical Domed Roof */}
                <path
                  d="M 175 342 L 215 324 L 255 342 L 255 408 L 175 408 Z"
                  fill="#0A223B"
                  stroke={selectedTag === 'ST-01' ? '#06B6D4' : '#0284C7'}
                  strokeWidth="2"
                  className="group-hover:brightness-125"
                />

                {/* Top Atmospheric Breather Vent / Flame Arrestor Nozzle */}
                <rect x="211" y="316" width="8" height="8" rx="1" fill="#0F2B47" stroke="#38BDF8" strokeWidth="1" />
                <line x1="209" y1="316" x2="221" y2="316" stroke="#38BDF8" strokeWidth="1.5" />

                {/* Dynamic Crude Oil Liquid Fill inside the tank */}
                <rect
                  x="177"
                  y="360"
                  width="76"
                  height="46"
                  fill="url(#tankLiquidGrad)"
                  rx="2"
                  opacity="0.85"
                />
                {/* Liquid Level Surface Wave line */}
                <path d="M 177 360 Q 196 357 215 360 T 253 360" fill="none" stroke="#FDE68A" strokeWidth="1.5" />

                {/* Spiral External Wind Girder / Stairway Silhouette */}
                <line x1="175" y1="400" x2="255" y2="352" stroke="#1E3E62" strokeWidth="1.5" strokeDasharray="3 2" />

                {/* Labels */}
                <text x="215" y="352" fill="#FFFFFF" fontSize="10" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  ST-01
                </text>
                <text x="215" y="380" fill="#FEF08A" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  {assets['ST-01']?.telemetry?.levelPct || 68.4}% Fill
                </text>
                <text x="215" y="394" fill="#FBBF24" fontSize="7" fontFamily="monospace" textAnchor="middle">
                  {isSimulatedMode ? '+18.2% Projected' : '3,420 m³ Net'}
                </text>
              </g>
            </svg>
          </div>
        </div>

        {/* Legend / Status Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className={`w-2.5 h-2.5 rounded-full ${isSimulatedMode ? (isUnsafe ? 'bg-rose-500 animate-ping' : 'bg-cyan-400') : 'bg-cyan-400'}`}></span>
              {isSimulatedMode
                ? (isUnsafe ? `Overpressure Hazard Line (${metrics.steamPressure} bar)` : `Simulated Steam Transit (${metrics.steamPressure} bar)`)
                : 'Live Steam Transit (86.1 bar)'}
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className={`w-2.5 h-2.5 rounded-full ${isSimulatedMode ? (isUnsafe ? 'bg-rose-500' : 'bg-amber-400') : 'bg-teal-400'}`}></span>
              {isSimulatedMode
                ? (isUnsafe ? 'Caprock Fracture Rupture Zone (R-01)' : 'Thermal Stimulated Front (R-01)')
                : 'Subsurface Reservoir Zone R-01 (100% Intact Seal)'}
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              {isSimulatedMode
                ? (isUnsafe ? 'Protected Gathering Trunk' : `Enhanced Oil Production (${simSummary.expectedProduction} BPD)`)
                : 'Live Heavy Oil Gathering Trunk (4,820 BPD)'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {isSimulatedMode
                ? 'Click any node in topology to inspect live telemetry vs simulated delta'
                : 'Click any node in topology to inspect live physical asset telemetry'}
            </span>
          </div>
        </div>
      </div>
      )}

      {/* CONDITIONAL CONTENT: SIMULATED DIGITAL TWIN vs LIVE PHYSICAL BASELINE */}
      {isSimulatedMode ? (
        <>
          {/* WHAT EXACTLY HAPPENS ACROSS THE DIGITAL TWIN (6-Stage Physical Chain of Events) */}
          <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2
              className={`text-sm font-bold font-mono uppercase tracking-wider flex items-center gap-2 ${
                isUnsafe ? 'text-rose-400' : 'text-white'
              }`}
            >
              {isUnsafe ? <AlertOctagon className="w-4 h-4 text-rose-400 animate-bounce" /> : <Layers className="w-4 h-4 text-cyan-400" />}
              {isUnsafe
                ? 'Catastrophic Physical Impacts If This Unsafe Scenario Were Implemented'
                : 'What Exactly Happens If These Metrics Are Used in the Field'}
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              {isUnsafe
                ? 'Subsurface engineering disaster simulation: Hydraulic breakdown, caprock shearing, and structural overload.'
                : 'Step-by-step systemic physics propagation from steam boiler through reservoir rock to terminal storage.'}
            </p>
          </div>

          {/* Interactive Phase Stepper */}
          <div className="hidden md:flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs font-mono">
            {[
              { id: 1, label: 'Hour 0-24: Ramp-Up' },
              { id: 2, label: 'Day 1-14: Injection' },
              { id: 3, label: 'Day 15-21: Soak' },
              { id: 4, label: 'Day 22+: Production' },
            ].map((ph) => (
              <button
                key={ph.id}
                onClick={() => setActivePhase(ph.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${
                  activePhase === ph.id
                    ? isUnsafe
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                      : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {ph.label}
              </button>
            ))}
          </div>
        </div>

        {/* 6 Stage Impact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
          {/* Stage 1: Steam Generation */}
          <div
            className={`petro-card p-4 border rounded-xl space-y-3 transition-all ${
              isUnsafe ? 'border-rose-500/40 bg-rose-950/20' : activePhase === 1 ? 'border-cyan-500/60 bg-cyan-950/20' : 'border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isUnsafe ? 'bg-rose-500/30 text-rose-300' : 'bg-cyan-500/20 text-cyan-300'}`}>1</span>
                OTSG Steam Generator (SG-01)
              </span>
              <span className={`text-[10px] uppercase font-bold ${isUnsafe ? 'text-rose-400' : 'text-cyan-400'}`}>
                {isUnsafe ? 'Thermal Overload' : 'Boiler Duty'}
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {isUnsafe
                ? `Boiler burner pushed to maximum limit delivering ${metrics.steamFlowRate} t/hr at ${metrics.steamPressure} bar. Heat exchanger tube skin temperatures exceed 340°C, risking scale blister and tube rupture.`
                : `OTSG boiler burner ramps thermal firing to sustain ${metrics.steamFlowRate} t/hr mass flow at ${metrics.steamPressure} bar.`}
            </p>
            <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Thermal Power:</span>
                <span className={`font-bold ${isUnsafe ? 'text-rose-400' : 'text-white'}`}>{(metrics.steamFlowRate * 0.76).toFixed(2)} MW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Boiler Tube Stress:</span>
                <span className={`font-bold ${isUnsafe ? 'text-rose-400 animate-pulse' : 'text-cyan-300'}`}>
                  {isUnsafe ? 'CRITICAL (91% MOP)' : '265 Nm³/hr'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Burner Status:</span>
                <span className={`font-bold ${isUnsafe ? 'text-rose-400' : 'text-white'}`}>
                  {isUnsafe ? 'MAXIMUM FIRING LIMIT' : '72 m³/day'}
                </span>
              </div>
            </div>
          </div>

          {/* Stage 2: Pipeline Transit & Weather Impact */}
          <div
            className={`petro-card p-4 border rounded-xl space-y-3 transition-all ${
              isUnsafe ? 'border-rose-500/40 bg-rose-950/20' : activePhase === 2 ? 'border-cyan-500/60 bg-cyan-950/20' : 'border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isUnsafe ? 'bg-rose-500/30 text-rose-300' : 'bg-cyan-500/20 text-cyan-300'}`}>2</span>
                Surface Pipeline Transit (SP-01/02)
              </span>
              <span className={`text-[10px] uppercase font-bold ${isUnsafe ? 'text-rose-400' : 'text-amber-400'}`}>
                {isUnsafe ? 'Severe Storm Loss' : 'Weather Coupled'}
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {metrics.windSpeed > 50
                ? `Catastrophic wind velocity (${metrics.windSpeed} km/h gale) combined with extreme ambient heat triggers severe convective thermal stripping (${simSummary.estimatedHeatLoss}% heat loss) and pipeline cyclic fatigue.`
                : `Ambient weather (${metrics.ambientTemp}°C, ${metrics.windSpeed} km/h wind) produces ${simSummary.estimatedHeatLoss}% heat loss over 620m insulated transit.`}
            </p>
            <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Line Pressure:</span>
                <span className={`font-bold ${isUnsafe ? 'text-rose-400' : 'text-white'}`}>{metrics.steamPressure} bar</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ASME B31.3 Hoop Stress:</span>
                <span className={`font-bold ${isUnsafe ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                  {isUnsafe ? '248.5 MPa (> 220 MPa Limit)' : `${simSummary.pipelineStress} MPa (Safe)`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Insulation Integrity:</span>
                <span className={`font-bold ${isUnsafe ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isUnsafe ? 'THERMAL EXPANSION WARNING' : 'APPROVED'}
                </span>
              </div>
            </div>
          </div>

          {/* Stage 3: Wellhead Injection & Containment Breach */}
          <div
            className={`petro-card p-4 border rounded-xl space-y-3 transition-all ${
              isUnsafe ? 'border-rose-500 bg-rose-950/40 shadow-lg shadow-rose-950/60' : activePhase === 2 ? 'border-cyan-500/60 bg-cyan-950/20' : 'border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isUnsafe ? 'bg-rose-500 text-black font-extrabold' : 'bg-cyan-500/20 text-cyan-300'}`}>3</span>
                Injection Well ({targetWell})
              </span>
              <span className={`text-[10px] uppercase font-bold ${isUnsafe ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
                {isUnsafe ? '🚨 OVERPRESSURE BREACH' : 'Containment Safe'}
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {isUnsafe
                ? `CRITICAL RISK: Wellhead injection pressure of ${metrics.steamPressure} bar exceeds the formation breakdown limit of 94.0 bar by +${pressureExceedance.toFixed(1)} bar! High danger of casing rupture, cement micro-annulus shearing, and surface blowout!`
                : `Wellhead pressure operates at ${metrics.steamPressure} bar, safely below the 94.0 bar formation fracture ceiling.`}
            </p>
            <div className={`p-2 rounded border space-y-1 text-[11px] ${isUnsafe ? 'bg-rose-950/80 border-rose-500/80 text-rose-200' : 'bg-slate-950/80 border-slate-800/80'}`}>
              <div className="flex justify-between">
                <span className={isUnsafe ? 'text-rose-300' : 'text-slate-500'}>Fracture Margin:</span>
                <span className={`font-bold ${isUnsafe ? 'text-rose-400 font-extrabold animate-pulse' : 'text-emerald-400'}`}>
                  {isUnsafe ? `-${pressureExceedance.toFixed(1)} bar (EXCEEDED)` : `+${(94.0 - metrics.steamPressure).toFixed(1)} bar cushion`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isUnsafe ? 'text-rose-300' : 'text-slate-500'}>Formation Breakdown:</span>
                <span className={`font-bold ${isUnsafe ? 'text-rose-400' : 'text-cyan-300'}`}>94.0 bar Ceiling</span>
              </div>
              <div className="flex justify-between">
                <span className={isUnsafe ? 'text-rose-300' : 'text-slate-500'}>Casing Integrity:</span>
                <span className={`font-bold ${isUnsafe ? 'text-rose-400 uppercase font-extrabold' : 'text-emerald-400'}`}>
                  {isUnsafe ? 'FAIL / SHEAR DANGER' : 'APPROVED'}
                </span>
              </div>
            </div>
          </div>

          {/* Stage 4: Reservoir Physics & Caprock Shearing */}
          <div
            className={`petro-card p-4 border rounded-xl space-y-3 transition-all ${
              isUnsafe ? 'border-rose-500 bg-rose-950/40 shadow-lg shadow-rose-950/60' : activePhase === 3 ? 'border-amber-500/60 bg-amber-950/20' : 'border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white flex items-center gap-2">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isUnsafe ? 'bg-rose-500 text-black font-extrabold' : 'bg-amber-500/20 text-amber-300'}`}>4</span>
                Reservoir Matrix (Zone R-01)
              </span>
              <span className={`text-[10px] uppercase font-bold ${isUnsafe ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>
                {isUnsafe ? '🚨 CAPROCK RUPTURE' : 'Viscosity Collapse'}
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {isUnsafe
                ? `CATASTROPHIC FRACTURE: Induced tensile fractures propagate vertically through the caprock seal. Steam escapes into shallow formations, collapsing reservoir chamber containment and causing irreversible steam thiefing.`
                : `Thermal front expands radially to 48 meters. Bitumen viscosity plummets from 45,000 cP to 85 cP (-99.8%), unlocking heavy oil mobility.`}
            </p>
            <div className={`p-2 rounded border space-y-1 text-[11px] ${isUnsafe ? 'bg-rose-950/80 border-rose-500/80 text-rose-200' : 'bg-slate-950/80 border-slate-800/80'}`}>
              <div className="flex justify-between">
                <span className={isUnsafe ? 'text-rose-300' : 'text-slate-500'}>Caprock Barrier:</span>
                <span className={`font-bold ${isUnsafe ? 'text-rose-400 font-extrabold animate-pulse' : 'text-rose-400'}`}>
                  {isUnsafe ? 'SHEARED / FRACTURED' : `${simSummary.predictedReservoirTemp} °C`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={isUnsafe ? 'text-rose-300' : 'text-slate-500'}>Pore Pressure Surge:</span>
                <span className={`font-bold ${isUnsafe ? 'text-rose-400' : 'text-amber-300'}`}>{simSummary.predictedReservoirPressure} bar</span>
              </div>
              <div className="flex justify-between">
                <span className={isUnsafe ? 'text-rose-300' : 'text-slate-500'}>Reservoir Containment:</span>
                <span className={`font-bold ${isUnsafe ? 'text-rose-400 uppercase font-extrabold' : 'text-emerald-400'}`}>
                  {isUnsafe ? 'COMPROMISED (ZERO)' : 'STABLE'}
                </span>
              </div>
            </div>
          </div>

          {/* Stage 5: Inflow & Artificial Lift */}
          <div
            className={`petro-card p-4 border rounded-xl space-y-3 transition-all ${
              isUnsafe ? 'border-amber-500/40 bg-amber-950/15' : activePhase === 4 ? 'border-emerald-500/60 bg-emerald-950/20' : 'border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">5</span>
                Producer PW-01 & Beam Pump (SRP-01)
              </span>
              <span className="text-[10px] text-amber-400 uppercase font-bold">
                {isUnsafe ? 'Steam Breakthrough' : 'Production Surge'}
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {isUnsafe
                ? `Premature steam breakthrough risks blistering downhole pump valve elastomer seals, introducing scalding live steam into the producer and risking pump gas-locking.`
                : `Post-soak drawdown yields an expected ${simSummary.expectedProduction} BPD (+215 BPD uplift over cold baseline). Sucker rod pump lifts fluid column smoothly.`}
            </p>
            <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Expected Inflow:</span>
                <span className="text-amber-400 font-bold">{simSummary.expectedProduction} BPD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Downhole Valve Health:</span>
                <span className={`font-bold ${isUnsafe ? 'text-amber-400' : 'text-white'}`}>
                  {isUnsafe ? 'THERMAL BLISTER WARNING' : '18,400 lbs (Safe)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gas-Lock Risk:</span>
                <span className={`font-bold ${isUnsafe ? 'text-amber-400' : 'text-cyan-300'}`}>
                  {isUnsafe ? 'HIGH (Vapor Influx)' : 'LOW (92.4% Fillage)'}
                </span>
              </div>
            </div>
          </div>

          {/* Stage 6: Surface Gathering & Storage */}
          <div
            className={`petro-card p-4 border rounded-xl space-y-3 transition-all ${
              isUnsafe ? 'border-slate-800' : activePhase === 4 ? 'border-emerald-500/60 bg-emerald-950/20' : 'border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">6</span>
                Gathering & Storage (PS-01 / ST-01)
              </span>
              <span className="text-[10px] text-cyan-400 uppercase font-bold">Field Gathering</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {isUnsafe
                ? `Emergency high-pressure relief valves on the gathering header trip to vent runaway thermal vapor. Storage tank fill proceeds with high vapor recovery unit loading.`
                : `Emulsion velocity stabilizes at 1.42 m/s. Tank ST-01 accumulates heavy crude smoothly over the extraction cycle.`}
            </p>
            <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Relief Valve Status:</span>
                <span className={`font-bold ${isUnsafe ? 'text-amber-400' : 'text-white'}`}>
                  {isUnsafe ? 'ARMED / VENT READY' : '1.42 m/s'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Booster Power:</span>
                <span className="text-cyan-300 font-bold">38.5 kW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Safety Interlock:</span>
                <span className={`font-bold ${isUnsafe ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isUnsafe ? 'INTERLOCK ACTIVE (BLOCKED)' : 'NORMAL'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COMPARATIVE FIELD DELTA MATRIX (Current Baseline vs Digital Twin Simulated) */}
      <div
        className={`petro-card p-5 rounded-2xl space-y-4 border ${
          isUnsafe ? 'border-rose-500/50 bg-rose-950/10' : 'border-slate-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3
              className={`text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 ${
                isUnsafe ? 'text-rose-400' : 'text-white'
              }`}
            >
              <Activity className={`w-4 h-4 ${isUnsafe ? 'text-rose-400' : 'text-cyan-400'}`} />
              Field-Wide Performance Variance Matrix: Baseline vs Digital Twin Response
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Quantitative impact evaluation across thermal, geomechanical, and artificial lift subsystems.
            </p>
          </div>
          <span className={`text-xs font-mono font-bold ${isUnsafe ? 'text-rose-400' : 'text-cyan-400'}`}>
            {isUnsafe ? '⛔ SIMULATION REJECTED' : 'Validated via AI Risk Engine'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
                <th className="pb-2">Subsystem & Metric</th>
                <th className="pb-2">Current Physical Baseline</th>
                <th className="pb-2 text-cyan-400">Simulated Digital Twin</th>
                <th className={`pb-2 ${isUnsafe ? 'text-rose-400' : 'text-emerald-400'}`}>Expected Variance (Δ)</th>
                <th className="pb-2">Containment / Safety Margin</th>
                <th className="pb-2 text-right">Engineering Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {/* Overpressure Row */}
              <tr className={isUnsafe ? 'bg-rose-950/30' : ''}>
                <td className="py-2.5 font-bold text-white flex items-center gap-1.5">
                  {isUnsafe && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                  Formation Injection Pressure ({targetWell})
                </td>
                <td className="py-2.5 text-slate-400">45.0 bar</td>
                <td className={`py-2.5 font-bold ${isUnsafe ? 'text-rose-400' : 'text-cyan-300'}`}>
                  {metrics.steamPressure} bar
                </td>
                <td className={`py-2.5 font-bold ${isUnsafe ? 'text-rose-400 animate-pulse' : 'text-cyan-300'}`}>
                  +{ (metrics.steamPressure - 45).toFixed(1) } bar ({isUnsafe ? 'DANGEROUS' : 'SURGE'})
                </td>
                <td className={`py-2.5 font-bold ${isUnsafe ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isUnsafe ? `⛔ -${pressureExceedance.toFixed(1)} bar EXCEEDED (Limit: 94b)` : '+8.0 bar below 94 bar limit'}
                </td>
                <td className="py-2.5 text-right">
                  <StatusBadge status={isUnsafe ? 'CRITICAL' : 'SAFE'} size="sm" />
                </td>
              </tr>

              {/* Caprock Integrity Row */}
              <tr className={isUnsafe ? 'bg-rose-950/30' : ''}>
                <td className="py-2.5 font-bold text-white flex items-center gap-1.5">
                  {isUnsafe && <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />}
                  Caprock Geological Seal Integrity
                </td>
                <td className="py-2.5 text-emerald-400 font-bold">100% Intact Barrier</td>
                <td className={`py-2.5 font-bold ${isUnsafe ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isUnsafe ? 'SHEARED / FRACTURED' : '100% Intact Barrier'}
                </td>
                <td className={`py-2.5 font-bold ${isUnsafe ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`}>
                  {isUnsafe ? 'COMPLETE SEAL LOSS (-100%)' : '0% Variance'}
                </td>
                <td className={`py-2.5 ${isUnsafe ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                  {isUnsafe ? 'Steam blowout & thiefing risk' : 'Hydrocarbon containment secure'}
                </td>
                <td className="py-2.5 text-right">
                  <StatusBadge status={isUnsafe ? 'CRITICAL' : 'SAFE'} size="sm" />
                </td>
              </tr>

              <tr>
                <td className="py-2.5 font-bold text-white">Reservoir Temperature (R-01)</td>
                <td className="py-2.5 text-slate-400">52.0 °C (Cold)</td>
                <td className="py-2.5 text-rose-300 font-bold">{simSummary.predictedReservoirTemp} °C</td>
                <td className="py-2.5 text-emerald-400 font-bold">+{ (simSummary.predictedReservoirTemp - 52).toFixed(1) } °C</td>
                <td className="py-2.5 text-slate-400">Thermal penetration ~48m</td>
                <td className="py-2.5 text-right"><StatusBadge status="SAFE" size="sm" /></td>
              </tr>

              <tr>
                <td className="py-2.5 font-bold text-white">Surface Transit Heat Loss</td>
                <td className="py-2.5 text-slate-400">4.8% (Mild Weather)</td>
                <td className={`py-2.5 font-bold ${metrics.windSpeed > 50 ? 'text-rose-400' : 'text-amber-300'}`}>
                  {simSummary.estimatedHeatLoss}%
                </td>
                <td className={`py-2.5 font-bold ${metrics.windSpeed > 50 ? 'text-rose-400' : 'text-amber-300'}`}>
                  +{(simSummary.estimatedHeatLoss - 4.8).toFixed(1)}% due to {metrics.windSpeed} km/h wind
                </td>
                <td className="py-2.5 text-slate-400">ASME B31.3 Stress: {simSummary.pipelineStress} MPa</td>
                <td className="py-2.5 text-right">
                  <StatusBadge status={metrics.windSpeed > 50 ? 'WARNING' : 'SAFE'} size="sm" />
                </td>
              </tr>

              <tr>
                <td className="py-2.5 font-bold text-white">Digital Twin AI Decision</td>
                <td className="py-2.5 text-slate-400">Monitoring Active</td>
                <td className={`py-2.5 font-extrabold ${isUnsafe ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isUnsafe ? 'EXECUTION REJECTED' : 'APPROVED FOR STAGING'}
                </td>
                <td className={`py-2.5 font-bold ${isUnsafe ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {isUnsafe ? '⛔ SAFETY INTERLOCK BLOCKS ACTION' : '✓ SAFE PROTOCOL'}
                </td>
                <td className={`py-2.5 ${isUnsafe ? 'text-rose-300' : 'text-slate-400'}`}>
                  {isUnsafe ? 'Requires engineer parameter revision' : 'Audit trail cryptographic log'}
                </td>
                <td className="py-2.5 text-right">
                  <StatusBadge status={isUnsafe ? 'CRITICAL' : 'SAFE'} size="sm" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  ) : (
    <>
      {/* LIVE BASELINE MODE: Closed-Loop Physical Subsystems (6 Cards) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold font-mono uppercase tracking-wider flex items-center gap-2 text-white">
              <Layers className="w-4 h-4 text-cyan-400" />
              Physical Field Closed-Loop Assets &amp; Real-World Subsystems
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Continuous operational telemetry across surface steam facilities, downhole injection, reservoir, and artificial lift.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300">FIELD STATUS:</span>
            <span className="text-emerald-400 font-bold">NOMINAL (89.6% HEALTH)</span>
          </div>
        </div>

        {/* 6 Real-World Physical Subsystem Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
          {/* Subsystem 1: SG-01 OTSG Boiler */}
          <div className="petro-card p-4 border border-slate-800 rounded-xl space-y-3 hover:border-cyan-500/40 transition-all">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">1</span>
                OTSG Steam Generator (SG-01)
              </span>
              <span className="text-[10px] text-cyan-400 uppercase font-bold">Continuous Firing</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Once-Through Steam Generator running at steady 45.0 t/hr @ 86.1 bar delivery. Natural gas combustion ratio 10.2:1 with economizer flue gas heat recovery at 92.4% thermal efficiency.
            </p>
            <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Thermal Output:</span>
                <span className="text-white font-bold">34.2 MW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Boiler Tube Stress:</span>
                <span className="text-emerald-400 font-bold">NOMINAL (42% MOP)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Burner Status:</span>
                <span className="text-cyan-300 font-bold">MODULATING (78% LOAD)</span>
              </div>
            </div>
          </div>

          {/* Subsystem 2: Surface Distribution Pipelines */}
          <div className="petro-card p-4 border border-slate-800 rounded-xl space-y-3 hover:border-cyan-500/40 transition-all">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">2</span>
                Surface Distribution Lines (SP-01 / SP-02)
              </span>
              <span className="text-[10px] text-emerald-400 uppercase font-bold">Normal Transit</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Insulated high-pressure steam distribution network spanning 1.4 km between central facility and well pads. Real-time temperature sensors report 4.8% convective loss under current 21 km/h wind.
            </p>
            <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Line Pressure:</span>
                <span className="text-white font-bold">86.1 bar</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ASME B31.3 Hoop Stress:</span>
                <span className="text-emerald-400 font-bold">48.2 MPa (&lt; 220 MPa Limit)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Insulation Integrity:</span>
                <span className="text-cyan-300 font-bold">INTACT (98.2% EFFICIENCY)</span>
              </div>
            </div>
          </div>

          {/* Subsystem 3: Cyclic Injection Wellhead */}
          <div className="petro-card p-4 border border-slate-800 rounded-xl space-y-3 hover:border-cyan-500/40 transition-all">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">3</span>
                Injection Wellheads (IW-01 &amp; IW-02)
              </span>
              <span className="text-[10px] text-emerald-400 uppercase font-bold">Controlled Injection</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Wellheads operating under closed choke control. Injection pressure of 45.0 bar provides +49.0 bar geological safety margin below formation breakdown ceiling (94.0 bar). Annulus barrier verified.
            </p>
            <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Fracture Safety Margin:</span>
                <span className="text-emerald-400 font-bold">+49.0 bar (SAFE MARGIN)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Formation Breakdown Ceiling:</span>
                <span className="text-slate-300 font-bold">94.0 bar</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Casing Integrity:</span>
                <span className="text-emerald-400 font-bold">100% INTACT / VERIFIED</span>
              </div>
            </div>
          </div>

          {/* Subsystem 4: Geological Reservoir Zone R-01 */}
          <div className="petro-card p-4 border border-slate-800 rounded-xl space-y-3 hover:border-cyan-500/40 transition-all">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">4</span>
                Reservoir Matrix (Zone R-01 Deep Sand)
              </span>
              <span className="text-[10px] text-emerald-400 uppercase font-bold">Stable Containment</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Native formation temperature at 52.0°C. Subsurface micro-seismic sensors confirm 100% intact caprock barrier integrity with zero steam thiefing or out-of-zone hydraulic migration.
            </p>
            <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Caprock Barrier:</span>
                <span className="text-emerald-400 font-bold">100% INTACT BARRIER</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pore Pressure:</span>
                <span className="text-amber-300 font-bold">42.4 bar</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Reservoir Containment:</span>
                <span className="text-emerald-400 font-bold">SECURE / STABLE</span>
              </div>
            </div>
          </div>

          {/* Subsystem 5: Production Well & Beam Pump */}
          <div className="petro-card p-4 border border-slate-800 rounded-xl space-y-3 hover:border-cyan-500/40 transition-all">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">5</span>
                Production Well &amp; SRP (PW-01 / SRP-01)
              </span>
              <span className="text-[10px] text-amber-400 uppercase font-bold">Artificial Lift Active</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Sucker rod pump SRP-01 extracting mobilized crude at 7.2 SPM with 92.4% pump fillage. Polish rod peak load is 18,400 lbs (well below API rod fatigue limit). Total producer flow 280 BPD.
            </p>
            <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Current Inflow:</span>
                <span className="text-amber-400 font-bold">280 BPD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Downhole Valve Health:</span>
                <span className="text-white font-bold">18,400 lbs (Safe)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gas-Lock Risk:</span>
                <span className="text-cyan-300 font-bold">NONE (92.4% Fillage)</span>
              </div>
            </div>
          </div>

          {/* Subsystem 6: Field Gathering & Terminal Storage */}
          <div className="petro-card p-4 border border-slate-800 rounded-xl space-y-3 hover:border-cyan-500/40 transition-all">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[10px]">6</span>
                Gathering &amp; Storage (PS-01 / ST-01)
              </span>
              <span className="text-[10px] text-cyan-400 uppercase font-bold">Field Gathering</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Gathering pipeline OP-01 emulsion velocity is 1.15 m/s. Booster pump station PS-01 operates at 38.5 kW. Storage tank ST-01 fill level is at 68.4% capacity (12,400 bbl available storage buffer).
            </p>
            <div className="p-2 rounded bg-slate-950/80 border border-slate-800/80 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Relief Valve Status:</span>
                <span className="text-emerald-400 font-bold">CLOSED / ARMED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Booster Power:</span>
                <span className="text-cyan-300 font-bold">38.5 kW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Storage Tank Fill:</span>
                <span className="text-white font-bold">68.4% (12,400 bbl BUFFER)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LIVE PHYSICAL TELEMETRY & SAFE OPERATING ENVELOPE MATRIX */}
      <div className="petro-card p-5 rounded-2xl space-y-4 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 text-white">
              <Activity className="w-4 h-4 text-cyan-400" />
              Live Physical Telemetry &amp; Safe Operating Envelope Matrix
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Real-time field instrumentation readings compared against safe engineering alarm limits.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            SCADA SYNCHRONIZED • ALL SYSTEMS NOMINAL
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-wider">
                <th className="pb-2">Subsystem &amp; Physical Asset</th>
                <th className="pb-2 text-cyan-400">Measured Telemetry</th>
                <th className="pb-2">Normal Operating Range</th>
                <th className="pb-2">Safety Alarm Threshold</th>
                <th className="pb-2 text-emerald-400">Containment Margin</th>
                <th className="pb-2 text-right">Telemetry Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-2.5 font-bold text-white">Steam Header Pressure (SG-01)</td>
                <td className="py-2.5 text-cyan-300 font-bold">86.1 bar</td>
                <td className="py-2.5 text-slate-400">80.0 – 90.0 bar</td>
                <td className="py-2.5 text-slate-400">95.0 bar High Alarm</td>
                <td className="py-2.5 text-emerald-400 font-bold">+8.9 bar Margin</td>
                <td className="py-2.5 text-right"><StatusBadge status="SAFE" size="sm" /></td>
              </tr>

              <tr>
                <td className="py-2.5 font-bold text-white">Surface Transit Temperature (SP-01)</td>
                <td className="py-2.5 text-cyan-300 font-bold">273.4 °C</td>
                <td className="py-2.5 text-slate-400">260.0 – 290.0 °C</td>
                <td className="py-2.5 text-slate-400">315.0 °C Thermal Ceiling</td>
                <td className="py-2.5 text-emerald-400 font-bold">+41.6 °C Margin</td>
                <td className="py-2.5 text-right"><StatusBadge status="SAFE" size="sm" /></td>
              </tr>

              <tr>
                <td className="py-2.5 font-bold text-white">Formation Injection Pressure (IW-01/02)</td>
                <td className="py-2.5 text-cyan-300 font-bold">45.0 bar</td>
                <td className="py-2.5 text-slate-400">40.0 – 75.0 bar</td>
                <td className="py-2.5 text-slate-400">94.0 bar Fracture Ceiling</td>
                <td className="py-2.5 text-emerald-400 font-bold">+49.0 bar Safe Margin</td>
                <td className="py-2.5 text-right"><StatusBadge status="SAFE" size="sm" /></td>
              </tr>

              <tr>
                <td className="py-2.5 font-bold text-white">Caprock Geological Seal Barrier</td>
                <td className="py-2.5 text-emerald-400 font-bold">100% Intact</td>
                <td className="py-2.5 text-slate-400">100% Sealed Barrier</td>
                <td className="py-2.5 text-slate-400">Shear Displacement Event</td>
                <td className="py-2.5 text-emerald-400 font-bold">Zero Degradation</td>
                <td className="py-2.5 text-right"><StatusBadge status="SAFE" size="sm" /></td>
              </tr>

              <tr>
                <td className="py-2.5 font-bold text-white">Reservoir Matrix Temperature (R-01)</td>
                <td className="py-2.5 text-slate-300 font-bold">52.0 °C</td>
                <td className="py-2.5 text-slate-400">45.0 – 65.0 °C (Cold)</td>
                <td className="py-2.5 text-slate-400">220.0 °C Steam Front</td>
                <td className="py-2.5 text-emerald-400 font-bold">Stable In-Situ Heat</td>
                <td className="py-2.5 text-right"><StatusBadge status="SAFE" size="sm" /></td>
              </tr>

              <tr>
                <td className="py-2.5 font-bold text-white">Field Oil Production Rate (PW-01 / Field)</td>
                <td className="py-2.5 text-amber-300 font-bold">4,820 BPD</td>
                <td className="py-2.5 text-slate-400">4,500 – 5,200 BPD</td>
                <td className="py-2.5 text-slate-400">4,000 BPD Low Production</td>
                <td className="py-2.5 text-emerald-400 font-bold">+320 BPD above quota</td>
                <td className="py-2.5 text-right"><StatusBadge status="SAFE" size="sm" /></td>
              </tr>

              <tr>
                <td className="py-2.5 font-bold text-white">Beam Pump Sucker Rod Peak Load (SRP-01)</td>
                <td className="py-2.5 text-cyan-300 font-bold">18,400 lbs</td>
                <td className="py-2.5 text-slate-400">14,000 – 22,000 lbs</td>
                <td className="py-2.5 text-slate-400">26,000 lbs Fatigue Rating</td>
                <td className="py-2.5 text-emerald-400 font-bold">+7,600 lbs Rating Buffer</td>
                <td className="py-2.5 text-right"><StatusBadge status="SAFE" size="sm" /></td>
              </tr>

              <tr>
                <td className="py-2.5 font-bold text-white">Field Terminal Storage Tank Level (ST-01)</td>
                <td className="py-2.5 text-cyan-300 font-bold">68.4% (26,800 bbl)</td>
                <td className="py-2.5 text-slate-400">20.0% – 85.0% Fill</td>
                <td className="py-2.5 text-slate-400">90.0% High Liquid Alarm</td>
                <td className="py-2.5 text-emerald-400 font-bold">+21.6% Headspace</td>
                <td className="py-2.5 text-right"><StatusBadge status="SAFE" size="sm" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  )}

      {/* QUICK ASSET SELECTOR CARDS */}
      <div>
        <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider mb-3">
          Field Asset Telemetry & Node Inspection
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {['SG-01', 'SP-01', 'SP-02', 'IW-01', 'IW-02', 'PW-01'].map((tag) => {
            const assetData = assets[tag];
            const isTarget = tag === targetWell && isSimulatedMode;
            const isWarning = assetData?.status === 'WARNING' || (isTarget && isUnsafe);
            return (
              <button
                key={tag}
                onClick={() => handleAssetClick(tag)}
                className={`p-3 rounded-xl petro-card text-left transition-all border ${
                  isTarget && isUnsafe
                    ? 'border-rose-500 bg-rose-950/30 animate-pulse'
                    : isWarning
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : 'border-slate-800 hover:border-cyan-500/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-mono font-bold text-xs ${isTarget && isUnsafe ? 'text-rose-400' : 'text-white'}`}>
                    {tag} {isTarget && isUnsafe && '🚨'}
                  </span>
                  <StatusBadge status={isTarget && isUnsafe ? 'CRITICAL' : assetData?.status || 'NORMAL'} size="sm" showIcon={false} />
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {isTarget && isUnsafe ? (
                    <span className="text-rose-400 font-bold">OVERPRESSURE</span>
                  ) : (
                    <>Health: <span className="text-cyan-400 font-semibold">{assetData?.healthScore || 90}%</span></>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 truncate">
                  {tag.startsWith('SP') ? 'Steam Pipeline' : tag.startsWith('IW') ? 'Injection Well' : tag.startsWith('PW') ? 'Producer' : tag.startsWith('SRP') ? 'Beam Pump' : 'OTSG Boiler'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* FOOTER DISCLAIMER */}
      <DisclaimerBanner type="global" />
    </div>
  );
};
