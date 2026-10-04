import React from 'react';
import {
  Sliders,
  CloudSun,
  Radio,
  Network,
  ShieldAlert,
  Bot,
  FileBarChart,
  History,
  Activity,
  Layers,
  CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const FeaturesPage: React.FC = () => {
  const features = [
    {
      title: 'Interactive Field Digital Twin Topology',
      desc: 'Real-time interactive canvas showing flow from SG-01 OTSG through steam pipelines, injection wells, heavy oil reservoir, producers, SRP units, booster stations, to storage tanks with moving particles.',
      icon: Layers,
      badge: 'REAL-TIME SVG',
    },
    {
      title: 'Digital Twin Operation Simulator',
      desc: 'Multi-tab sandbox covering Steam Injection, Production Release, Soak Cycles, SRP dynamics, and OTSG firing. Generates GREEN/YELLOW/RED validation with full engineering recommendations.',
      icon: Sliders,
      badge: 'CORE ENGINE',
    },
    {
      title: 'Weather-Adaptive Steam Optimization',
      desc: 'Coupled aerodynamic convection engine that calculates real-time desert wind chill and surface thermal dissipation, advising optimal injection rates or schedule timing.',
      icon: CloudSun,
      badge: 'THERMODYNAMICS',
    },
    {
      title: 'What-If Scenario Comparison',
      desc: 'Compare multiple injection strategies side-by-side (e.g. 80 bar vs 86 bar vs 92 bar). Inspect trade-offs across predicted BPD, SOR, energy MWh, and caprock fracture margins.',
      icon: Activity,
      badge: 'DECISION-SUPPORT',
    },
    {
      title: 'Sucker Rod Pump & Station Dynamics',
      desc: 'Monitor polished rod loads, motor thermals, and gearbox vibration spectrum. Animated beam visualization dynamically flags early mechanical degradation.',
      icon: Radio,
      badge: 'MECHANICAL INTEGRITY',
    },
    {
      title: 'Pipeline Hydraulic & Leak Anomaly Detection',
      desc: 'Differential pressure (ΔP) monitoring detects line constrictions, closed isolation valves, or localized insulation breaches in real time.',
      icon: Network,
      badge: 'HYDRAULICS',
    },
    {
      title: 'Safety Risk Heatmap & HSE Center',
      desc: 'Field-wide risk matrix displaying equipment condition, root causes, failure consequences, and recommended inspection walkdowns.',
      icon: ShieldAlert,
      badge: 'SAFETY / HSE',
    },
    {
      title: 'AI Operations Copilot',
      desc: 'Context-aware industrial assistant answering queries on production decreases, steam losses, pump vibration risks, and simulation results.',
      icon: Bot,
      badge: 'COPILOT AI',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
          CAPABILITIES OVERVIEW
        </span>
        <h1 className="text-4xl font-extrabold text-white">Full-Spectrum Operational Features</h1>
        <p className="text-slate-300 text-base leading-relaxed">
          Explore the modular intelligence components built to maximize thermal recovery efficiency while maintaining strict asset integrity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((f) => (
          <div key={f.title} className="petro-card p-6 border-slate-800 space-y-4 hover:border-cyan-500/40 transition-all">
            <div className="flex items-center justify-between">
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <f.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                {f.badge}
              </span>
            </div>
            <h3 className="text-base font-bold text-white font-mono">{f.title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="petro-card-glow p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Test These Features in the Live Environment</h2>
        <p className="text-xs text-slate-300 max-w-xl mx-auto">
          Sign into the prototype control room to run real-time simulations, trigger anomalies, and query the operations copilot.
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm"
        >
          <span>Sign In as Operator</span>
        </Link>
      </div>
    </div>
  );
};
