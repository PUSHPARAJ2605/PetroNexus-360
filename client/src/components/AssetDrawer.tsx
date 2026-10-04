import React, { useEffect, useState } from 'react';
import { X, Activity, AlertTriangle, Wrench, Shield, TrendingUp, Cpu, ShieldCheck, RefreshCw, Zap, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

interface AssetDrawerProps {
  assetTag: string | null;
  onClose: () => void;
}

export const AssetDrawer: React.FC<AssetDrawerProps> = ({ assetTag, onClose }) => {
  const [assetData, setAssetData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const { liveState } = useSocket();

  useEffect(() => {
    if (!assetTag) {
      setAssetData(null);
      return;
    }

    setLoading(true);
    api.get(`/assets/${assetTag}`)
      .then((res) => {
        setAssetData(res.data);
      })
      .catch((err) => console.error('Failed to load asset drawer:', err))
      .finally(() => setLoading(false));
  }, [assetTag]);

  if (!assetTag) return null;

  // Live telemetry overlay from socket
  const liveTelemetry = liveState?.assets[assetTag]?.telemetry || assetData?.liveTelemetry || {};
  const currentStatus = liveState?.assets[assetTag]?.status || assetData?.status || 'NORMAL';
  const currentHealth = liveState?.assets[assetTag]?.healthScore || assetData?.healthScore || 92;
  const currentRisk = liveState?.assets[assetTag]?.riskLevel || assetData?.riskLevel || 'LOW';
  const isWarn = currentStatus === 'WARNING' || currentStatus === 'CRITICAL';

  const handleResolve = async () => {
    if (!assetTag) return;
    setResolving(true);
    try {
      await api.post('/simulator/resolve-asset', { assetTag });
      setActionMessage(`Alert resolved for ${assetTag}. Operational baseline restored.`);
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err) {
      console.error('Failed to resolve asset alert:', err);
    } finally {
      setResolving(false);
    }
  };

  const handleSimulate = async () => {
    if (!assetTag) return;
    setResolving(true);
    try {
      await api.post('/simulator/fault-asset', { assetTag });
      setActionMessage(`Diagnostic fault simulated on ${assetTag}.`);
      setTimeout(() => setActionMessage(null), 5000);
    } catch (err) {
      console.error('Failed to induce asset fault:', err);
    } finally {
      setResolving(false);
    }
  };

  // Mock historical mini trend for chart
  const historyTrend = Array.from({ length: 10 }).map((_, i) => ({
    time: `${i * 2}m`,
    val: 80 + Math.sin(i * 0.8) * 8 + (Math.random() - 0.5) * 4,
  }));

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#092036]/95 backdrop-blur-xl border-l border-cyan-500/30 shadow-2xl flex flex-col transition-transform duration-300">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-mono">{assetTag}</h2>
              <StatusBadge status={currentStatus} size="sm" />
            </div>
            <p className="text-xs text-slate-400 truncate max-w-[240px]">{assetData?.name || 'Heavy Oil Asset'}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="p-8 flex items-center justify-center text-slate-400 text-sm">
          <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mr-2"></div>
          Loading Digital Twin telemetry...
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Action Feedback Message */}
          {actionMessage && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/60 text-xs font-mono text-emerald-200 flex items-center gap-2 shadow">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{actionMessage}</span>
            </div>
          )}

          {/* Operational Resolution / Fault Trigger Banner */}
          {isWarn ? (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/50 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-amber-300 font-mono font-bold">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 animate-bounce" />
                  Active Integrity Warning
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                  Anomaly Active
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono">
                Asset parameters exceed nominal baseline. Field inspection or maintenance required.
              </p>
              <button
                disabled={resolving}
                onClick={handleResolve}
                className="w-full py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
              >
                {resolving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Resolve Alert & Restore Baseline</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono">
              <span className="text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Nominal Operating Baseline
              </span>
              <button
                disabled={resolving}
                onClick={handleSimulate}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-[10px] flex items-center gap-1 transition-all"
              >
                <Zap className="w-3 h-3" />
                <span>Simulate Fault</span>
              </button>
            </div>
          )}
          {/* Key Metrics Grid */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Live Operating Parameters</span>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {Object.entries(liveTelemetry).map(([key, val]) => (
                <div key={key} className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <div className="text-lg font-bold font-mono text-cyan-300 mt-0.5">
                    {typeof val === 'number' ? val.toFixed(1) : String(val)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Health & Risk Indicators */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Asset Health Score
              </span>
              <span className="text-sm font-bold font-mono text-emerald-400">{currentHealth}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  currentHealth > 85 ? 'bg-emerald-500' : currentHealth > 70 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
                style={{ width: `${currentHealth}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                Predicted Risk
              </span>
              <StatusBadge status={currentRisk} size="sm" showIcon={false} />
            </div>
          </div>

          {/* Real-time Telemetry Trend Chart */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                Telemetry Pulse (Last 20 min)
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">LIVE SYNC</span>
            </div>
            <div className="h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyTrend}>
                  <defs>
                    <linearGradient id="drawerGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" hide />
                  <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B2239', borderColor: '#1F5EFF', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="val" stroke="#06B6D4" strokeWidth={2} fill="url(#drawerGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Active Alerts */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Active Field Alerts ({assetData?.alerts?.length || 0})
            </span>
            <div className="mt-2 space-y-2">
              {assetData?.alerts && assetData.alerts.length > 0 ? (
                assetData.alerts.map((alt: any) => (
                  <div key={alt.id} className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-amber-300">{alt.category} ALARM</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(alt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{alt.message}</p>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                  Zero active safety or mechanical alarms.
                </div>
              )}
            </div>
          </div>

          {/* Maintenance Records */}
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-cyan-400" />
              Maintenance Schedule
            </span>
            <div className="mt-2 space-y-2">
              {assetData?.maintenanceRecords && assetData.maintenanceRecords.length > 0 ? (
                assetData.maintenanceRecords.map((m: any) => (
                  <div key={m.id} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{m.title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                        {m.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{m.description}</p>
                    <div className="mt-2 text-[10px] text-slate-500 flex justify-between font-mono">
                      <span>Tech: {m.technician || 'Integrity Team'}</span>
                      <span>{new Date(m.scheduledDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 italic bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                  No upcoming maintenance work orders scheduled.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
