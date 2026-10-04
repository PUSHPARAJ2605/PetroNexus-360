import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', showIcon = true }) => {
  const norm = (status || '').toUpperCase();

  let colorClasses = 'bg-slate-800 text-slate-400 border-slate-700';
  let Icon = HelpCircle;
  let label = status;

  if (norm === 'NORMAL' || norm === 'SAFE' || norm === 'ONLINE' || norm === 'LOW') {
    colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(34,197,94,0.15)]';
    Icon = CheckCircle2;
    label = norm === 'SAFE' ? 'SAFE / APPROVED' : norm === 'LOW' ? 'LOW RISK' : 'NORMAL';
  } else if (norm === 'WARNING' || norm === 'REVIEW' || norm === 'MODERATE') {
    colorClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]';
    Icon = AlertTriangle;
    label = norm === 'REVIEW' ? 'REVIEW REQUIRED' : norm === 'MODERATE' ? 'MODERATE RISK' : 'WARNING';
  } else if (norm === 'CRITICAL' || norm === 'UNSAFE' || norm === 'HIGH') {
    colorClasses = 'bg-rose-500/15 text-rose-400 border-rose-500/40 shadow-[0_0_12px_rgba(239,68,68,0.2)] animate-pulse';
    Icon = AlertOctagon;
    label = norm === 'UNSAFE' ? 'UNSAFE / REJECTED' : norm === 'HIGH' ? 'HIGH RISK' : 'CRITICAL';
  } else if (norm === 'OFFLINE') {
    colorClasses = 'bg-slate-800/80 text-slate-400 border-slate-700';
    label = 'OFFLINE';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  }[size];

  return (
    <span className={`inline-flex items-center rounded-full border ${colorClasses} ${sizeClasses}`}>
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span>{label}</span>
    </span>
  );
};
