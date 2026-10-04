import React, { useEffect, useState } from 'react';
import {
  Network,
  AlertTriangle,
  TrendingDown,
  ShieldAlert,
  ArrowRight,
  Activity,
  Layers,
  Thermometer,
  Zap,
  Info,
  CheckCircle2,
  RefreshCw,
  Wrench,
  ShieldCheck
} from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
import { PipelineAnimation } from '../../components/PipelineAnimation';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { PipelineData } from '../../types';

export const PipelinesPage: React.FC = () => {
  const { liveState } = useSocket();
  const [pipelines, setPipelines] = useState<PipelineData[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<string>('SP-02');
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    api.get('/pipelines')
      .then((res) => setPipelines(res.data))
      .catch((err) => console.error('Failed to load pipelines:', err))
      .finally(() => setLoading(false));
  }, []);

  const activePipe = pipelines.find((p) => p.pipelineId === selectedPipeline) || {
    id: '2',
    pipelineId: 'SP-02',
    name: 'High-Pressure Steam Header 2',
    fromAsset: 'SG-01',
    toAsset: 'IW-02',
    inletPressure: 88.0,
    outletPressure: 81.2,
    temperature: 271.0,
    flowRate: 2.1,
    heatLossRate: 8.9,
    status: 'WARNING',
    anomalyDetected: true,
    risk: 'MEDIUM RISK',
    healthScore: 78,
  };

  // Bind live telemetry overlay from Socket.IO if present
  const livePipe = liveState?.assets[selectedPipeline];
  const liveInlet = livePipe?.telemetry.inletPressure ?? activePipe.inletPressure;
  const liveOutlet = livePipe?.telemetry.outletPressure ?? activePipe.outletPressure;
  const liveTemp = livePipe?.telemetry.temperature ?? activePipe.temperature;
  const liveHeatLoss = livePipe?.telemetry.heatLoss ?? activePipe.heatLossRate;
  const liveStatus = livePipe?.status ?? activePipe.status;
  const isAnomaly = liveStatus === 'WARNING' || liveStatus === 'CRITICAL' || ((liveInlet - liveOutlet) > 4.5);

  const handleResolve = async (tag: string) => {
    setResolving(true);
    try {
      await api.post('/simulator/resolve-asset', { assetTag: tag });
      setFeedback(`Anomaly on ${tag} resolved. Baseline differential pressure restored.`);
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      console.error('Failed to resolve anomaly:', err);
    } finally {
      setResolving(false);
    }
  };

  const handleSimulate = async (tag: string) => {
    setResolving(true);
    try {
      await api.post('/simulator/fault-asset', { assetTag: tag });
      setFeedback(`Diagnostic fault simulated on ${tag}: differential pressure drop induced.`);
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      console.error('Failed to induce fault:', err);
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
            <h1 className="text-xl font-bold text-white tracking-wide">Pipeline Network Monitoring</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono">
              HYDRAULIC INTEGRITY
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            High-Pressure Steam Headers (SP) • Heated Heavy Crude Gathering Trunks (OP) • Leak & Anomaly Diagnostics
          </p>
        </div>

        {/* Pipeline Selectors & Anomaly Action */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono text-slate-400">INSPECT SPAN:</span>
          {['SP-01', 'SP-02', 'OP-01', 'OP-02'].map((tag) => {
            const pipeLive = liveState?.assets[tag];
            const hasWarn = pipeLive ? pipeLive.status !== 'NORMAL' : tag === 'SP-02';
            return (
              <button
                key={tag}
                onClick={() => setSelectedPipeline(tag)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                  selectedPipeline === tag
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

      {/* TOP: PIPELINE DIGITAL TWIN VISUALIZER */}
      <PipelineAnimation
        pipelineId={selectedPipeline}
        fromAsset={activePipe.fromAsset}
        toAsset={activePipe.toAsset}
        inletPressure={liveInlet}
        outletPressure={liveOutlet}
        temperature={liveTemp}
        heatLossRate={liveHeatLoss}
        status={liveStatus}
        anomalyDetected={isAnomaly}
      />

      {/* DETECTED ANOMALY BANNER OR NOMINAL STATUS BANNER WITH OPERATIONAL ACTIONS */}
      {isAnomaly ? (
        <div className="petro-card p-4 border-amber-500/50 bg-amber-950/30 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-300 font-mono text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>WARNING: PIPELINE HYDRAULIC ANOMALY DETECTED ACROSS {selectedPipeline}</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status="WARNING" size="sm" />
              <button
                disabled={resolving}
                onClick={() => handleResolve(selectedPipeline)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                {resolving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                <span>Resolve Anomaly & Restore Baseline</span>
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-300">
            <strong>Diagnostic Telemetry:</strong> Inlet {liveInlet.toFixed(1)} bar, Delivery {liveOutlet.toFixed(1)} bar. Differential pressure drop (ΔP = {(liveInlet - liveOutlet).toFixed(1)} bar) exceeds allowable baseline of 4.0 bar. Localized surface heat dissipation elevated to {liveHeatLoss.toFixed(1)}%.
          </p>
          <div className="text-[11px] text-amber-300 font-mono flex items-center justify-between">
            <span><strong>Advisory:</strong> Conduct thermal FLIR scan along {selectedPipeline} span 3-B. Click "Resolve Anomaly" to verify repair and restore normal operating corridor.</span>
          </div>
        </div>
      ) : (
        <div className="petro-card p-3.5 border-emerald-500/30 bg-emerald-950/15 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-emerald-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{selectedPipeline} operating within ASME B31.3 safe hydraulic corridor (ΔP: {(liveInlet - liveOutlet).toFixed(1)} bar).</span>
          </div>
          <button
            disabled={resolving}
            onClick={() => handleSimulate(selectedPipeline)}
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[11px] flex items-center gap-1.5 transition-all"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span>Simulate Fault</span>
          </button>
        </div>
      )}

      {/* PIPELINE NETWORK CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pipelines.map((pipe) => {
          const isWarning = pipe.anomalyDetected;
          const isSelected = selectedPipeline === pipe.pipelineId;
          return (
            <div
              key={pipe.id}
              onClick={() => setSelectedPipeline(pipe.pipelineId)}
              className={`petro-card p-5 border cursor-pointer transition-all ${
                isSelected
                  ? 'border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                  : isWarning
                  ? 'border-amber-500/40 bg-amber-950/10 hover:border-amber-500/60'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-white text-base">{pipe.pipelineId}</span>
                  <StatusBadge status={pipe.status} size="sm" />
                </div>
                <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                  <span className="text-cyan-400 font-bold">{pipe.fromAsset}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-cyan-400 font-bold">{pipe.toAsset}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-xs font-mono mb-4">
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Inlet Pressure</span>
                  <span className="font-bold text-white text-sm">{pipe.inletPressure.toFixed(1)} bar</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Outlet Pressure</span>
                  <span className="font-bold text-white text-sm">{pipe.outletPressure.toFixed(1)} bar</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Pressure Drop (ΔP)</span>
                  <span className={`font-bold text-sm ${(pipe.inletPressure - pipe.outletPressure) > 4.5 ? 'text-amber-400' : 'text-cyan-300'}`}>
                    {(pipe.inletPressure - pipe.outletPressure).toFixed(2)} bar
                  </span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Line Temperature</span>
                  <span className="font-bold text-white text-sm">{pipe.temperature.toFixed(1)} °C</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Heat Loss Rate</span>
                  <span className={`font-bold text-sm ${pipe.heatLossRate > 6 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {pipe.heatLossRate.toFixed(1)} %
                  </span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block">Health Score</span>
                  <span className="font-bold text-cyan-300 text-sm">{pipe.healthScore}%</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono border-t border-slate-800/60 pt-3 text-slate-400">
                <span>Span: 520m • 8" Diameter</span>
                <span className="flex items-center gap-1.5">
                  Leak Risk: <span className={`font-bold ${isWarning ? 'text-amber-400' : 'text-emerald-400'}`}>{pipe.leakRisk || (isWarning ? 'HIGH' : 'LOW')}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
