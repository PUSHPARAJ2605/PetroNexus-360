import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Cpu, Search, Activity, ShieldCheck, ArrowUpRight, Flame, Radio, Network } from 'lucide-react';
import { StatusBadge } from '../../components/StatusBadge';
import api from '../../services/api';
import { Asset } from '../../types';

export const AssetsPage: React.FC = () => {
  const { openAssetDrawer } = useOutletContext<{ openAssetDrawer: (tag: string) => void }>();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/assets')
      .then((res) => setAssets(res.data))
      .catch((err) => console.error('Failed to load assets:', err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = assets.filter((a) =>
    a.tag.toLowerCase().includes(search.toLowerCase()) ||
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">Field Asset Health Directory</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono">
              TOTAL ASSETS: {assets.length}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            Comprehensive register of surface & downhole heavy oil field infrastructure
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search asset tag or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((asset) => (
          <div
            key={asset.id}
            onClick={() => openAssetDrawer(asset.tag)}
            className="petro-card p-4 border-slate-800 hover:border-cyan-500/50 cursor-pointer transition-all space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">
                  {asset.tag}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 font-mono">
                  {asset.type}
                </span>
              </div>
              <StatusBadge status={asset.status} size="sm" />
            </div>

            <p className="text-xs text-slate-300 line-clamp-1">{asset.name}</p>

            <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-slate-800/80">
              <span className="text-slate-400">Health Score:</span>
              <span className="font-bold text-cyan-400">{asset.healthScore}%</span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>Risk: <strong className="text-slate-300">{asset.riskLevel}</strong></span>
              <span className="text-cyan-400 group-hover:underline flex items-center gap-1">
                View Telemetry <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
