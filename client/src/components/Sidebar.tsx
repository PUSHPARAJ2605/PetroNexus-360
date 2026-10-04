import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GitGraph,
  Sliders,
  Flame,
  CircleDot,
  Radio,
  Network,
  Cpu,
  ShieldAlert,
  CloudSun,
  Wrench,
  Bell,
  Bot,
  FileBarChart,
  History,
  Users,
  Settings,
  UserCheck,
  LogOut,
  Layers,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { isConnected, liveState } = useSocket();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navGroups = [
    {
      group: 'Core Operations',
      items: [
        { name: 'Field Overview', path: '/app/dashboard', icon: LayoutDashboard },
        { name: 'Field Digital Twin', path: '/app/digital-twin', icon: GitGraph },
        { name: 'Operation Simulator', path: '/app/simulator', icon: Sliders, badge: 'CORE' },
        { name: 'Steam Intelligence', path: '/app/steam', icon: Flame },
      ],
    },
    {
      group: 'Asset Telemetry',
      items: [
        { name: 'Wells (CSS & Lift)', path: '/app/wells', icon: CircleDot },
        { name: 'Pumps & SRP Stations', path: '/app/pumps', icon: Radio },
        { name: 'Pipeline Network', path: '/app/pipelines', icon: Network },
        { name: 'Asset Health Directory', path: '/app/assets', icon: Cpu },
      ],
    },
    {
      group: 'Intelligence & HSE',
      items: [
        { name: 'Safety & Risk Center', path: '/app/safety', icon: ShieldAlert },
        { name: 'Weather Intelligence', path: '/app/weather', icon: CloudSun },
        { name: 'Predictive Maintenance', path: '/app/maintenance', icon: Wrench },
        {
          name: 'Alert Management',
          path: '/app/alerts',
          icon: Bell,
          badge: liveState?.activeAlertCount ? String(liveState.activeAlertCount) : undefined,
          badgeColor: 'bg-rose-500 text-white',
        },
        { name: 'AI Operations Copilot', path: '/app/copilot', icon: Bot, badge: 'AI' },
      ],
    },
    {
      group: 'Audit & Records',
      items: [
        { name: 'Reports & Analytics', path: '/app/reports', icon: FileBarChart },
        { name: 'Operation History', path: '/app/history', icon: History },
      ],
    },
  ];

  // Add Admin Users link if user is ADMIN
  if (user?.role === 'ADMIN') {
    navGroups.push({
      group: 'Administration',
      items: [
        { name: 'User Management', path: '/app/admin/users', icon: Users },
        { name: 'System Settings', path: '/app/settings', icon: Settings },
        { name: 'My Profile', path: '/app/profile', icon: UserCheck },
      ],
    });
  } else {
    navGroups.push({
      group: 'Account',
      items: [
        { name: 'System Settings', path: '/app/settings', icon: Settings },
        { name: 'My Profile', path: '/app/profile', icon: UserCheck },
      ],
    });
  }

  return (
    <aside className="w-64 bg-[#061524] border-r border-slate-800 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between">
        <NavLink to="/app/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-md shadow-cyan-500/20">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-sm tracking-wider text-white">PETRONEXUS</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">360</span>
            </div>
            <span className="text-[9px] text-slate-400 block -mt-0.5 tracking-tight font-mono">DIGITAL TWIN OPS</span>
          </div>
        </NavLink>

        <div className="flex items-center" title={isConnected ? 'Live Socket Connected' : 'Connecting to Digital Twin'}>
          <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.group}>
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5 font-mono">
              {group.group}
            </span>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold ${
                        item.badgeColor || 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* User Footer Profile Chip */}
      <div className="p-3 border-t border-slate-800 bg-[#05111D]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
              alt={user?.name || 'User'}
              className="w-8 h-8 rounded-lg object-cover border border-slate-700 shrink-0"
            />
            <div className="truncate">
              <span className="text-xs font-semibold text-white block truncate">{user?.name || 'Operator'}</span>
              <span className="text-[10px] text-cyan-400 font-mono tracking-tight uppercase block">
                {user?.role || 'OPERATOR'}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
