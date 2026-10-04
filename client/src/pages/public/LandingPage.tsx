import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Activity,
  Flame,
  CloudSun,
  ShieldCheck,
  Cpu,
  Layers,
  CheckCircle2,
  Sliders,
  TrendingUp,
  AlertTriangle,
  Database,
  Radio,
  FileText
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="space-y-24 pb-20 overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-medium shadow-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            CONNECTED DIGITAL TWIN FOR HEAVY OIL OPERATIONS
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
            PETRONEXUS <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400">360</span>
          </h1>

          <p className="text-xl sm:text-2xl font-semibold text-cyan-300 font-mono">
            “Simulate. Predict. Validate. Operate.”
          </p>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl mx-auto">
            A field-wide intelligent Digital Twin platform that allows heavy-oil operators to simulate operational decisions before field execution while continuously monitoring wells, steam systems, pipelines, pump stations, and production infrastructure.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/platform"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-xl shadow-cyan-500/25 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <span>Explore Platform</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm flex items-center gap-2 transition-all"
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Operator Login</span>
            </Link>
          </div>
        </div>

        {/* ANIMATED FIELD ARCHITECTURE TOPOLOGY DIAGRAM */}
        <div className="mt-16 relative bg-[#09223D]/80 rounded-2xl border border-cyan-500/30 p-6 shadow-2xl backdrop-blur-md overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
                Field-Wide Closed-Loop Thermal Ecosystem
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span> High Enthalpy Steam
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span> Stimulated Heavy Crude
              </span>
            </div>
          </div>

          {/* Interactive Flow Nodes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3 text-center">
            {[
              { tag: 'SG-01', name: 'Steam Generator', type: 'steam', icon: Flame, desc: '88 bar @ 289°C' },
              { tag: 'SP-01', name: 'Steam Pipeline', type: 'steam', icon: Layers, desc: '450m insulated' },
              { tag: 'IW-01', name: 'Injection Well', type: 'steam', icon: Radio, desc: 'CSS Cycle #4' },
              { tag: 'R-01', name: 'Reservoir Zone', type: 'transition', icon: Database, desc: 'Viscosity drop' },
              { tag: 'PW-01', name: 'Production Well', type: 'oil', icon: TrendingUp, desc: '440 BPD post-soak' },
              { tag: 'SRP-01', name: 'Sucker Rod Pump', type: 'oil', icon: Activity, desc: '7.2 SPM lift' },
              { tag: 'OP-01', name: 'Oil Gathering Line', type: 'oil', icon: Layers, desc: '520m heated line' },
              { tag: 'PS-01', name: 'Pump Station', type: 'oil', icon: Cpu, desc: '45 bar booster' },
              { tag: 'ST-01', name: 'Storage Tank', type: 'oil', icon: CheckCircle2, desc: '68.4% fill @ 65°C' },
            ].map((node, i) => (
              <div
                key={node.tag}
                className="petro-card p-3 flex flex-col items-center justify-between border border-slate-800 hover:border-cyan-500/50 transition-all group"
              >
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 mb-2">
                  0{i + 1}
                </span>
                <div
                  className={`p-2 rounded-lg mb-2 ${
                    node.type === 'steam'
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : node.type === 'transition'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  <node.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-xs font-bold text-white font-mono">{node.tag}</span>
                <span className="text-[11px] text-slate-300 font-medium leading-tight mt-0.5">{node.name}</span>
                <span className="text-[9px] text-slate-500 font-mono mt-2 pt-1 border-t border-slate-800/60 w-full truncate">
                  {node.desc}
                </span>
              </div>
            ))}
          </div>

          {/* SVG Animated Particles Pipeline */}
          <div className="mt-4 px-2">
            <svg viewBox="0 0 1000 30" className="w-full h-8">
              {/* Steam Flow Line */}
              <line x1="20" y1="15" x2="420" y2="15" stroke="#06B6D4" strokeWidth="3" className="steam-flow-line" />
              {/* Reservoir Transition Zone */}
              <line x1="420" y1="15" x2="550" y2="15" stroke="#10B981" strokeWidth="4" strokeDasharray="3,3" />
              {/* Oil Flow Line */}
              <line x1="550" y1="15" x2="980" y2="15" stroke="#F59E0B" strokeWidth="3" className="oil-flow-line" />
            </svg>
          </div>
        </div>
      </section>

      {/* 2. THE PROBLEM */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-rose-400 text-xs font-mono font-semibold uppercase tracking-wider mb-2">
              <AlertTriangle className="w-4 h-4" /> Industrial Challenge
            </div>
            <h2 className="text-3xl font-extrabold text-white">
              The Reality of Thermal Heavy Oil Operations
            </h2>
            <p className="mt-4 text-slate-300 text-sm leading-relaxed">
              Heavy oil reservoirs (such as the Baghewala formation) possess extreme in-situ viscosities exceeding 10,000 cP. Cyclic Steam Stimulation (CSS) and continuous steam drive are critical for mobilization, but field execution faces severe vulnerabilities:
            </p>

            <ul className="mt-6 space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
                <span><strong>Severe Weather Thermal Losses:</strong> Desert wind and ambient swings dissipate up to 15% of steam enthalpy before reaching well perforations.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
                <span><strong>Caprock Fracture Risk:</strong> Blind steam pressure elevation can exceed formation breakdown thresholds, causing catastrophic caprock fracturing.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span>
                <span><strong>Premature Pump Mechanical Parting:</strong> High fluid temperatures and cyclical loading fatigue Sucker Rod Pump (SRP) strings without advance warning.</span>
              </li>
            </ul>
          </div>

          <div className="petro-card p-6 border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Historical Field Risks vs PetroNexus Mitigation</h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20">
                <span className="font-semibold text-rose-300 block mb-1">Traditional Method: Post-Facto Correction</span>
                <p className="text-slate-400">Operators adjust boiler steam pressure only after production falls or alarms trip. Irreversible heat loss and equipment wear already occur.</p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
                <span className="font-semibold text-emerald-300 block mb-1">PetroNexus 360: Pre-Operation Digital Twin Simulation</span>
                <p className="text-slate-400">Every pressure change, soak duration, and pump speed is simulated digitally first. Operators validate performance before committing real field assets.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW THE DIGITAL TWIN WORKS */}
      <section className="bg-slate-900/60 border-y border-slate-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-extrabold text-white">The Core Operating Philosophy</h2>
            <p className="text-sm text-cyan-400 font-mono mt-2">SIMULATE → PREDICT → VALIDATE → OPERATE → MONITOR</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { step: '01', title: 'SIMULATE', desc: 'Enter injection pressure, steam temperature, and flow rate into the Digital Twin.', color: 'from-blue-600 to-cyan-500' },
              { step: '02', title: 'PREDICT', desc: 'Model reservoir heat penetration, oil mobility, and pipeline hoop stresses.', color: 'from-cyan-500 to-teal-500' },
              { step: '03', title: 'VALIDATE', desc: 'Evaluate multi-variable safety risks (GREEN / YELLOW / RED) with clear justifications.', color: 'from-teal-500 to-emerald-500' },
              { step: '04', title: 'OPERATE', desc: 'Authorized human operators review and approve scenarios with audit log compliance.', color: 'from-emerald-500 to-amber-500' },
              { step: '05', title: 'MONITOR', desc: 'Continuously stream real-time IoT sensor telemetry and detect subtle mechanical anomalies.', color: 'from-amber-500 to-orange-500' },
            ].map((item) => (
              <div key={item.step} className="petro-card p-5 border-slate-800 relative group hover:border-cyan-500/40 transition-all">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} text-white font-mono font-bold text-xs flex items-center justify-center mb-3`}>
                  {item.step}
                </div>
                <h3 className="text-sm font-bold text-white font-mono mb-1">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. WEATHER-ADAPTIVE STEAM INTELLIGENCE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="petro-card p-6 border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-mono font-bold text-cyan-400">WEATHER-ADAPTIVE HEAT TRANSFER ENGINE</span>
              <CloudSun className="w-4 h-4 text-amber-400" />
            </div>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between p-2 rounded bg-slate-900/80">
                <span className="text-slate-400">Ambient Temperature:</span>
                <span className="text-white font-bold">34.2 °C</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-900/80">
                <span className="text-slate-400">Wind Velocity (Forced Convection):</span>
                <span className="text-cyan-300 font-bold">21.5 km/h NW</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-900/80">
                <span className="text-slate-400">Estimated Line Dissipation:</span>
                <span className="text-amber-400 font-bold">6.8% (+2.3% above still air)</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-900/80">
                <span className="text-slate-400">Recommended Mass Flow Mod:</span>
                <span className="text-emerald-400 font-bold">+0.25 t/hr compensation</span>
              </div>
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-wider mb-2">
              <CloudSun className="w-4 h-4" /> Thermodynamic Optimization
            </div>
            <h2 className="text-3xl font-extrabold text-white">Weather-Adaptive Steam Injection</h2>
            <p className="mt-4 text-slate-300 text-sm leading-relaxed">
              Steam injection does not operate in a laboratory vacuum. High desert wind speeds induce massive forced convective cooling along aboveground steam headers. PetroNexus 360 models ambient meteorological dynamics in real-time, providing decision-support recommendations to dynamically adjust mass flow or shift schedules to cooler night intervals.
            </p>
          </div>
        </div>
      </section>

      {/* 5. PREDICTIVE MAINTENANCE & AI COPILOT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="petro-card p-6 border-slate-800 space-y-3">
            <Cpu className="w-6 h-6 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Physics-Informed Digital Twin</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Simulate reservoir near-wellbore heating, fluid mobility improvements, and Darcy-Weisbach hydraulic pressure drops along 6-inch lines.
            </p>
          </div>

          <div className="petro-card p-6 border-slate-800 space-y-3">
            <Radio className="w-6 h-6 text-amber-400" />
            <h3 className="text-base font-bold text-white">SRP Vibration & Health Analytics</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Continuously monitor polished rod loads, motor current draws, and gearbox vibration spectrum to prevent catastrophic rod string parting.
            </p>
          </div>

          <div className="petro-card p-6 border-slate-800 space-y-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h3 className="text-base font-bold text-white">AI Operations Copilot</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Industrial operations assistant providing context-aware answers referencing live sensor telemetry, active alarms, and historical simulations.
            </p>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="petro-card-glow p-8 sm:p-12 text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Ready to Explore the Field Operations Digital Twin?
          </h2>
          <p className="text-sm text-slate-300 max-w-2xl mx-auto">
            Experience the full control room suite: real-time telemetry streaming, interactive pipeline topology, multi-scenario simulation engine, and predictive safety intelligence.
          </p>
          <div className="flex justify-center gap-4 pt-2">
            <Link
              to="/login"
              className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm shadow-lg shadow-cyan-500/25 flex items-center gap-2"
            >
              <span>Access Operator Control Room</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
