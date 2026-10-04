import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Layers, Activity, Menu, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Platform', href: '/platform' },
    { name: 'Features', href: '/features' },
    { name: 'Technology', href: '/technology' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#071A2B]/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-cyan-500 to-emerald-400 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300">
              <div className="w-full h-full bg-[#071A2B] rounded-[11px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-wider text-white">PETRONEXUS</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">360</span>
              </div>
              <span className="text-[10px] text-slate-400 tracking-tight block -mt-1">HEAVY OIL DIGITAL TWIN</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const active = location.pathname === link.href;
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`text-sm font-medium transition-colors ${
                    active ? 'text-cyan-400' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/app/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-sm font-semibold shadow-lg shadow-cyan-500/25 transition-all"
              >
                <Activity className="w-4 h-4" />
                Launch Control Room
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-sm font-medium transition-all"
              >
                <span>Operator Login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-400 hover:text-white p-2"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#071A2B] border-b border-slate-800 px-4 pt-2 pb-6 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-300 hover:text-cyan-400 py-2 text-base font-medium"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 border-t border-slate-800">
            <Link
              to={isAuthenticated ? "/app/dashboard" : "/login"}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500 text-black font-semibold text-sm"
            >
              {isAuthenticated ? "Launch Control Room" : "Operator Login"}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
