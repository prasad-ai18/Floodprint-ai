import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { SubmitPage } from './pages/SubmitPage';
import { ReportDetailPage } from './pages/ReportDetailPage';
import { MapPage } from './pages/MapPage';
import { InvestigationsPage } from './pages/InvestigationsPage';
import { TimelinePage } from './pages/TimelinePage';
import { ReportsHubPage } from './pages/ReportsHubPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuthPage } from './pages/AuthPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/submit" element={<SubmitPage />} />
            <Route path="/report/:id" element={<ReportDetailPage />} />
            <Route path="/investigation/:id" element={<ReportDetailPage />} />
            <Route path="/investigations" element={<InvestigationsPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/reports" element={<ReportsHubPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/signup" element={<AuthPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
