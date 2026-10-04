import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { AppLayout } from './layouts/AppLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { PlatformPage } from './pages/public/PlatformPage';
import { FeaturesPage } from './pages/public/FeaturesPage';
import { TechnologyPage } from './pages/public/TechnologyPage';
import { LoginPage } from './pages/public/LoginPage';

// Authenticated Application Pages
import { DashboardPage } from './pages/app/DashboardPage';
import { DigitalTwinPage } from './pages/app/DigitalTwinPage';
import { SimulatorPage } from './pages/app/SimulatorPage';
import { SteamPage } from './pages/app/SteamPage';
import { WellsPage } from './pages/app/WellsPage';
import { WellDetailPage } from './pages/app/WellDetailPage';
import { PumpsPage } from './pages/app/PumpsPage';
import { PipelinesPage } from './pages/app/PipelinesPage';
import { AssetsPage } from './pages/app/AssetsPage';
import { WeatherPage } from './pages/app/WeatherPage';
import { MaintenancePage } from './pages/app/MaintenancePage';
import { SafetyPage } from './pages/app/SafetyPage';
import { AlertsPage } from './pages/app/AlertsPage';
import { CopilotPage } from './pages/app/CopilotPage';
import { ReportsPage } from './pages/app/ReportsPage';
import { HistoryPage } from './pages/app/HistoryPage';
import { UsersPage } from './pages/app/UsersPage';
import { SettingsPage } from './pages/app/SettingsPage';
import { ProfilePage } from './pages/app/ProfilePage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/platform" element={<PlatformPage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/technology" element={<TechnologyPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* Authenticated Control Room Routes */}
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="digital-twin" element={<DigitalTwinPage />} />
              <Route path="simulator" element={<SimulatorPage />} />
              <Route path="steam" element={<SteamPage />} />
              <Route path="wells" element={<WellsPage />} />
              <Route path="wells/:id" element={<WellDetailPage />} />
              <Route path="pumps" element={<PumpsPage />} />
              <Route path="pipelines" element={<PipelinesPage />} />
              <Route path="assets" element={<AssetsPage />} />
              <Route path="weather" element={<WeatherPage />} />
              <Route path="maintenance" element={<MaintenancePage />} />
              <Route path="safety" element={<SafetyPage />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="copilot" element={<CopilotPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="admin/users" element={<UsersPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
