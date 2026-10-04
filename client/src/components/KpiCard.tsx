import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  status?: 'NORMAL' | 'WARNING' | 'CRITICAL';
  subtitle?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  trendDirection = 'neutral',
  status = 'NORMAL',
  subtitle,
}) => {
  const statusBorder = {
    NORMAL: 'border-slate-800/80 hover:border-cyan-500/40',
    WARNING: 'border-amber-500/40 bg-amber-950/10',
    CRITICAL: 'border-rose-500/50 bg-rose-950/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]',
  }[status];

  const iconColor = {
    NORMAL: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    WARNING: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    CRITICAL: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  }[status];

  return (
    <div className={`petro-card p-4 transition-all duration-200 border ${statusBorder}`}>
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</span>
        <div className={`p-2 rounded-lg border ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tracking-tight text-white font-mono">{value}</span>
        {unit && <span className="text-xs text-slate-400 font-medium">{unit}</span>}
      </div>

      {(trend || subtitle) && (
        <div className="mt-2.5 flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
          {subtitle && <span className="text-slate-400 truncate">{subtitle}</span>}
          {trend && (
            <span
              className={`font-mono text-[11px] font-medium ml-auto ${
                trendDirection === 'up'
                  ? 'text-emerald-400'
                  : trendDirection === 'down'
                  ? 'text-rose-400'
                  : 'text-slate-400'
              }`}
            >
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
