import React, { useEffect, useState } from 'react';
import { History, ShieldCheck, UserCheck, Calendar, Activity, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

export const HistoryPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/history')
      .then((res) => setLogs(res.data))
      .catch((err) => console.error('Failed to load audit history:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">Operation History & Audit Trail</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono">
              COMPLIANCE LOG
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Cryptographically audited record of parameter adjustments, simulation executions, and scenario approvals
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>IMMUTABLE AUDIT ENABLED</span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="petro-card border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px] uppercase">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Operator / User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Asset</th>
                <th className="py-3 px-4">Details & Parameters</th>
                <th className="py-3 px-4">Approval Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                    {log.user?.name || 'System Simulator'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 text-[10px] font-bold">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-cyan-400 font-semibold">{log.asset?.tag || '—'}</td>
                  <td className="py-3 px-4 max-w-md">
                    <p className="text-slate-300 text-xs font-sans">{log.details}</p>
                    {(log.previousValue || log.newValue) && (
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {log.previousValue && <span>Prev: {log.previousValue} ➔ </span>}
                        {log.newValue && <span className="text-emerald-300">New: {log.newValue}</span>}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {log.approvalStatus ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        {log.approvalStatus}
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
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
