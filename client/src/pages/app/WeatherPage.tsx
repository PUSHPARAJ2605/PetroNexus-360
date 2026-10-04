import React, { useEffect, useState } from 'react';
import {
  CloudSun,
  Wind,
  Droplet,
  Compass,
  ArrowRight,
  TrendingDown,
  Info,
  Calendar,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { Link } from 'react-router-dom';

export const WeatherPage: React.FC = () => {
  const { liveState } = useSocket();
  const [currentWeather, setCurrentWeather] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/weather/current'),
      api.get('/weather/forecast'),
    ])
      .then(([curRes, fcRes]) => {
        setCurrentWeather(curRes.data);
        setForecastData(fcRes.data);
      })
      .catch((err) => console.error('Failed to load weather:', err))
      .finally(() => setLoading(false));
  }, []);

  const cur = liveState?.weather || currentWeather?.current || {
    temperature: 34.2,
    windSpeed: 21.5,
    humidity: 38.0,
    rainfall: 0.0,
    pressure: 1008.4,
  };

  const impact = currentWeather?.steamImpact || {
    impactLevel: 'MODERATE',
    surfaceHeatLossPct: 6.8,
    summary: 'Elevated desert wind increases forced convective heat dissipation along unshielded spans.',
    recommendation: 'Evaluate shifting high-rate steam batch to evening calm hours (< 15 km/h) or increase flow rate by 0.25 t/hr.',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">Weather Intelligence & Microclimate</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono">
              METEOROLOGICAL COUPLING
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Baghewala Field On-Site Weather Station AWS-01 • Thar Desert Thermal Boundary Layer
          </p>
        </div>

        <Link
          to="/app/simulator"
          className="px-3.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono flex items-center gap-1.5"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Apply to Simulator</span>
        </Link>
      </div>

      {/* Real-time Weather Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="petro-card p-3 border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono uppercase">Ambient Temperature</span>
          <div className="text-lg font-bold font-mono text-amber-300 mt-0.5">{cur.temperature} °C</div>
          <span className="text-[10px] text-slate-500 font-mono">Sensible ambient</span>
        </div>
        <div className="petro-card p-3 border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono uppercase">Wind Velocity</span>
          <div className="text-lg font-bold font-mono text-cyan-300 mt-0.5">{cur.windSpeed} km/h</div>
          <span className="text-[10px] text-slate-500 font-mono">NW prevailing gust</span>
        </div>
        <div className="petro-card p-3 border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono uppercase">Relative Humidity</span>
          <div className="text-lg font-bold font-mono text-cyan-300 mt-0.5">{cur.humidity} %</div>
          <span className="text-[10px] text-slate-500 font-mono">Dry desert climate</span>
        </div>
        <div className="petro-card p-3 border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono uppercase">Precipitation Rate</span>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">{cur.rainfall} mm</div>
          <span className="text-[10px] text-slate-500 font-mono">Zero rainfall</span>
        </div>
        <div className="petro-card p-3 border-slate-800">
          <span className="text-[10px] text-slate-400 font-mono uppercase">Atmospheric Pressure</span>
          <div className="text-lg font-bold font-mono text-white mt-0.5">{cur.pressure || 1008.4} hPa</div>
          <span className="text-[10px] text-slate-500 font-mono">Barometric base</span>
        </div>
      </div>

      {/* WEATHER IMPACT ON STEAM OPERATIONS (Section 13) */}
      <div className="petro-card p-5 border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Weather Impact on Surface Steam Transmission
            </h3>
            <p className="text-[11px] text-slate-400">Thermodynamic forced convection analysis along unshielded spans</p>
          </div>
          <StatusBadge status={impact.impactLevel} size="md" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-slate-400 text-[10px] uppercase">Convective Heat Loss Estimate:</span>
            <div className="text-xl font-bold text-amber-400">
              {liveState?.weather.estimatedHeatLoss || impact.surfaceHeatLossPct}%
            </div>
            <p className="text-[11px] text-slate-300 font-sans mt-1">{impact.summary}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-1">
            <span className="text-cyan-400 text-[10px] uppercase font-bold">Simulator Decision Recommendation:</span>
            <p className="text-xs text-slate-200 font-sans leading-relaxed mt-1">
              {impact.recommendation}
            </p>
          </div>
        </div>
      </div>

      {/* 7-DAY METEOROLOGICAL FORECAST (Section 13) */}
      <div className="petro-card p-5 border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            7-Day Operational Weather & Heat Dissipation Forecast
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">BAGHEWALA MET-GRID</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2.5 text-xs font-mono">
          {forecastData?.forecast?.map((day: any) => (
            <div key={day.day} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-1.5">
              <span className="font-bold text-slate-300 block">{day.day}</span>
              <CloudSun className="w-5 h-5 text-amber-400 mx-auto" />
              <div className="text-sm font-bold text-white">{day.temperature}°C</div>
              <div className="text-[10px] text-cyan-400">{day.windSpeed} km/h</div>
              <div className="pt-1.5 border-t border-slate-800">
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                  day.impactLevel === 'HIGH' ? 'bg-rose-500/20 text-rose-300' :
                  day.impactLevel === 'MODERATE' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {day.estimatedHeatLossPct}% Loss
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* GRAPH: AMBIENT TEMP VS ESTIMATED STEAM HEAT LOSS (Section 13) */}
      <div className="petro-card p-5 border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-cyan-400" />
              Ambient Temperature vs Estimated Steam Line Heat Loss (%)
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">Multi-variable forced convection curves at 10, 25, and 40 km/h wind speeds</p>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">ASME THERMAL RETENTION MODEL</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastData?.heatLossCurve || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="ambientTemp" stroke="#64748B" fontSize={10} />
              <YAxis stroke="#64748B" fontSize={10} domain={[2, 10]} />
              <Tooltip contentStyle={{ backgroundColor: '#0B2239', borderColor: '#1F5EFF', fontSize: '11px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="lossLowWind" name="Calm Wind (10 km/h)" stroke="#10B981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="lossMedWind" name="Moderate Wind (25 km/h)" stroke="#F59E0B" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="lossHighWind" name="High Wind Gusts (40 km/h)" stroke="#EF4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
