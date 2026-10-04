import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CircleDot,
  Flame,
  Droplet,
  Activity,
  History,
  Wrench,
  AlertTriangle,
  Sliders,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
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

export const WellDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { liveState } = useSocket();
  const [well, setWell] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get(`/wells/${id}`)
      .then((res) => setWell(res.data))
      .catch((err) => console.error('Failed to load well detail:', err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400 font-mono text-xs">Loading Well Telemetry...</div>;
  }

  if (!well) {
    return (
      <div className="petro-card p-8 text-center space-y-4">
        <h2 className="text-base font-bold text-white">Well Not Found</h2>
        <Link to="/app/wells" className="text-cyan-400 text-xs font-mono">← Return to Wells List</Link>
      </div>
    );
  }

  const liveData = liveState?.assets[well.asset?.tag || id || '']?.telemetry;

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/app/wells"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white font-mono">{well.asset?.tag || id}</h1>
              <StatusBadge status={well.status} size="sm" />
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {well.asset?.name} • Zone {well.reservoirZone} • Depth: {well.depth}m TVD
            </p>
          </div>
        </div>

        <Link
          to="/app/simulator"
          className="px-3.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono flex items-center gap-1.5"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Simulate CSS On This Well</span>
        </Link>
      </div>

      {/* Live Wellhead Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="petro-card p-3 border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono uppercase">Wellhead Pressure</span>
          <div className="text-lg font-bold font-mono text-cyan-300 mt-0.5">
            {liveData?.wellheadPressure ?? well.currentPressure} bar
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Continuous gauge</span>
        </div>
        <div className="petro-card p-3 border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono uppercase">Fluid Temperature</span>
          <div className="text-lg font-bold font-mono text-cyan-300 mt-0.5">
            {liveData?.temperature ?? well.currentTemperature} °C
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Thermal sensor</span>
        </div>
        <div className="petro-card p-3 border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono uppercase">Production / Steam Rate</span>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
            {well.type === 'PRODUCTION' ? `${liveData?.oilRate ?? well.currentOilRate} BPD` : `${well.currentSteamRate} t/hr`}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">CSS Cycle #{well.cssCycle}</span>
        </div>
        <div className="petro-card p-3 border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono uppercase">Well Integrity Health</span>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">{well.healthScore}%</div>
          <span className="text-[10px] text-slate-500 font-mono">Risk: {well.riskLevel}</span>
        </div>
      </div>

      {/* 14-Day CSS History Chart */}
      <div className="petro-card p-5 border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            14-Day Pressure & Temperature Response Profile
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">POST-STEAM DRAWDOWN</span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={well.historySeries || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="date" stroke="#64748B" fontSize={10} />
              <YAxis yAxisId="left" stroke="#38BDF8" fontSize={10} />
              <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" fontSize={10} />
              <Tooltip contentStyle={{ backgroundColor: '#0B2239', borderColor: '#1F5EFF', fontSize: '11px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line yAxisId="left" type="monotone" dataKey="pressure" name="Pressure (bar)" stroke="#38BDF8" strokeWidth={2} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="temperature" name="Temperature (°C)" stroke="#F59E0B" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts & Maintenance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Alarms */}
        <div className="petro-card p-5 border-slate-800 space-y-3">
          <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Well Active Alarms ({well.asset?.alerts?.length || 0})
          </h3>
          <div className="space-y-2">
            {well.asset?.alerts && well.asset.alerts.length > 0 ? (
              well.asset.alerts.map((a: any) => (
                <div key={a.id} className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs">
                  <div className="flex justify-between font-semibold text-amber-300 mb-1">
                    <span>{a.category} ALARM</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(a.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px]">{a.message}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No active alarms recorded for this well.</p>
            )}
          </div>
        </div>

        {/* Maintenance Records */}
        <div className="petro-card p-5 border-slate-800 space-y-3">
          <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Wrench className="w-4 h-4 text-cyan-400" />
            Maintenance & Work Orders ({well.asset?.maintenanceRecords?.length || 0})
          </h3>
          <div className="space-y-2">
            {well.asset?.maintenanceRecords && well.asset.maintenanceRecords.length > 0 ? (
              well.asset.maintenanceRecords.map((m: any) => (
                <div key={m.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                  <div className="flex justify-between font-semibold text-white mb-0.5">
                    <span>{m.title}</span>
                    <span className="text-[10px] text-cyan-400 font-mono">{m.status}</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{m.description}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No pending work orders.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
