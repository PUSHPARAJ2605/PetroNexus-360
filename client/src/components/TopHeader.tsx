import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, CloudSun, Bell, Zap, Radio, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { DisclaimerBanner } from './DisclaimerBanner';

export const TopHeader: React.FC = () => {
  const location = useLocation();
  const { liveState, toggleAnomaly, isConnected } = useSocket();

  // Extract path crumbs
  const pathParts = location.pathname.replace('/app', '').split('/').filter(Boolean);
  const breadcrumbItems = pathParts.map((p, idx) => {
    const fullPath = '/app/' + pathParts.slice(0, idx + 1).join('/');
    const title = p.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    return { title, path: fullPath };
  });

  const weather = liveState?.weather;
  const isAnomaly = liveState?.isAnomalyActive;

  return (
    <header className="bg-[#071A2B]/95 border-b border-slate-800 shrink-0 sticky top-0 z-40 backdrop-blur-md">
      {/* Disclaimer Banner */}
      <DisclaimerBanner type="global" />

      {/* Main Bar */}
      <div className="h-14 px-6 flex items-center justify-between">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs">
          <Link to="/app/dashboard" className="text-slate-400 hover:text-cyan-400 transition-colors">
            Operations
          </Link>
          {breadcrumbItems.length > 0 && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              {breadcrumbItems.map((item, idx) => (
                <React.Fragment key={item.path}>
                  {idx === breadcrumbItems.length - 1 ? (
                    <span className="text-white font-medium">{item.title}</span>
                  ) : (
                    <>
                      <Link to={item.path} className="text-slate-400 hover:text-cyan-400 transition-colors">
                        {item.title}
                      </Link>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                    </>
                  )}
                </React.Fragment>
              ))}
            </>
          )}
        </div>

        {/* Live Control Room Indicators */}
        <div className="flex items-center gap-4">
          {/* Weather Widget */}
          {weather && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
              <CloudSun className="w-4 h-4 text-amber-400" />
              <span className="font-mono text-white">{weather.temperature}°C</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400 text-[11px] font-mono">{weather.windSpeed} km/h NW</span>
            </div>
          )}

          {/* Field Health Pill */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-400">FIELD HEALTH:</span>
            <span className="font-bold font-mono text-emerald-400">
              {liveState?.fieldHealthScore ?? 91.2}%
            </span>
          </div>

          {/* Anomaly Simulation Toggle for Presentation */}
          <button
            onClick={() => toggleAnomaly(!isAnomaly)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all border ${
              isAnomaly
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
            }`}
            title="Toggle simulated pipeline anomaly event (SP-02 pressure drop & SRP vibration)"
          >
            <Zap className={`w-3.5 h-3.5 ${isAnomaly ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
            <span>{isAnomaly ? 'ANOMALY SIM: ACTIVE' : 'SIMULATE ANOMALY'}</span>
          </button>

          {/* Active Alerts Button */}
          {(() => {
            const count = liveState?.activeAlertCount ?? 0;
            return count > 0 ? (
              <Link
                to="/app/alerts"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 transition-all text-xs font-mono font-bold"
              >
                <Bell className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span>{count} {count === 1 ? 'ALERT' : 'ALERTS'}</span>
              </Link>
            ) : (
              <Link
                to="/app/alerts"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition-all text-xs font-mono font-semibold"
                title="All field systems normal. Zero active alarms."
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>0 ALERTS (CLEAR)</span>
              </Link>
            );
          })()}
        </div>
      </div>
    </header>
  );
};
