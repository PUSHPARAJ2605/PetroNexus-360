import React, { useEffect, useState } from 'react';
import {
  Wrench,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Cpu,
  Layers,
  Radio,
  Network,
  Activity,
  UserCheck
} from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
import api from '../../services/api';

export const MaintenancePage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New work order form
  const [assetId, setAssetId] = useState('SRP-03');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('HIGH');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = () => {
    api.get('/maintenance')
      .then((res) => setData(res.data))
      .catch((err) => console.error('Failed to load maintenance:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/maintenance', {
        assetId,
        title,
        description,
        priority,
        scheduledDate,
      });
      setShowModal(false);
      setTitle('');
      setDescription('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to schedule maintenance record');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">Predictive Maintenance & Asset Reliability</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono">
              RULE-BASED PROGNOSTICS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Vibration Spectrum Tracking • Thermal Camera Insulation Surveys • Work Order Dispatch
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs font-mono transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Work Order</span>
        </button>
      </div>

      {/* ASSET PREDICTIVE HEALTH CARDS (Required by Section 17) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.assetCards?.map((card: any) => {
          const isHigh = card.failureRisk === 'HIGH';
          const isMod = card.failureRisk === 'MODERATE';

          return (
            <div
              key={card.tag}
              className={`petro-card p-5 border transition-all space-y-3 ${
                isHigh ? 'border-rose-500/40 bg-rose-950/15' : isMod ? 'border-amber-500/40 bg-amber-950/10' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div>
                  <span className="font-mono font-bold text-white text-sm">{card.tag}</span>
                  <div className="text-xs text-slate-400 truncate">{card.title}</div>
                </div>
                <StatusBadge status={card.failureRisk} size="sm" />
              </div>

              {/* Remaining Health Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Remaining Health:</span>
                  <span className={`font-bold ${card.healthScore > 85 ? 'text-emerald-400' : card.healthScore > 70 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {card.healthScore}%
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full ${
                      card.healthScore > 85 ? 'bg-emerald-500' : card.healthScore > 70 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${card.healthScore}%` }}
                  ></div>
                </div>
              </div>

              {/* Maintenance Timestamps */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1 text-slate-400">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block uppercase">Last Maint:</span>
                  <span className="text-slate-300 font-semibold">{card.lastMaintenance}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-500 block uppercase">Next Inspection:</span>
                  <span className="text-cyan-300 font-semibold">{card.nextRecommendedInspection}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-300 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/80">
                <strong className="text-cyan-400 font-mono">Recommendation: </strong>
                {card.recommendation}
              </div>
            </div>
          );
        })}
      </div>

      {/* SCHEDULED WORK ORDERS TABLE */}
      <div className="petro-card border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Wrench className="w-4 h-4 text-cyan-400" />
            Field Maintenance Work Orders ({data?.records?.length || 0})
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">STORED IN POSTGRESQL</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase bg-slate-900/40">
                <th className="py-2.5 px-4">Asset</th>
                <th className="py-2.5 px-4">Title & Details</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Priority</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Scheduled Date</th>
                <th className="py-2.5 px-4">Technician</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {data?.records?.map((rec: any) => (
                <tr key={rec.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-bold text-cyan-300">{rec.asset?.tag}</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-white block">{rec.title}</span>
                    <span className="text-[11px] text-slate-400 font-sans">{rec.description}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                      {rec.maintenanceType}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      rec.priority === 'HIGH' ? 'bg-rose-500/20 text-rose-300' :
                      rec.priority === 'MEDIUM' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {rec.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-emerald-400 font-bold">{rec.status}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(rec.scheduledDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-slate-300">{rec.technician || 'Integrity Lead'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SCHEDULE WORK ORDER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg petro-card p-6 border-cyan-500/40 bg-[#09223D] rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-mono font-bold text-white text-sm">Schedule Field Work Order</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 mb-1">Target Asset</label>
                <select
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="SP-02">SP-02 — High-Pressure Steam Pipeline (Anomaly Line)</option>
                  <option value="SRP-03">SRP-03 — Sucker Rod Pump (Elevated Vibration)</option>
                  <option value="SG-01">SG-01 — Once-Through Steam Generator</option>
                  <option value="PW-01">PW-01 — Heavy Oil Producer #1</option>
                  <option value="IW-01">IW-01 — Injection Well #1</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Work Order Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Inspect Gearbox Wrist Pin Bearing & Lubrication"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Findings / Inspection Scope</label>
                <textarea
                  rows={3}
                  placeholder="Details of required survey, tooling, or vibration spectrum testing..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="HIGH">HIGH (Urgent)</option>
                    <option value="MEDIUM">MEDIUM (Standard)</option>
                    <option value="LOW">LOW (Routine)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Target Inspection Date</label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold"
                >
                  Dispatch Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
