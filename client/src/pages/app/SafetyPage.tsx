import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Info,
  Activity,
  Layers,
  Search,
  Wrench,
  Radio,
  Network,
  Cpu
} from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
import { useSocket } from '../../context/SocketContext';

export const SafetyPage: React.FC = () => {
  const { liveState } = useSocket();
  const [selectedAsset, setSelectedAsset] = useState<string>('SP-02');

  const riskAssets = [
    { tag: 'SG-01', name: 'OTSG Steam Boiler', risk: 'LOW', status: 'GREEN', score: 12 },
    { tag: 'SP-01', name: 'Steam Pipeline SP-01', risk: 'LOW', status: 'GREEN', score: 14 },
    { tag: 'SP-02', name: 'Steam Pipeline SP-02', risk: 'HIGH', status: 'RED', score: 76 },
    { tag: 'IW-01', name: 'Injection Well IW-01', risk: 'LOW', status: 'GREEN', score: 10 },
    { tag: 'PW-01', name: 'Production Well PW-01', risk: 'LOW', status: 'GREEN', score: 15 },
    { tag: 'SRP-03', name: 'Sucker Rod Pump #3', risk: 'MODERATE', status: 'YELLOW', score: 54 },
    { tag: 'PS-01', name: 'Booster Pump Station', risk: 'LOW', status: 'GREEN', score: 18 },
    { tag: 'ST-01', name: 'Storage Tank ST-01', risk: 'LOW', status: 'GREEN', score: 8 },
  ];

  const assetDetails: Record<string, any> = {
    'SP-02': {
      condition: 'Abnormal pressure differential (ΔP = 6.8 bar exceeding 4.0 bar design threshold). Surface heat loss rate elevated to 8.9%.',
      causes: [
        'Partial gate obstruction in line block valve HV-204',
        'Localized aerogel insulation jacket gap along span 3-B',
        'Sensor transmitter zero-point drift'
      ],
      consequences: [
        'Wellhead IW-02 receives substandard steam enthalpy (lower quality)',
        'Accelerated condensation leading to steam-water hammer fatigue',
        'Elevated OTSG fuel consumption to compensate for line dissipation'
      ],
      recommendations: [
        'Dispatch pipeline crew with FLIR thermal imaging camera',
        'Inspect valve HV-204 stem position indicator',
        'Do NOT raise boiler discharge pressure above 88 bar until resolved'
      ],
      history: 'Sensor warning flagged 35 minutes ago following ambient wind gust increase.'
    },
    'SRP-03': {
      condition: 'Gearbox vibration elevated to 5.8 mm/s; motor casing temperature reaching 78.5°C.',
      causes: [
        'Wrist-pin bearing wear or loose pitman arm connection',
        'Polished rod stuffing box over-tightening causing frictional drag',
        'Fluctuating heavy crude viscosity entering pump barrel'
      ],
      consequences: [
        'Catastrophic rod string parting resulting in costly well workover',
        'Electric motor winding insulation degradation from sustained heat'
      ],
      recommendations: [
        'Perform vibration FFT spectrum analysis',
        'Verify gearbox oil reservoir level and cleanliness',
        'Cap pump speed at 7.5 SPM until mechanical inspection is completed'
      ],
      history: 'Vibration gradually increased from 3.2 mm/s to 5.8 mm/s over past 48 hours.'
    },
    'SG-01': {
      condition: 'Nominal operational status. 88 bar discharge at 289°C saturated steam.',
      causes: ['Normal balanced combustion and feedwater stoichiometry'],
      consequences: ['Stable steam header delivery across all field manifolds'],
      recommendations: ['Maintain regular blowdown cycles and TDS water testing'],
      history: 'Safety relief valves bench recalibrated 7 days ago.'
    },
  };

  const selectedData = assetDetails[selectedAsset] || {
    condition: 'Asset operating within nominal design envelope.',
    causes: ['Standard field operational cycle'],
    consequences: ['Continuous stable production and zero safety violations'],
    recommendations: ['Routine visual walkdown and preventative lubrication'],
    history: 'Nominal operation over past 30 days.'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">Safety & Field Risk Center</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono">
              HSE DECISION SUPPORT
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Interactive Field Risk Heatmap • Caprock Containment • Equipment Stress Matrix
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400">FIELD COMPOSITE RISK:</span>
          <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
            MODERATE (26/100)
          </span>
        </div>
      </div>

      {/* Subsystem Risk Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="petro-card p-3 border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono uppercase">Pipeline Network Risk</span>
          <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">HIGH (SP-02)</div>
          <span className="text-[10px] text-slate-500 font-mono">Differential ΔP = 6.8 bar</span>
        </div>
        <div className="petro-card p-3 border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono uppercase">Artificial Lift Risk</span>
          <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">MODERATE (SRP-03)</div>
          <span className="text-[10px] text-slate-500 font-mono">Vibration 5.8 mm/s</span>
        </div>
        <div className="petro-card p-3 border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono uppercase">Steam Boiler Risk</span>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">LOW (SG-01)</div>
          <span className="text-[10px] text-slate-500 font-mono">Pressure within 88 bar limit</span>
        </div>
        <div className="petro-card p-3 border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono uppercase">Reservoir Caprock Risk</span>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">LOW (21 bar margin)</div>
          <span className="text-[10px] text-slate-500 font-mono">Below 94 bar fracture point</span>
        </div>
      </div>

      {/* INTERACTIVE RISK HEATMAP (Section 18) */}
      <div className="petro-card p-5 border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Interactive Field Asset Risk Heatmap
            </h3>
            <p className="text-[11px] text-slate-400">Click any asset below to view detected conditions and recommendations</p>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">8 PRIMARY CRITICAL ASSETS</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {riskAssets.map((asset) => {
            const isSelected = selectedAsset === asset.tag;
            const bgClass =
              asset.status === 'RED'
                ? 'bg-rose-950/30 border-rose-500/50 hover:bg-rose-950/50'
                : asset.status === 'YELLOW'
                ? 'bg-amber-950/20 border-amber-500/40 hover:bg-amber-950/40'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700';

            return (
              <button
                key={asset.tag}
                onClick={() => setSelectedAsset(asset.tag)}
                className={`p-3.5 rounded-xl border text-left transition-all relative ${bgClass} ${
                  isSelected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#071A2B]' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-white text-sm">{asset.tag}</span>
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      asset.status === 'RED'
                        ? 'bg-rose-500 animate-ping'
                        : asset.status === 'YELLOW'
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                  ></span>
                </div>
                <div className="text-xs text-slate-300 truncate">{asset.name}</div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                  <span className="text-slate-400">Risk Level:</span>
                  <span
                    className={`font-bold ${
                      asset.status === 'RED'
                        ? 'text-rose-400'
                        : asset.status === 'YELLOW'
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {asset.risk}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SELECTED ASSET RISK INVESTIGATION CARD (Section 18) */}
      <div className="petro-card p-6 border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-cyan-400 font-mono font-bold">
              {selectedAsset}
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">Risk Diagnostic & Root-Cause Matrix</h3>
              <p className="text-xs text-slate-400">Decision-support protocol for field operators & maintenance lead</p>
            </div>
          </div>
          <StatusBadge
            status={selectedAsset === 'SP-02' ? 'HIGH' : selectedAsset === 'SRP-03' ? 'MODERATE' : 'LOW'}
            size="md"
          />
        </div>

        {/* Condition */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Detected Condition:</span>
          <p className="text-xs text-white leading-relaxed">{selectedData.condition}</p>
        </div>

        {/* Causes & Consequences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
            <span className="font-mono font-bold text-amber-400 uppercase tracking-wider block">
              Possible Root Causes:
            </span>
            <ul className="space-y-1.5 text-slate-300">
              {selectedData.causes.map((c: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-2">
            <span className="font-mono font-bold text-rose-400 uppercase tracking-wider block">
              Potential Operational Consequences:
            </span>
            <ul className="space-y-1.5 text-slate-300">
              {selectedData.consequences.map((cq: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0"></span>
                  <span>{cq}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recommended Inspection */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-cyan-500/30 space-y-2 text-xs">
          <span className="font-mono font-bold text-cyan-300 uppercase tracking-wider block flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            Recommended Operator Action & Inspection:
          </span>
          <ul className="space-y-1.5 text-slate-300">
            {selectedData.recommendations.map((rec: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0"></span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
