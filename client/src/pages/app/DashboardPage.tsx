import React, { useEffect, useState } from 'react';
import {
  Activity,
  Flame,
  Droplet,
  Radio,
  Network,
  Zap,
  Bell,
  HeartPulse,
  TrendingUp,
  Clock,
  Compass,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { KpiCard } from '../../components/KpiCard';
import { StatusBadge } from '../../components/StatusBadge';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';

export const DashboardPage: React.FC = () => {
  const { liveState } = useSocket();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/overview'),
      api.get('/dashboard/trends'),
    ])
      .then(([overviewRes, trendsRes]) => {
        setDashboardData(overviewRes.data);
        setTrends(trendsRes.data);
      })
      .catch((err) => console.error('Failed to load dashboard:', err))
      .finally(() => setLoading(false));
  }, []);

  const kpis = liveState?.keyMetrics || dashboardData?.kpis || {
    oilProductionBpd: 1248,
    steamRateThr: 5.0,
    steamTemperatureC: 289,
    steamPressureBar: 88,
    activeWells: '8/10',
    pumpAvailabilityPct: 94,
    pipelineHealthPct: 88,
    energyConsumptionMWh: 78.4,
  };

  const fieldHealth = liveState?.fieldHealthScore || dashboardData?.kpis?.fieldHealthScore || 91.2;
  const activeAlertCount = liveState?.activeAlertCount ?? dashboardData?.kpis?.activeAlerts ?? 2;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">Field Operations Overview</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono">
              DIGITAL TWIN LIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Baghewala Heavy Oil Basin • Reservoir Zone R-01 • Cyclic Steam Operations
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>28.01° N, 73.31° E</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Row (Section 7) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard
          title="Oil Production"
          value={kpis.oilProductionBpd}
          unit="BPD"
          icon={Droplet}
          trend="+3.2% vs target"
          trendDirection="up"
          status="NORMAL"
        />
        <KpiCard
          title="Steam Injection Rate"
          value={kpis.steamRateThr}
          unit="t/hr"
          icon={Flame}
          trend="88 bar @ 289°C"
          trendDirection="neutral"
          status="NORMAL"
        />
        <KpiCard
          title="Active Wells"
          value={kpis.activeWells}
          unit="Wells"
          icon={Activity}
          trend="3 Producers, 2 Injectors"
          trendDirection="neutral"
          status="NORMAL"
        />
        <KpiCard
          title="Field Health Score"
          value={`${fieldHealth}%`}
          icon={HeartPulse}
          trend={fieldHealth > 90 ? 'Nominal operation' : 'Inspection advised'}
          trendDirection={fieldHealth > 90 ? 'up' : 'down'}
          status={fieldHealth > 90 ? 'NORMAL' : 'WARNING'}
        />
        <KpiCard
          title="Active Field Alerts"
          value={activeAlertCount}
          unit="Alarms"
          icon={Bell}
          trend="1 Pipeline, 1 Pump"
          trendDirection={activeAlertCount > 0 ? 'down' : 'neutral'}
          status={activeAlertCount > 2 ? 'CRITICAL' : activeAlertCount > 0 ? 'WARNING' : 'NORMAL'}
        />
      </div>

      {/* Second KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="petro-card p-3 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Pump Station Availability</span>
            <div className="text-lg font-bold font-mono text-cyan-300 mt-0.5">{kpis.pumpAvailabilityPct}%</div>
          </div>
          <Radio className="w-5 h-5 text-cyan-500/40" />
        </div>
        <div className="petro-card p-3 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Pipeline Network Health</span>
            <div className="text-lg font-bold font-mono text-amber-300 mt-0.5">{kpis.pipelineHealthPct}%</div>
          </div>
          <Network className="w-5 h-5 text-amber-500/40" />
        </div>
        <div className="petro-card p-3 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Energy Consumption</span>
            <div className="text-lg font-bold font-mono text-emerald-300 mt-0.5">{kpis.energyConsumptionMWh} MWh</div>
          </div>
          <Zap className="w-5 h-5 text-emerald-500/40" />
        </div>
        <div className="petro-card p-3 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">Weather Heat Loss Est.</span>
            <div className="text-lg font-bold font-mono text-cyan-300 mt-0.5">{liveState?.weather.estimatedHeatLoss || 6.8}%</div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">
            {liveState?.weather.windSpeed || 21.5} km/h
          </span>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Production Trend */}
        <div className="petro-card p-5 border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Heavy Oil Production Trend (BPD)
              </h3>
              <p className="text-[11px] text-slate-400">Totalized output across PW-01, PW-02, and PW-03</p>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400">
              {kpis.oilProductionBpd} BPD
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends?.productionTrends || []}>
                <defs>
                  <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} fontStyle="mono" />
                <YAxis stroke="#64748B" fontSize={10} domain={['dataMin - 50', 'dataMax + 50']} />
                <Tooltip contentStyle={{ backgroundColor: '#0B2239', borderColor: '#1F5EFF', fontSize: '11px' }} />
                <Area type="monotone" dataKey="oilProduction" name="Produced Crude (BPD)" stroke="#06B6D4" strokeWidth={2} fill="url(#prodGrad)" />
                <Line type="monotone" dataKey="target" name="Field Target (1250)" stroke="#10B981" strokeDasharray="4 4" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Steam-to-Oil Ratio (SOR) & Steam Rate */}
        <div className="petro-card p-5 border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                Steam Injection & Steam-to-Oil Ratio (SOR)
              </h3>
              <p className="text-[11px] text-slate-400">OTSG mass delivery vs thermal efficiency metric</p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400">SOR: 2.45</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends?.steamSorTrends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
                <YAxis yAxisId="left" stroke="#F59E0B" fontSize={10} domain={[1.5, 4.0]} />
                <YAxis yAxisId="right" orientation="right" stroke="#38BDF8" fontSize={10} domain={[4.0, 6.0]} />
                <Tooltip contentStyle={{ backgroundColor: '#0B2239', borderColor: '#1F5EFF', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line yAxisId="left" type="monotone" dataKey="sor" name="SOR (m3 steam / m3 oil)" stroke="#F59E0B" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="steamRate" name="Steam Rate (t/hr)" stroke="#38BDF8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Reservoir Temperature & Steam Enthalpy */}
        <div className="petro-card p-5 border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-emerald-400" />
                Reservoir Heat Penetration Response (°C)
              </h3>
              <p className="text-[11px] text-slate-400">Bottomhole temperature monitoring across zones</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400">Zone R-01: 198°C</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends?.reservoirTempTrends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} domain={[160, 220]} />
                <Tooltip contentStyle={{ backgroundColor: '#0B2239', borderColor: '#1F5EFF', fontSize: '11px' }} />
                <Area type="monotone" dataKey="zoneR01" name="Zone R-01 Temp (°C)" stroke="#10B981" strokeWidth={2} fill="#10B981" fillOpacity={0.15} />
                <Area type="monotone" dataKey="zoneR02" name="Peripheral Zone (°C)" stroke="#6366F1" strokeWidth={1.5} fill="#6366F1" fillOpacity={0.05} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Hydraulic Pressure Profile */}
        <div className="petro-card p-5 border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Network className="w-4 h-4 text-blue-400" />
                Hydraulic Line Pressure Profile (bar)
              </h3>
              <p className="text-[11px] text-slate-400">Tracking pressure drops across SP-01 and SP-02 headers</p>
            </div>
            <span className="text-xs font-mono font-bold text-rose-400">SP-02 ΔP: 6.8 bar</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends?.pressureTrends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} domain={[65, 95]} />
                <Tooltip contentStyle={{ backgroundColor: '#0B2239', borderColor: '#1F5EFF', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="sg01Pressure" name="OTSG Header (88 bar)" stroke="#38BDF8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="sp01Pressure" name="SP-01 Normal (86 bar)" stroke="#10B981" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="sp02Pressure" name="SP-02 Anomaly Line" stroke="#F43F5E" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* LIVE FIELD OPERATIONS FEED (Required by Section 7) */}
      <div className="petro-card p-5 border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Live Field Operations Feed
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">AUTOMATED TELEMETRY DISPATCH</span>
        </div>

        <div className="space-y-2.5 max-h-56 overflow-y-auto">
          {dashboardData?.operationsFeed && dashboardData.operationsFeed.length > 0 ? (
            dashboardData.operationsFeed.map((feed: any) => (
              <div
                key={feed.id}
                className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-start justify-between text-xs hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="font-mono text-cyan-400 font-semibold shrink-0 text-[11px]">
                    {feed.time}
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-slate-200 text-xs">{feed.text}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span>Action: {feed.action}</span>
                      {feed.asset && <span>• Asset: {feed.asset}</span>}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-4">
                  {feed.user}
                </span>
              </div>
            ))
          ) : (
            <div className="text-slate-400 text-xs italic py-2">Loading operations stream...</div>
          )}
        </div>
      </div>
    </div>
  );
};
