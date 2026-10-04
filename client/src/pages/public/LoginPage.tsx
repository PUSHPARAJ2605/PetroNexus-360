import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  Activity,
  Cpu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      login(token, user);
      navigate('/app/dashboard');
    } catch (err: any) {
      console.error('Authentication failure:', err);
      setError(err.response?.data?.error || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-blue-600/15 via-cyan-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-10 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-10 w-80 h-80 bg-blue-700/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container - Large, Commanding Size */}
      <div className="w-full max-w-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            SECURE CONTROL ROOM GATEWAY • SYSTEM ONLINE
          </div>
          <div className="flex items-center justify-center gap-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-teal-400 p-[1px] shadow-xl shadow-cyan-500/20">
              <div className="w-full h-full bg-[#071A2B] rounded-[15px] flex items-center justify-center">
                <Layers className="w-7 h-7 text-cyan-400" />
              </div>
            </div>
            <div className="text-left">
              <h1 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-300 tracking-wider">
                PETRONEXUS 360
              </h1>
              <p className="text-xs sm:text-sm text-cyan-400/80 font-mono tracking-wide">
                DIGITAL TWIN SIMULATION & SUPERVISORY CONTROL
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Glassmorphic Login Card */}
        <div className="relative rounded-2xl bg-[#0B2239]/85 backdrop-blur-xl border border-cyan-500/30 p-8 sm:p-12 shadow-[0_0_50px_rgba(6,182,212,0.15)] transition-all">
          {/* Accent Glow Bar on Top */}
          <div className="absolute top-0 inset-x-8 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          {/* Error Notice */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/50 border border-rose-500/40 flex items-start gap-3 text-sm text-rose-300 animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-rose-200">Authentication Failed</p>
                <p className="text-xs text-rose-300/90">{error}</p>
              </div>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider">
                <span>Operator Email</span>
                <span className="text-[11px] text-cyan-400/80 font-mono">Verified ID</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-400 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="operator@petronexus360.demo"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-base text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/25 transition-all font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider">
                <span>Access Security Password</span>
                <span className="text-[11px] text-slate-400 font-mono">Encrypted Input</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-cyan-400 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full pl-12 pr-12 py-3.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-base text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/25 transition-all font-mono tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center gap-2.5 text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-0 focus:ring-offset-[#0B2239] transition-all cursor-pointer"
                />
                <span className="text-slate-300 hover:text-white transition-colors">Remember Session</span>
              </label>
              <button
                type="button"
                onClick={() => alert('Please contact your PetroNexus administrator or control room supervisor to reset your access credentials.')}
                className="text-cyan-400 hover:text-cyan-300 font-medium hover:underline transition-all cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 hover:from-blue-500 hover:via-cyan-400 hover:to-teal-300 text-white font-bold text-base shadow-lg shadow-cyan-500/30 hover:shadow-cyan-400/50 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer group"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials & Digital Twin Stream...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5 text-white/90" />
                  <span>Sign In to Field Twin</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Card Footer Telemetry Indicators */}
          <div className="mt-10 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>TELEMETRY STREAM: 1000ms TICK</span>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>TLS 1.3 / AES-256-GCM CONTROL LINK</span>
            </div>
          </div>
        </div>

        {/* Bottom Platform Disclaimer */}
        <p className="text-center text-xs text-slate-400 font-mono">
          Prototype Digital Twin SCADA Simulation • Authorized Heavy Oil Personnel Only
        </p>
      </div>
    </div>
  );
};
