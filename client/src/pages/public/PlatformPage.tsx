import React from 'react';
import { Layers, ShieldCheck, Flame, Radio, Cpu, Network, CheckCircle2, Sliders } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PlatformPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
          SYSTEM ARCHITECTURE & VISION
        </span>
        <h1 className="text-4xl font-extrabold text-white">The PetroNexus 360 Platform</h1>
        <p className="text-slate-300 text-base leading-relaxed">
          PetroNexus 360 bridges the gap between physics-based reservoir simulation and daily physical field operations, empowering operators to test scenarios digitally before turning valves.
        </p>
      </div>

      {/* 5-Stage Methodology */}
      <div className="petro-card p-8 border-slate-800 space-y-6">
        <h2 className="text-xl font-bold text-white font-mono uppercase tracking-wider text-center">
          The 5-Stage Closed-Loop Operating Model
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 text-center">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-2xl font-black font-mono text-cyan-400">01</span>
            <h3 className="font-bold text-white text-sm">SIMULATE</h3>
            <p className="text-xs text-slate-400">Parameter entry: steam pressure, temperature, duration, and ambient meteorological factors.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-2xl font-black font-mono text-blue-400">02</span>
            <h3 className="font-bold text-white text-sm">PREDICT</h3>
            <p className="text-xs text-slate-400">Physics engines calculate heat front penetration, oil mobility, and pipeline hoop stresses.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-2xl font-black font-mono text-emerald-400">03</span>
            <h3 className="font-bold text-white text-sm">VALIDATE</h3>
            <p className="text-xs text-slate-400">System classifies scenario into GREEN, YELLOW, or RED with engineering justifications.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-2xl font-black font-mono text-amber-400">04</span>
            <h3 className="font-bold text-white text-sm">OPERATE</h3>
            <p className="text-xs text-slate-400">Human operators authorize simulated scenario with cryptographically hashed audit trails.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="text-2xl font-black font-mono text-rose-400">05</span>
            <h3 className="font-bold text-white text-sm">MONITOR</h3>
            <p className="text-xs text-slate-400">Real-time IoT sensors validate actual field telemetry against Digital Twin predicted curves.</p>
          </div>
        </div>
      </div>

      {/* Asset Hierarchy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="petro-card p-6 border-slate-800 space-y-3">
          <Flame className="w-8 h-8 text-cyan-400" />
          <h3 className="text-base font-bold text-white">Upstream Thermal Generation</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Models Once-Through Steam Generators (OTSG), fuel consumption efficiency, feedwater TDS treatment, and high-pressure steam distribution headers.
          </p>
        </div>

        <div className="petro-card p-6 border-slate-800 space-y-3">
          <Network className="w-8 h-8 text-blue-400" />
          <h3 className="text-base font-bold text-white">Gathering & Transit Network</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Evaluates heat loss rates across insulated 6-inch lines, differential pressure drops, fluid flow velocities, and pipeline expansion joint fatigue.
          </p>
        </div>

        <div className="petro-card p-6 border-slate-800 space-y-3">
          <Radio className="w-8 h-8 text-amber-400" />
          <h3 className="text-base font-bold text-white">Reservoir & Artificial Lift</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Tracks Cyclic Steam Stimulation (CSS) soak dissipation, heavy oil Arrhenius viscosity reduction, and Sucker Rod Pump (SRP) load cell dynamics.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center pt-8">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm"
        >
          <span>Launch Digital Twin Control Room</span>
          <CheckCircle2 className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
