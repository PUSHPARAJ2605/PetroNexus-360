import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleDot, ArrowUpRight, Search, Filter, ShieldCheck, Activity, Flame, Droplet, CheckCircle2, RefreshCw, Zap, Wrench, AlertTriangle } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
import { WellAnimation } from '../../components/WellAnimation';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { WellData } from '../../types';

export const WellsPage: React.FC = () => {
  const { liveState } = useSocket();
  const [wells, setWells] = useState<WellData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWell, setSelectedWell] = useState<string>('IW-01');
  const [filterType, setFilterType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [resolving, setResolving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    api.get('/wells')
      .then((res) => setWells(res.data))
      .catch((err) => console.error('Failed to load wells:', err))
      .finally(() => setLoading(false));
  }, []);

  const activeWellData = wells.find((w) => w.wellId === selectedWell) || {
    id: '1',
    wellId: 'IW-01',
    name: 'Primary Steam Injector',
    type: 'INJECTION',
    status: 'NORMAL',
    pressure: 84.0,
    temperature: 268.0,
    oilRate: 0,
    steamRate: 2.9,
    cssCycle: 'Cycle #4',
    healthScore: 95,
    risk: 'LOW RISK',
  };

  const liveWell = liveState?.assets[selectedWell];
  const livePressure = liveWell?.telemetry.wellheadPressure ?? activeWellData.pressure;
  const liveTemp = liveWell?.telemetry.bottomholeTemp ?? liveWell?.telemetry.temperature ?? activeWellData.temperature;
  const liveRate = activeWellData.type === 'INJECTION'
    ? (liveWell?.telemetry.steamRate ?? activeWellData.steamRate ?? 2.9)
    : (liveWell?.telemetry.oilRate ?? activeWellData.oilRate ?? 440);
  const liveStatus = liveWell?.status ?? activeWellData.status;
  const isWarn = liveStatus === 'WARNING' || liveStatus === 'CRITICAL';

  const handleResolve = async (tag: string) => {
    setResolving(true);
    try {
      await api.post('/simulator/resolve-asset', { assetTag: tag });
      setFeedback(`Wellhead integrity verified on ${tag}. Downhole pressure & thermal baseline confirmed.`);
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      console.error('Failed to resolve well anomaly:', err);
    } finally {
      setResolving(false);
    }
  };

  const handleSimulate = async (tag: string) => {
    setResolving(true);
    try {
      await api.post('/simulator/fault-asset', { assetTag: tag });
      setFeedback(`Diagnostic fault simulated on ${tag}: high formation pressure induced.`);
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      console.error('Failed to induce well fault:', err);
    } finally {
      setResolving(false);
    }
  };

  const filteredWells = wells.filter((w) => {
    const matchesType = filterType === 'ALL' || w.type === filterType;
    const matchesSearch = w.wellId.toLowerCase().includes(search.toLowerCase()) || w.name.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">Wells Monitoring Directory</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono">
              CYCLIC STEAM & HEAVY LIFT
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Active Thermal Injectors (IW) • Post-Soak Producers (PW) • Observation Wells (BW)
          </p>
        </div>

        {/* Well Quick Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-slate-400">INSPECT WELL:</span>
          {['IW-01', 'IW-02', 'PW-01', 'PW-02', 'PW-03', 'BW-101'].map((tag) => {
            const wLive = liveState?.assets[tag];
            const hasWarn = wLive ? wLive.status !== 'NORMAL' : false;
            return (
              <button
                key={tag}
                onClick={() => setSelectedWell(tag)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                  selectedWell === tag
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

      {/* TOP: WELL DIGITAL TWIN VISUALIZER */}
      <WellAnimation
        wellTag={selectedWell}
        wellType={activeWellData.type}
        pressure={livePressure}
        temperature={liveTemp}
        flowRate={liveRate}
        status={liveStatus}
        depthMd={1180}
      />

      {/* WELL INTEGRITY & RESOLUTION ACTION BAR */}
      <div className="petro-card p-3.5 border-slate-800 bg-slate-900/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2.5">
          <StatusBadge status={liveStatus} size="sm" />
          <span className="text-slate-300 font-medium">
            {selectedWell}: {livePressure.toFixed(1)} bar • {liveTemp.toFixed(1)}°C • Status: <strong className="text-white">{liveStatus}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isWarn ? (
            <button
              disabled={resolving}
              onClick={() => handleResolve(selectedWell)}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              {resolving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>Verify Integrity & Resolve Alert</span>
            </button>
          ) : (
            <>
              <button
                disabled={resolving}
                onClick={() => handleResolve(selectedWell)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 text-[11px] flex items-center gap-1.5 transition-all"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Re-verify Baseline</span>
              </button>
              <button
                disabled={resolving}
                onClick={() => handleSimulate(selectedWell)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-[11px] flex items-center gap-1.5 transition-all"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Simulate Anomaly</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="font-bold text-white uppercase">Directory:</span>
          <span>Click any well row to load its digital twin above</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search well tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none"
          >
            <option value="ALL">All Well Types</option>
            <option value="INJECTION">Injection Wells</option>
            <option value="PRODUCTION">Production Wells</option>
            <option value="BACKUP">Observation / Backup</option>
          </select>
        </div>
      </div>

      {/* Wells Table */}
      <div className="petro-card border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px] uppercase">
                <th className="py-3 px-4">Well Tag</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Pressure</th>
                <th className="py-3 px-4">Temperature</th>
                <th className="py-3 px-4">Production Rate</th>
                <th className="py-3 px-4">Steam Rate</th>
                <th className="py-3 px-4">CSS Cycle</th>
                <th className="py-3 px-4">Health</th>
                <th className="py-3 px-4">Risk</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredWells.map((w) => (
                <tr
                  key={w.id}
                  onClick={() => setSelectedWell(w.wellId)}
                  className={`cursor-pointer transition-colors ${
                    selectedWell === w.wellId ? 'bg-cyan-500/10' : 'hover:bg-slate-800/40'
                  }`}
                >
                  <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                    <CircleDot className={`w-3.5 h-3.5 ${w.type === 'INJECTION' ? 'text-cyan-400' : w.type === 'PRODUCTION' ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span className={selectedWell === w.wellId ? 'text-cyan-300' : 'text-white'}>{w.wellId}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      w.type === 'INJECTION' ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30' :
                      w.type === 'PRODUCTION' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {w.type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={w.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 font-bold">{w.pressure.toFixed(1)} bar</td>
                  <td className="py-3 px-4 text-rose-300">{w.temperature.toFixed(1)} °C</td>
                  <td className="py-3 px-4">
                    {w.oilRate ? <span className="text-emerald-400 font-bold">{w.oilRate} BPD</span> : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="py-3 px-4">
                    {w.steamRate ? <span className="text-cyan-300 font-bold">{w.steamRate} t/hr</span> : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="py-3 px-4 text-slate-400">{w.cssCycle}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-cyan-400">{w.healthScore}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {w.riskLevel || 'LOW RISK'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/app/wells/${w.wellId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      <span>Telemetry</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
