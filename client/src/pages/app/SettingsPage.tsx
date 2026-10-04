import React, { useState } from 'react';
import { Settings, Zap, Radio, Bell, Shield, Database, Sliders } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

export const SettingsPage: React.FC = () => {
  const { liveState, toggleAnomaly } = useSocket();
  const [telemetryInterval, setTelemetryInterval] = useState('3.5s');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [autoAcknowledge, setAutoAcknowledge] = useState(false);

  const isAnomaly = liveState?.isAnomalyActive;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold text-white tracking-wide">System Settings & Calibration</h1>
        <p className="text-xs text-slate-400 mt-0.5 font-mono">
          Configure digital twin telemetry frequencies, presentation anomaly modes, and notification filters
        </p>
      </div>

      {/* Simulator Presentation Controls */}
      <div className="petro-card p-6 border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>Live Presentation & Prototype Anomaly Control</span>
        </div>
        <p className="text-xs text-slate-300">
          Toggle controlled field anomaly injection to demonstrate real-time alerts, risk updates, and digital twin changes to evaluators.
        </p>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-white font-mono">Simulated Pipeline & Pump Anomaly</div>
            <div className="text-[11px] text-slate-400">
              Gradually drops SP-02 pressure (88 bar ➔ 81 bar) and raises SRP-03 vibration (5.8 mm/s).
            </div>
          </div>
          <button
            onClick={() => toggleAnomaly(!isAnomaly)}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all ${
              isAnomaly
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {isAnomaly ? 'ANOMALY INJECTED (ACTIVE)' : 'ACTIVATE ANOMALY'}
          </button>
        </div>
      </div>

      {/* Telemetry Cycle */}
      <div className="petro-card p-6 border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase">
          <Radio className="w-4 h-4 text-cyan-400" />
          <span>Telemetry Polling Rate</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          {['2.0s (Fast)', '3.5s (Standard)', '5.0s (Conservative)'].map((rate) => (
            <button
              key={rate}
              onClick={() => setTelemetryInterval(rate)}
              className={`p-3 rounded-xl border text-center transition-all ${
                telemetryInterval === rate
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {rate}
            </button>
          ))}
        </div>
      </div>

      {/* Database & Environment Info */}
      <div className="petro-card p-6 border-slate-800 space-y-3 font-mono text-xs">
        <div className="text-cyan-400 font-bold uppercase flex items-center gap-2">
          <Database className="w-4 h-4" />
          <span>Connected Infrastructure Metadata</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-slate-300 pt-2 border-t border-slate-800">
          <div>PostgreSQL Database: <span className="text-white font-bold">petronexus360</span></div>
          <div>Database Schema: <span className="text-white font-bold">public (Prisma 6.4)</span></div>
          <div>Telemetry Engine: <span className="text-emerald-400 font-bold">Socket.IO Active</span></div>
          <div>Target Field: <span className="text-cyan-300 font-bold">Baghewala Heavy Oil Basin</span></div>
        </div>
      </div>
    </div>
  );
};
