import React, { useEffect, useState } from 'react';
import {
  Radio,
  AlertTriangle,
  Activity,
  Wrench,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Zap,
  Info
} from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
import { SrpAnimation } from '../../components/SrpAnimation';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { PumpData } from '../../types';

export const PumpsPage: React.FC = () => {
  const { liveState } = useSocket();
  const [pumps, setPumps] = useState<PumpData[]>([]);
  const [selectedPump, setSelectedPump] = useState<string>('SRP-03');
  const [pumpDetail, setPumpDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/pumps')
      .then((res) => {
        setPumps(res.data);
      })
      .catch((err) => console.error('Failed to load pumps:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedPump) return;
    api.get(`/pumps/${selectedPump}`)
      .then((res) => setPumpDetail(res.data))
      .catch((err) => console.error('Failed to fetch pump detail:', err));
  }, [selectedPump]);

  const [resolving, setResolving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const livePump = liveState?.assets[selectedPump];
  const liveVib = livePump?.telemetry.vibration ?? pumpDetail?.currentVibration ?? 5.8;
  const liveTemp = livePump?.telemetry.motorTemp ?? pumpDetail?.currentMotorTemp ?? 78.5;
  const liveStroke = livePump?.telemetry.strokeRate ?? pumpDetail?.strokeRate ?? 7.2;
  const liveStatus = livePump?.status ?? (liveVib > 4.5 ? 'WARNING' : 'NORMAL');
  const isWarn = liveStatus === 'WARNING' || liveVib > 4.5;

  const handleResolve = async (tag: string) => {
    setResolving(true);
    try {
      await api.post('/simulator/resolve-asset', { assetTag: tag });
      setFeedback(`Maintenance performed on ${tag}: greasing verified, vibration & motor temperature normalized.`);
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      console.error('Failed to resolve pump anomaly:', err);
    } finally {
      setResolving(false);
    }
  };

  const handleSimulate = async (tag: string) => {
    setResolving(true);
    try {
      await api.post('/simulator/fault-asset', { assetTag: tag });
      setFeedback(`Diagnostic fault simulated on ${tag}: mechanical vibration induced.`);
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      console.error('Failed to induce pump fault:', err);
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">SRP & Pump Station Digital Twin</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono">
              ARTIFICIAL LIFT INTEGRITY
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Sucker Rod Pumping Units • Beam Kinematics • Polished Rod Loads • Vibration Spectrum Analysis
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-slate-400">SELECT UNIT:</span>
          {['SRP-01', 'SRP-02', 'SRP-03'].map((tag) => {
            const pLive = liveState?.assets[tag];
            const hasWarn = pLive ? pLive.status !== 'NORMAL' : tag === 'SRP-03';
            return (
              <button
                key={tag}
                onClick={() => setSelectedPump(tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                  selectedPump === tag
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {tag} {hasWarn && '⚠️'}
              </button>
            );
          })}
        </div>
      </div>

      {/* FEEDBACK TOAST BANNER */}
      {feedback && (
        <div className="p-3 rounded-xl bg-cyan-950/70 border border-cyan-500/60 text-xs font-mono text-cyan-200 flex items-center justify-between shadow-lg">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            {feedback}
          </span>
          <button onClick={() => setFeedback(null)} className="text-cyan-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* TOP: ANIMATED SUCKER ROD PUMP VISUALIZATION */}
      <SrpAnimation
        strokeRate={liveStroke}
        vibration={liveVib}
        motorTemp={liveTemp}
        isWarning={isWarn}
      />

      {/* MECHANICAL DEGRADATION WARNING BANNER OR NOMINAL STATUS WITH ACTION */}
      {isWarn ? (
        <div className="petro-card p-4 border-amber-500/50 bg-amber-950/30 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-300 font-mono text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>DIAGNOSTIC ALERT: POTENTIAL MECHANICAL DEGRADATION DETECTED ON {selectedPump}</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status="WARNING" size="sm" />
              <button
                disabled={resolving}
                onClick={() => handleResolve(selectedPump)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Mark Greased & Clear Anomaly</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-300">
            <strong>{selectedPump}:</strong> Elevated gearbox vibration ({liveVib.toFixed(2)} mm/s) accompanied by motor casing temperature at {liveTemp.toFixed(1)}°C. Dynamic polished rod loading indicates potential wrist-pin bearing play or rod guide friction wear.
          </p>
          <div className="text-[11px] text-amber-300 font-mono">
            <strong>Recommended Action:</strong> Click "Mark Greased & Clear Anomaly" to record field maintenance and restore nominal ISO 10816 vibration baseline.
          </div>
        </div>
      ) : (
        <div className="petro-card p-3.5 border-emerald-500/30 bg-emerald-950/15 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-emerald-300 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{selectedPump} operating smoothly within ISO 10816 Class II vibration threshold ({liveVib.toFixed(2)} mm/s • {liveTemp.toFixed(1)}°C).</span>
          </div>
          <button
            disabled={resolving}
            onClick={() => handleSimulate(selectedPump)}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[11px] flex items-center gap-1.5 transition-all"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Simulate Vibration Fault</span>
          </button>
        </div>
      )}

      {/* PUMP UNITS SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pumps.map((p) => {
          const isSelected = selectedPump === p.pumpId;
          const liveP = liveState?.assets[p.pumpId]?.telemetry;
          const vib = liveP?.vibration ?? p.vibration;
          const isWarn = vib > 4.5;

          return (
            <div
              key={p.id}
              onClick={() => setSelectedPump(p.pumpId)}
              className={`petro-card p-4 border cursor-pointer transition-all ${
                isSelected
                  ? 'border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-white text-sm">{p.pumpId}</span>
                <StatusBadge status={isWarn ? 'WARNING' : 'NORMAL'} size="sm" />
              </div>
              <p className="text-xs text-slate-400 truncate mb-3">{p.name}</p>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase">Vibration</span>
                  <div className={`font-bold ${isWarn ? 'text-amber-400' : 'text-cyan-300'}`}>
                    {vib} mm/s
                  </div>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase">Motor Temp</span>
                  <div className="font-bold text-white">
                    {liveP?.motorTemp ?? p.motorTemp} °C
                  </div>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase">Efficiency</span>
                  <div className="font-bold text-emerald-400">{p.efficiency}%</div>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase">Health Score</span>
                  <div className="font-bold text-cyan-300">{p.healthScore}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 24-HOUR VIBRATION TREND GRAPH (Section 15) */}
      <div className="petro-card p-5 border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              {selectedPump} 24-Hour Vibration & Mechanical Stress Trend (mm/s)
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">ISO 10816 Mechanical Vibration Severity Chart</p>
          </div>
          <span className="text-xs font-mono text-slate-400">Threshold: 4.5 mm/s</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pumpDetail?.vibrationTrend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
              <YAxis stroke="#64748B" fontSize={10} domain={[0, 9]} />
              <Tooltip contentStyle={{ backgroundColor: '#0B2239', borderColor: '#1F5EFF', fontSize: '11px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="vibration" name="Measured Vibration (mm/s)" stroke="#38BDF8" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="warningThreshold" name="Warning Limit (4.5)" stroke="#F59E0B" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="criticalThreshold" name="Critical Limit (7.0)" stroke="#EF4444" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
