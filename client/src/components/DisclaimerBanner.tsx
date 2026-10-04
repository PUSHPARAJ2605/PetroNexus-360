import React from 'react';
import { ShieldAlert, Info } from 'lucide-react';

interface DisclaimerBannerProps {
  type?: 'global' | 'simulation';
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ type = 'global' }) => {
  if (type === 'simulation') {
    return (
      <div className="bg-amber-950/30 border border-amber-500/30 rounded-lg p-3 px-4 flex items-center gap-3 text-xs text-amber-200/90 shadow-sm">
        <Info className="w-4 h-4 text-amber-400 shrink-0" />
        <div>
          <span className="font-semibold text-amber-300">Decision-Support Notice:</span> Simulation outputs are prototype estimates and require engineering validation before real-world physical authorization.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 border-b border-cyan-500/20 px-4 py-1.5 flex items-center justify-between text-[11px] text-slate-300">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span>
          <strong className="text-white">PetroNexus 360</strong> — Intelligent digital twin simulation and decision-support platform.
        </span>
      </div>
      <div className="hidden sm:flex items-center gap-3 text-[10px] text-slate-400 font-mono">
        <span className="inline-flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          DIGITAL TWIN SYNC: ACTIVE
        </span>
        <span>FIELD: BAGHEWALA-01</span>
      </div>
    </div>
  );
};
