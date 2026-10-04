import React from 'react';
import { Database, Server, Monitor, Radio, ShieldCheck, Terminal, Cpu, GitBranch } from 'lucide-react';
import { Link } from 'react-router-dom';

export const TechnologyPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
          STACK & INTEGRATION
        </span>
        <h1 className="text-4xl font-extrabold text-white">Full-Stack Technology Architecture</h1>
        <p className="text-slate-300 text-base leading-relaxed">
          Built with an enterprise-grade TypeScript stack designed for real-time WebSocket telemetry, relational state persistence in PostgreSQL, and responsive industrial visualization.
        </p>
      </div>

      {/* Tech Stack Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="petro-card p-6 border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Frontend Layer</h3>
              <span className="text-[10px] font-mono text-cyan-400">React 18 + Vite + Tailwind CSS</span>
            </div>
          </div>
          <ul className="text-xs text-slate-400 space-y-2 font-mono">
            <li>• Recharts interactive data visualization</li>
            <li>• Lucide React industrial iconography</li>
            <li>• Socket.IO Client for real-time telemetry</li>
            <li>• Context API + React Router v7 navigation</li>
            <li>• Industrial dark glassmorphic control room</li>
          </ul>
        </div>

        <div className="petro-card p-6 border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Backend Engine</h3>
              <span className="text-[10px] font-mono text-emerald-400">Node.js + Express + TypeScript</span>
            </div>
          </div>
          <ul className="text-xs text-slate-400 space-y-2 font-mono">
            <li>• Modular Digital Twin physics simulation modules</li>
            <li>• JWT auth + bcrypt password hashing</li>
            <li>• Socket.IO WebSocket broadcast engine</li>
            <li>• Background sensor simulator (3.5s cycle)</li>
            <li>• Role-Based Access Control (RBAC)</li>
          </ul>
        </div>

        <div className="petro-card p-6 border-slate-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Persistence & ORM</h3>
              <span className="text-[10px] font-mono text-cyan-400">PostgreSQL 18 + Prisma ORM</span>
            </div>
          </div>
          <ul className="text-xs text-slate-400 space-y-2 font-mono">
            <li>• Relational schema: Assets, Sensors, Readings</li>
            <li>• Simulations, Scenarios, and Audit Logs</li>
            <li>• Composite indexes for high-throughput queries</li>
            <li>• Database seed script for Baghewala Field</li>
            <li>• ACID transaction integrity for approvals</li>
          </ul>
        </div>
      </div>

      {/* Physics & Engineering Formulas Section */}
      <div className="petro-card p-8 border-slate-800 space-y-6">
        <h2 className="text-xl font-bold text-white font-mono uppercase tracking-wider">
          Physics-Informed Simulation Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="font-mono font-bold text-cyan-400 text-sm">1. Marx-Langenheim Thermal Diffusion</span>
            <p className="text-slate-400 leading-relaxed font-mono">
              R_thermal = sqrt(Q_steam * f_enthalpy / (rho_rock * C_p * deltaT))
            </p>
            <p className="text-[11px] text-slate-400">
              Calculates the effective heating radius and near-wellbore reservoir temperature rise during cyclic steam injection.
            </p>
          </div>

          <div className="petro-card p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="font-mono font-bold text-cyan-400 text-sm">2. Arrhenius Viscosity Reduction</span>
            <p className="text-slate-400 leading-relaxed font-mono">
              mu(T) = mu_0 * exp(b / T_reservoir)
            </p>
            <p className="text-[11px] text-slate-400">
              Models the exponential collapse of Baghewala heavy crude viscosity from 12,000 cP at 52°C down to 18 cP at 200°C.
            </p>
          </div>

          <div className="petro-card p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="font-mono font-bold text-cyan-400 text-sm">3. Darcy-Weisbach & Barlow Hoop Stress</span>
            <p className="text-slate-400 leading-relaxed font-mono">
              Delta_P = f * (L/D) * (rho * v^2 / 2) | S_hoop = (P * D) / (2 * t)
            </p>
            <p className="text-[11px] text-slate-400">
              Determines hydraulic line friction, pressure differential drops, and ASME B31.3 allowable stress margins on steam transit lines.
            </p>
          </div>

          <div className="petro-card p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <span className="font-mono font-bold text-cyan-400 text-sm">4. Mills SRP Kinematics & Rod Loading</span>
            <p className="text-slate-400 leading-relaxed font-mono">
              PPRL = W_rod * (1 + (SPM^2 * S) / 70500) + W_fluid
            </p>
            <p className="text-[11px] text-slate-400">
              Predicts peak polished rod loads, motor electrical current, and detects mechanical degradation from excessive vibration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
