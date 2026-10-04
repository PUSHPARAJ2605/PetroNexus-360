import React, { useEffect, useState, useMemo } from 'react';
import {
  Bell,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  UserCheck,
  MessageSquare,
  Search,
  Filter,
  Check,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck,
  FileCheck,
  Activity,
  BarChart3,
  Wrench,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
import api from '../../services/api';
import { AlertData } from '../../types';
import { useSocket } from '../../context/SocketContext';

type SubPageView = 'active' | 'acknowledged' | 'resolved' | 'analytics';

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SubPageView>('active');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Resolve Modal state
  const [resolvingAlert, setResolvingAlert] = useState<AlertData | null>(null);
  const [rootCause, setRootCause] = useState('VALVE_CONSTRICTION');
  const [resolutionNote, setResolutionNote] = useState('');
  const [technicianName, setTechnicianName] = useState('Operator Control Room');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Note Modal state
  const [noteAlert, setNoteAlert] = useState<AlertData | null>(null);
  const [noteText, setNoteText] = useState('');

  // Simulate Alert Modal state
  const [showSimModal, setShowSimModal] = useState(false);
  const [simAsset, setSimAsset] = useState('SP-02');
  const [simSeverity, setSimSeverity] = useState('HIGH');
  const [simCategory, setSimCategory] = useState('PIPELINE');
  const [simMessage, setSimMessage] = useState('Pressure differential breach detected across steam pipeline SP-02.');

  const { liveState } = useSocket();

  const loadAlerts = () => {
    setLoading(true);
    api.get('/alerts')
      .then((res) => {
        setAlerts(res.data || []);
      })
      .catch((err) => console.error('Failed to load alerts:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  // Filter alerts by current page tab
  const tabAlerts = useMemo(() => {
    let filtered = alerts;

    if (activeTab === 'active') {
      filtered = alerts.filter((a) => a.status === 'ACTIVE');
    } else if (activeTab === 'acknowledged') {
      filtered = alerts.filter((a) => a.status === 'ACKNOWLEDGED');
    } else if (activeTab === 'resolved') {
      filtered = alerts.filter((a) => a.status === 'RESOLVED');
    }

    if (severityFilter !== 'ALL') {
      filtered = filtered.filter((a) => a.severity === severityFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.asset?.tag?.toLowerCase().includes(q) ||
          a.message?.toLowerCase().includes(q) ||
          a.category?.toLowerCase().includes(q) ||
          a.notes?.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [alerts, activeTab, severityFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(tabAlerts.length / pageSize));
  const paginatedAlerts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return tabAlerts.slice(startIndex, startIndex + pageSize);
  }, [tabAlerts, currentPage, pageSize]);

  // Reset page when tab or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, severityFilter, searchQuery]);

  // Counts for tabs
  const activeCount = alerts.filter((a) => a.status === 'ACTIVE').length;
  const ackCount = alerts.filter((a) => a.status === 'ACKNOWLEDGED').length;
  const resolvedCount = alerts.filter((a) => a.status === 'RESOLVED').length;

  // Handle open resolve modal
  const handleOpenResolveModal = (alert: AlertData) => {
    setResolvingAlert(alert);
    if (alert.category === 'PIPELINE') {
      setRootCause('VALVE_CONSTRICTION');
      setResolutionNote('Inspected line segment, adjusted motorized throttling valve, line pressure stabilized within standard limits.');
    } else if (alert.category === 'PUMP') {
      setRootCause('BEARING_LUBRICATION');
      setResolutionNote('Completed greasing cycle and balanced rod string stroke rate. Vibration normalized to baseline.');
    } else {
      setRootCause('SENSOR_RECALIBRATION');
      setResolutionNote('Diagnostic probe verified and transmitter recalibrated. Telemetry readings normalized.');
    }
  };

  // Submit Alert Resolution
  const handleConfirmResolve = async () => {
    if (!resolvingAlert) return;
    setIsSubmitting(true);
    try {
      const fullNote = `[Resolved by ${technicianName} | Cause: ${rootCause}] ${resolutionNote}`;
      await api.patch(`/alerts/${resolvingAlert.id}`, {
        status: 'RESOLVED',
        notes: fullNote,
      });
      setResolvingAlert(null);
      loadAlerts();
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Quick Acknowledge
  const handleAcknowledge = async (alertId: string) => {
    try {
      await api.patch(`/alerts/${alertId}`, { status: 'ACKNOWLEDGED' });
      loadAlerts();
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  // Handle Reopen
  const handleReopen = async (alertId: string) => {
    try {
      await api.patch(`/alerts/${alertId}`, {
        status: 'ACTIVE',
        notes: 'Alert reopened by operator for re-investigation.',
      });
      loadAlerts();
    } catch (err) {
      console.error('Failed to reopen alert:', err);
    }
  };

  // Handle Batch Resolve All
  const handleBatchResolveAll = async () => {
    if (!confirm('Mark all active alerts as resolved?')) return;
    try {
      await api.post('/alerts/resolve-all', {
        notes: 'Batch resolved via control room operator clearance.',
      });
      loadAlerts();
    } catch (err) {
      console.error('Failed to resolve all alerts:', err);
    }
  };

  // Trigger Simulated Alert
  const handleCreateSimAlert = async () => {
    try {
      await api.post('/alerts', {
        assetTag: simAsset,
        severity: simSeverity,
        category: simCategory,
        message: simMessage,
        notes: 'Simulated field diagnostic trigger for operator training.',
      });
      setShowSimModal(false);
      loadAlerts();
      setActiveTab('active');
    } catch (err) {
      console.error('Failed to create simulated alert:', err);
    }
  };

  // Save diagnostic note
  const handleSaveNote = async () => {
    if (!noteAlert || !noteText.trim()) return;
    try {
      await api.patch(`/alerts/${noteAlert.id}`, { notes: noteText });
      setNoteAlert(null);
      setNoteText('');
      loadAlerts();
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Page Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/30 flex items-center justify-center">
              <Bell className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-wide">Alert Management Center</h1>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono">
                  SCADA PROTOCOL
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Segregated incident triage, resolution workflows, and historical audits
              </p>
            </div>
          </div>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowSimModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-cyan-300 transition-all cursor-pointer"
            title="Trigger a simulated alert to test the resolution workflow"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simulate Alert</span>
          </button>

          {activeCount > 0 && (
            <button
              onClick={handleBatchResolveAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-mono text-emerald-300 font-bold transition-all cursor-pointer shadow-sm shadow-emerald-500/20"
              title="Resolve all open alerts immediately"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Resolve All ({activeCount})</span>
            </button>
          )}

          <button
            onClick={loadAlerts}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Refresh alerts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Pages / Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/90 border border-slate-800 self-start">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span>Active Incidents</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeCount > 0
                  ? 'bg-rose-500 text-white font-bold'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {activeCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('acknowledged')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeTab === 'acknowledged'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Under Review</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400">
              {ackCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('resolved')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeTab === 'resolved'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Resolved Archive</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400">
              {resolvedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span>Subsystem Analytics</span>
          </button>
        </div>

        {/* Search & Filter Bar (shown on list tabs) */}
        {activeTab !== 'analytics' && (
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tag, message..."
                className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono w-44 sm:w-56"
              />
            </div>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="WARNING">WARNING</option>
              <option value="INFO">INFO</option>
            </select>
          </div>
        )}
      </div>

      {/* SUB-PAGE 1: ACTIVE INCIDENTS DESK */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          {tabAlerts.length === 0 ? (
            /* Zero-State All Clear Card */
            <div className="petro-card p-10 text-center border-emerald-500/30 bg-emerald-950/10 rounded-2xl space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-lg font-bold text-white tracking-wide">All Systems Clear — Zero Active Alarms</h3>
                <p className="text-xs text-slate-400 font-mono leading-relaxed">
                  Every monitored pipeline segment, pump station, and steam unit is running within authorized supervisory thresholds.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowSimModal(true)}
                  className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold transition-all cursor-pointer"
                >
                  + Trigger Simulated Anomaly Alert
                </button>
                <button
                  onClick={() => setActiveTab('resolved')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-all cursor-pointer"
                >
                  View Resolved Archive ({resolvedCount})
                </button>
              </div>
            </div>
          ) : (
            <div className="petro-card border-slate-800 overflow-hidden rounded-2xl shadow-xl">
              <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Immediate Action Required ({tabAlerts.length})
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Page {currentPage} of {totalPages}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 text-[11px] uppercase">
                      <th className="py-3 px-4">Severity</th>
                      <th className="py-3 px-4">Asset Tag</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Diagnostic Finding</th>
                      <th className="py-3 px-4">Detected</th>
                      <th className="py-3 px-4 text-right">Resolution Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {paginatedAlerts.map((alt) => (
                      <tr key={alt.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <StatusBadge status={alt.severity} size="sm" />
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">
                          <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono">
                            {alt.asset?.tag}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                            {alt.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-md">
                          <p className="text-slate-300 text-xs font-sans leading-relaxed">{alt.message}</p>
                          {alt.notes && (
                            <div className="mt-1 text-[11px] text-cyan-400 flex items-center gap-1 font-mono">
                              <MessageSquare className="w-3 h-3 shrink-0" />
                              <span>{alt.notes}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                          {new Date(alt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenResolveModal(alt)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:shadow-emerald-500/20"
                              title="Resolve this alert with operational findings and root-cause sign-off"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Resolve Alert</span>
                            </button>

                            <button
                              onClick={() => handleAcknowledge(alt.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-amber-300 border border-slate-700 text-xs font-mono transition-all cursor-pointer"
                              title="Acknowledge & assign to field investigation"
                            >
                              Investigate
                            </button>

                            <button
                              onClick={() => {
                                setNoteAlert(alt);
                                setNoteText(alt.notes || '');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-cyan-300 border border-slate-700 text-xs font-mono transition-all cursor-pointer"
                              title="Add or update diagnostic notes"
                            >
                              Note
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination Bar */}
              <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-slate-400">
                <div>
                  Showing {tabAlerts.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
                  {Math.min(currentPage * pageSize, tabAlerts.length)} of {tabAlerts.length} active incidents
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(1)}
                    className="p-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700"
                    title="First page"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }).map((_, idx) => (
                    <button
                      key={idx + 1}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={`w-7 h-7 rounded text-xs font-bold transition-all ${
                        currentPage === idx + 1
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700"
                    title="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className="p-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700"
                    title="Last page"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-PAGE 2: UNDER INVESTIGATION */}
      {activeTab === 'acknowledged' && (
        <div className="space-y-4">
          <div className="petro-card border-slate-800 overflow-hidden rounded-2xl shadow-xl">
            <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Under Field Walkdown & Investigation ({tabAlerts.length})
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Page {currentPage} of {totalPages}
              </span>
            </div>

            {tabAlerts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 font-mono text-xs">
                No incidents currently flagged under investigation.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 text-[11px] uppercase">
                      <th className="py-3 px-4">Severity</th>
                      <th className="py-3 px-4">Asset Tag</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Diagnostic Finding & Work Notes</th>
                      <th className="py-3 px-4">Acknowledged</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {paginatedAlerts.map((alt) => (
                      <tr key={alt.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <StatusBadge status={alt.severity} size="sm" />
                        </td>
                        <td className="py-3.5 px-4 font-bold text-white">{alt.asset?.tag}</td>
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {alt.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-md">
                          <p className="text-slate-300 text-xs font-sans leading-relaxed">{alt.message}</p>
                          {alt.notes && (
                            <div className="mt-1 text-[11px] text-amber-300/90 flex items-center gap-1 font-mono">
                              <MessageSquare className="w-3 h-3 shrink-0" />
                              <span>{alt.notes}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                          {new Date(alt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenResolveModal(alt)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Complete & Resolve</span>
                            </button>
                            <button
                              onClick={() => {
                                setNoteAlert(alt);
                                setNoteText(alt.notes || '');
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-mono"
                            >
                              Update Note
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {tabAlerts.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs font-mono text-slate-400">
                <div>Showing Page {currentPage} of {totalPages}</div>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40"
                  >
                    Prev
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-PAGE 3: RESOLVED ARCHIVE */}
      {activeTab === 'resolved' && (
        <div className="space-y-4">
          <div className="petro-card border-slate-800 overflow-hidden rounded-2xl shadow-xl">
            <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Historical Resolution Archive ({tabAlerts.length})
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Page {currentPage} of {totalPages}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 text-[11px] uppercase">
                    <th className="py-3 px-4">Severity</th>
                    <th className="py-3 px-4">Asset</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Original Message & Resolution Report</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Resolved Time</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {paginatedAlerts.map((alt) => (
                    <tr key={alt.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <StatusBadge status={alt.severity} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white">{alt.asset?.tag}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {alt.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-lg">
                        <p className="text-slate-300 text-xs font-sans leading-relaxed">{alt.message}</p>
                        {alt.notes && (
                          <div className="mt-1.5 p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-[11px] text-emerald-300 font-mono">
                            <span className="font-bold uppercase tracking-wider block text-[10px] text-emerald-400 mb-0.5">
                              Resolution Report:
                            </span>
                            {alt.notes}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          RESOLVED
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {alt.resolvedAt
                          ? new Date(alt.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : new Date(alt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleReopen(alt.id)}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-rose-500/20 text-rose-300 border border-slate-700 text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                            title="Reopen this alert to Active status for re-evaluation"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reopen</span>
                          </button>
                          <button
                            onClick={() => {
                              setNoteAlert(alt);
                              setNoteText(alt.notes || '');
                            }}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-500/20 text-cyan-300 border border-slate-700 text-[11px] font-mono cursor-pointer"
                          >
                            Note
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-slate-400">
              <div>
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, tabAlerts.length)} of {tabAlerts.length} resolved alarms
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx + 1}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`w-7 h-7 rounded text-xs font-bold ${
                      currentPage === idx + 1
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1 rounded bg-slate-800 text-slate-300 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-PAGE 4: SUBSYSTEM RISK ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="petro-card p-5 rounded-2xl border-slate-800 bg-[#0B2239]/80 space-y-2">
              <span className="text-xs text-slate-400 font-mono">ACTIVE ALARMS</span>
              <p className="text-3xl font-black text-rose-400 font-mono">{activeCount}</p>
              <span className="text-[11px] text-slate-500 block">Requires supervisor attention</span>
            </div>

            <div className="petro-card p-5 rounded-2xl border-slate-800 bg-[#0B2239]/80 space-y-2">
              <span className="text-xs text-slate-400 font-mono">UNDER REVIEW</span>
              <p className="text-3xl font-black text-amber-400 font-mono">{ackCount}</p>
              <span className="text-[11px] text-slate-500 block">Assigned to walkdown team</span>
            </div>

            <div className="petro-card p-5 rounded-2xl border-slate-800 bg-[#0B2239]/80 space-y-2">
              <span className="text-xs text-slate-400 font-mono">RESOLVED TODAY</span>
              <p className="text-3xl font-black text-emerald-400 font-mono">{resolvedCount}</p>
              <span className="text-[11px] text-slate-500 block">Closed with root-cause reports</span>
            </div>

            <div className="petro-card p-5 rounded-2xl border-slate-800 bg-[#0B2239]/80 space-y-2">
              <span className="text-xs text-slate-400 font-mono">MEAN RESOLUTION TIME</span>
              <p className="text-3xl font-black text-cyan-400 font-mono">14.2m</p>
              <span className="text-[11px] text-emerald-400 font-mono block">94.8% within SLA standard</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="petro-card p-6 rounded-2xl border-slate-800 bg-[#0B2239]/80 space-y-4">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <Wrench className="w-4 h-4 text-cyan-400" />
                Root Cause Distribution (Past 30 Days)
              </h3>
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Valve Position & Throttling Constriction</span>
                    <span className="text-cyan-400 font-bold">42%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: '42%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Pump Bearing Mechanical Vibration</span>
                    <span className="text-amber-400 font-bold">28%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full" style={{ width: '28%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Thermal Loss & Insulation Degradation</span>
                    <span className="text-blue-400 font-bold">18%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: '18%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Sensor Transducer Calibration Drift</span>
                    <span className="text-purple-400 font-bold">12%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-400 rounded-full" style={{ width: '12%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="petro-card p-6 rounded-2xl border-slate-800 bg-[#0B2239]/80 space-y-4">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                HSE Compliance & Supervisory Integrity
              </h3>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="font-mono">Caprock Pressure Thresholds:</span>
                  <span className="text-emerald-400 font-bold font-mono">100% IN COMPLIANCE</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono">Emergency Venting Systems:</span>
                  <span className="text-emerald-400 font-bold font-mono">ONLINE & TESTED</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono">Audit Log Retention:</span>
                  <span className="text-cyan-400 font-bold font-mono">IMMUTABLE POSTGRESQL</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 font-mono leading-relaxed">
                All operator resolution actions generate timestamped cryptographic records adhering to digital oilfield safety supervisory directives.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* RESOLUTION TERMINAL MODAL (HOW TO RESOLVE IT) */}
      {resolvingAlert && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl petro-card p-6 sm:p-8 border-cyan-500/40 bg-[#0A1F36] rounded-2xl space-y-5 shadow-2xl relative animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                    Resolve Alert: {resolvingAlert.asset?.tag}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Complete corrective action findings and sign off to clear this alarm
                </p>
              </div>
              <StatusBadge status={resolvingAlert.severity} size="sm" />
            </div>

            {/* Diagnostic Snapshot */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1 text-xs">
              <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block font-bold">
                Reported Incident Telemetry:
              </span>
              <p className="text-slate-200 font-sans">{resolvingAlert.message}</p>
            </div>

            {/* Root Cause Selector */}
            <div className="space-y-1.5 text-xs font-mono">
              <label className="text-slate-300 font-bold block uppercase tracking-wider">
                Identified Root Cause:
              </label>
              <select
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="VALVE_CONSTRICTION">Valve Position / Throttling Constriction</option>
                <option value="BEARING_LUBRICATION">Pump Bearing Wear / Lubrication Cycle</option>
                <option value="THERMAL_INSULATION">Localized Insulation Wrap Damage</option>
                <option value="SENSOR_RECALIBRATION">Transducer Signal Drift & Calibration</option>
                <option value="SCHEDULED_BLOWDOWN">Standard Operational Blowdown Complete</option>
                <option value="TRANSIENT_SURGE">Transient Pressure Fluctuation / False Alarm</option>
              </select>
            </div>

            {/* Resolution Report */}
            <div className="space-y-1.5 text-xs font-mono">
              <label className="text-slate-300 font-bold block uppercase tracking-wider">
                Corrective Action & Field Work Report:
              </label>
              <textarea
                rows={3}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Detail physical inspection findings, valve recalibration, or equipment walkdown..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            {/* Sign-off Technician */}
            <div className="space-y-1.5 text-xs font-mono">
              <label className="text-slate-300 font-bold block uppercase tracking-wider">
                Clearing Authority / Technician:
              </label>
              <input
                type="text"
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 text-xs font-mono">
              <button
                type="button"
                onClick={() => setResolvingAlert(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting || !resolutionNote.trim()}
                onClick={handleConfirmResolve}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/25 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Committing Audit...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Resolution & Clear Alarm</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTE MODAL */}
      {noteAlert && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md petro-card p-6 border-cyan-500/40 bg-[#09223D] rounded-2xl space-y-4">
            <h3 className="text-xs font-mono font-bold text-white uppercase">
              Add Operational Diagnostic Note for {noteAlert.asset?.tag}
            </h3>
            <textarea
              rows={4}
              placeholder="Enter operator observation, walkdown report, or sensor recalibration status..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
            />
            <div className="flex justify-end gap-2 text-xs font-mono">
              <button
                onClick={() => setNoteAlert(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold cursor-pointer"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIMULATE ALERT MODAL */}
      {showSimModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md petro-card p-6 border-rose-500/40 bg-[#09223D] rounded-2xl space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <h3 className="text-sm font-mono font-bold text-white uppercase">
                Trigger Simulated Field Incident
              </h3>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Inject a test anomaly into the digital twin to exercise operator triage and resolution.
            </p>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-300 block mb-1">Target Asset Tag:</label>
                <select
                  value={simAsset}
                  onChange={(e) => setSimAsset(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white cursor-pointer"
                >
                  <option value="SP-02">SP-02 (Steam Pipeline Line B)</option>
                  <option value="SRP-03">SRP-03 (Rod Pumping Unit 3)</option>
                  <option value="SG-01">SG-01 (Once-Through Steam Generator)</option>
                  <option value="PW-01">PW-01 (Heavy Oil Production Well)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Severity Rating:</label>
                <select
                  value={simSeverity}
                  onChange={(e) => setSimSeverity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white cursor-pointer"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="WARNING">WARNING</option>
                  <option value="INFO">INFO</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Incident Description:</label>
                <textarea
                  rows={2}
                  value={simMessage}
                  onChange={(e) => setSimMessage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs font-mono pt-2">
              <button
                onClick={() => setShowSimModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSimAlert}
                className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold cursor-pointer"
              >
                Trigger Alarm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
