import React, { useState } from 'react';
import {
  Flame,
  Droplet,
  Zap,
  CloudSun,
  Activity,
  Layers,
  ArrowRight,
  TrendingDown,
  Info,
  CheckCircle2,
  Wind
} from 'lucide-react';
import { KpiCard } from '../../components/KpiCard';
import { StatusBadge } from '../../components/StatusBadge';
import { useSocket } from '../../context/SocketContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const SteamPage: React.FC = () => {
  const { liveState } = useSocket();

  // Weather-Adaptive Steam Analysis interactive inputs
  const [ambientTemp, setAmbientTemp] = useState(34);
  const [humidity, setHumidity] = useState(38);
  const [windSpeed, setWindSpeed] = useState(22);
  const [rainfall, setRainfall] = useState(0);

  const sgData = liveState?.assets['SG-01']?.telemetry || {
    pressure: 88.0,
    temperature: 289.0,
    flow: 5.0,
    steamQuality: 82.0,
    efficiency: 88.5,
  };

  // Weather impact calculation
  const windFactor = Math.max(0, (windSpeed - 12) * 0.14);
  const deltaT = 289 - ambientTemp;
  const estimatedHeatLoss = parseFloat((3.8 + (deltaT / 250) * 1.5 + windFactor + rainfall * 0.5).toFixed(1));
  const impactLevel = estimatedHeatLoss > 7.5 ? 'HIGH' : estimatedHeatLoss > 5.2 ? 'MODERATE' : 'LOW';

  // Network stage losses breakdown
  const stages = [
    { stage: 'Once-Through Boiler SG-01', enthalpy: '2,790 kJ/kg', pressure: `${sgData.pressure} bar`, loss: '0.0% (Generation Baseline)' },
    { stage: 'Main Transit Header SP-01', enthalpy: '2,680 kJ/kg', pressure: '86.1 bar', loss: `${estimatedHeatLoss}% (Convective & Radiative)` },
    { stage: 'Wellhead Choke IW-01', enthalpy: '2,610 kJ/kg', pressure: '84.0 bar', loss: '2.5% (Wellhead Joule-Thomson Drop)' },
    { stage: 'Bottomhole Perforations', enthalpy: '2,480 kJ/kg', pressure: '79.2 bar', loss: '4.8% (Casing Wellbore Heat Loss)' },
    { stage: 'Reservoir Sand Matrix R-01', enthalpy: 'Delivered Heat', pressure: '72.8 bar', loss: 'Net Thermal Radius: ~48m' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">Steam Intelligence & Distribution</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono">
              THERMAL BALANCE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            OTSG Steam Generation • Quality Tracking • Transmission Losses • Weather Convection
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge status="SAFE" size="md" />
        </div>
      </div>

      {/* Steam KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="petro-card p-3 border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono uppercase">Steam Pressure</span>
          <div className="text-lg font-bold font-mono text-cyan-300 mt-0.5">{sgData.pressure} bar</div>
          <span className="text-[10px] text-slate-500 font-mono">OTSG Discharge</span>
        </div>
        <div className="petro-card p-3 border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono uppercase">Steam Temperature</span>
          <div className="text-lg font-bold font-mono text-cyan-300 mt-0.5">{sgData.temperature} °C</div>
          <span className="text-[10px] text-slate-500 font-mono">Saturated Vapor</span>
        </div>
        <div className="petro-card p-3 border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono uppercase">Mass Flow Rate</span>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">{sgData.flow} t/hr</div>
          <span className="text-[10px] text-slate-500 font-mono">Continuous delivery</span>
        </div>
        <div className="petro-card p-3 border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono uppercase">Steam Quality</span>
          <div className="text-lg font-bold font-mono text-cyan-300 mt-0.5">82.0%</div>
          <span className="text-[10px] text-emerald-400 font-mono">Optimal dryness</span>
        </div>
        <div className="petro-card p-3 border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono uppercase">Boiler Efficiency</span>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">88.5%</div>
          <span className="text-[10px] text-slate-500 font-mono">Natural Gas OTSG</span>
        </div>
        <div className="petro-card p-3 border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono uppercase">Steam-to-Oil Ratio</span>
          <div className="text-lg font-bold font-mono text-amber-300 mt-0.5">2.45</div>
          <span className="text-[10px] text-slate-500 font-mono">Field SOR average</span>
        </div>
      </div>

      {/* STEAM FLOW THROUGH NETWORK & STAGE LOSSES */}
      <div className="petro-card p-5 border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Network Stage Loss Cascade (Generator → Pipeline → Wellhead → Reservoir)
          </span>
          <span className="text-[10px] text-cyan-400 font-mono">HEAT RETENTION EFFICIENCY</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {stages.map((st, i) => (
            <div key={st.stage} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 relative">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-cyan-300">STAGE 0{i + 1}</span>
                <span className="text-slate-500 font-bold">{st.pressure}</span>
              </div>
              <h4 className="text-xs font-bold text-white font-mono leading-tight">{st.stage}</h4>
              <div className="text-[11px] text-slate-400 font-mono">Enthalpy: {st.enthalpy}</div>
              <div className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-amber-400 font-mono border border-slate-800">
                {st.loss}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WEATHER-ADAPTIVE STEAM ANALYSIS (Required by Section 12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 petro-card p-5 border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <CloudSun className="w-4 h-4 text-cyan-400" />
              Weather-Adaptive Steam Analysis
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">
              IMPACT: {impactLevel}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Ambient Temperature (°C)</span>
                <span className="font-mono text-cyan-400 font-bold">{ambientTemp} °C</span>
              </div>
              <input
                type="range"
                min="10"
                max="48"
                value={ambientTemp}
                onChange={(e) => setAmbientTemp(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Wind Speed (km/h)</span>
                <span className="font-mono text-cyan-400 font-bold">{windSpeed} km/h</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={windSpeed}
                onChange={(e) => setWindSpeed(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300">Relative Humidity (%)</span>
                <span className="font-mono text-cyan-400 font-bold">{humidity} %</span>
              </div>
              <input
                type="range"
                min="15"
                max="95"
                value={humidity}
                onChange={(e) => setHumidity(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 petro-card p-5 border-slate-800 space-y-4">
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Decision-Support Analysis & Simulation Recommendations
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase">Estimated Surface Heat Loss:</span>
              <div className="text-xl font-bold text-amber-400 mt-0.5">{estimatedHeatLoss}%</div>
              <span className="text-[10px] text-slate-500">Normal calm loss: ~4.2%</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase">Suggested Simulation Range:</span>
              <div className="text-sm font-bold text-cyan-300 mt-1">85.0 – 87.5 bar</div>
              <span className="text-[10px] text-slate-500">Mass rate: 3.1 – 3.3 t/hr</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-2">
            <span className="font-mono text-amber-400 font-bold uppercase tracking-wider block">
              Operator Decision Recommendation:
            </span>
            <p className="leading-relaxed">
              “Higher wind conditions ({windSpeed} km/h) increase surface forced convection loss by ~{windFactor.toFixed(1)}%. Evaluate a modified injection strategy in the Digital Twin simulator before execution.”
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
