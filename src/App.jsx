import React, { useState } from 'react';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import AddHabitModal from './components/common/AddHabitModal';
import QuickCheckInModal from './components/common/QuickCheckInModal';
import { HealthCheckProvider } from './context/HealthCheckContext';
import { AuthProvider } from './auth/AuthProvider';
import { useAuth } from './auth/useAuth';
import Dashboard from './pages/Dashboard';
import DailyChecklist from './pages/DailyChecklist';
import Recommendations from './pages/Recommendations';
import { LoginPage, SignUpPage } from './pages/AuthPages';
import ProgressPage from './pages/Progress';
import {
  ProfilePage,
  RemindersPage,
  SettingsPage,
} from './pages/Placeholders';

function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--hc-bg)]">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="min-h-screen lg:pl-64">
        <Header mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/checklist" element={<DailyChecklist />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/reminders" element={<RemindersPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />


            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
      <AddHabitModal />
      <QuickCheckInModal />
    </div>
  );
}

function AuthLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--hc-bg)] px-4">
      <p className="text-sm font-semibold text-[var(--hc-muted)]">Checking your session…</p>
    </main>
  );
}

function ProtectedApp() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoading />;
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <HealthCheckProvider>
      <AppLayout />
    </HealthCheckProvider>
  );
}

function AuthPageRoute({ children }) {
  const { session, loading } = useAuth();
  if (loading) return <AuthLoading />;
  return session ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AuthPageRoute><LoginPage /></AuthPageRoute>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/signup" element={<AuthPageRoute><SignUpPage /></AuthPageRoute>} />
          <Route path="/*" element={<ProtectedApp />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
