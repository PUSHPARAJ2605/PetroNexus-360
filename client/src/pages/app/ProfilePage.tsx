import React from 'react';
import { UserCheck, Mail, Shield, Key, Calendar, Layers } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold text-white tracking-wide">Operator Profile & Credentials</h1>
        <p className="text-xs text-slate-400 mt-0.5 font-mono">
          Security clearance, RBAC operational credentials, and active session details
        </p>
      </div>

      <div className="petro-card p-6 border-slate-800 space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
            alt={user?.name || 'Operator'}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-500/40 shadow-lg"
          />
          <div>
            <h2 className="text-lg font-bold text-white font-mono">{user?.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-400 font-mono">{user?.email}</span>
              <span className="text-slate-600">•</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold uppercase">
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-500 uppercase text-[10px] block">Role Authority Level</span>
            <div className="text-white font-bold">{user?.role} CLEARANCE</div>
            <p className="text-[11px] text-slate-400 font-sans mt-1">
              Authorized for pre-operation simulation runs and prototype scenario approval.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-500 uppercase text-[10px] block">Session Authentication</span>
            <div className="text-emerald-400 font-bold">JWT TOKEN SIGNED (ACTIVE)</div>
            <p className="text-[11px] text-slate-400 font-sans mt-1">
              Cryptographically verified bearer token stored securely.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
