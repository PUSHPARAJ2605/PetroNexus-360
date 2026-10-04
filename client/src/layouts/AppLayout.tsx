import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { TopHeader } from '../components/TopHeader';
import { AssetDrawer } from '../components/AssetDrawer';
import { useAuth } from '../context/AuthContext';

export const AppLayout: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [selectedAssetTag, setSelectedAssetTag] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#071A2B] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-mono text-xs">INITIALIZING PETRONEXUS DIGITAL TWIN...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#071A2B]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopHeader />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gradient-to-b from-[#071A2B] to-[#051422]">
          <Outlet context={{ openAssetDrawer: (tag: string) => setSelectedAssetTag(tag) }} />
        </main>
      </div>

      {/* Global Asset Detail Drawer */}
      <AssetDrawer
        assetTag={selectedAssetTag}
        onClose={() => setSelectedAssetTag(null)}
      />
    </div>
  );
};
