import React from 'react';
import { Layers, ShieldCheck, Cpu, Terminal, GitBranch } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#051320] border-t border-slate-800 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <span className="font-bold text-white tracking-wide text-sm">PETRONEXUS 360</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Connected Digital Twin for Weather-Adaptive Steam Injection and Field-Wide Heavy Oil Operations.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-cyan-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              SIMULATE → PREDICT → VALIDATE → OPERATE
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-white font-semibold mb-3 tracking-wider uppercase text-[11px]">Platform</h4>
            <ul className="space-y-2">
              <li><Link to="/platform" className="hover:text-cyan-400 transition-colors">Digital Twin Philosophy</Link></li>
              <li><Link to="/features" className="hover:text-cyan-400 transition-colors">Core Features</Link></li>
              <li><Link to="/technology" className="hover:text-cyan-400 transition-colors">Simulation Architecture</Link></li>
              <li><Link to="/login" className="hover:text-cyan-400 transition-colors">Operator Login</Link></li>
            </ul>
          </div>

          {/* Digital Twin Modules */}
          <div>
            <h4 className="text-white font-semibold mb-3 tracking-wider uppercase text-[11px]">Subsystems</h4>
            <ul className="space-y-2">
              <li className="hover:text-cyan-400">Once-Through Steam Generators (OTSG)</li>
              <li className="hover:text-cyan-400">Cyclic Steam Stimulation (CSS)</li>
              <li className="hover:text-cyan-400">Beam Pumping Units & SRP Dynamics</li>
              <li className="hover:text-cyan-400">Thermal Gathering Pipeline Hydraulics</li>
            </ul>
          </div>

          {/* Prototype Notice */}
          <div>
            <h4 className="text-white font-semibold mb-3 tracking-wider uppercase text-[11px]">Engineering Disclaimer</h4>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              PetroNexus 360 is an intelligent decision-support and physics-informed simulation platform. It does not exert automatic physical supervisory control over field wellheads or boilers.
            </p>
            <div className="mt-3 p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[10px] text-slate-400">
              Demo Environment: Baghewala Basin Field R-01
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-slate-500 text-[11px]">
          <div>© 2026 PetroNexus 360. All rights reserved. Industrial Digital Twin Platform.</div>
          <div className="flex items-center gap-4 mt-2 sm:mt-0 font-mono">
            <span>V1.0.0-PROTOTYPE</span>
            <span>POSTGRESQL 18</span>
            <span>SOCKET.IO REAL-TIME</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
