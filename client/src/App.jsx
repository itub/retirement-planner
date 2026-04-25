import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './store/useAuth';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AccountsPage from './pages/AccountsPage';
import PlanPage from './pages/PlanPage';
import SimulationPage from './pages/SimulationPage';
import WithdrawalsPage from './pages/WithdrawalsPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 12, color: 'var(--muted)' }}>
      <svg width="28" height="28" viewBox="0 0 56 56">
        <ellipse cx="28" cy="32" rx="20" ry="23" fill="#f26419"/>
      </svg>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>Loading…</span>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { fetchUser } = useAuth();
  useEffect(() => { fetchUser(); }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"   element={<DashboardPage />} />
        <Route path="accounts"    element={<AccountsPage />} />
        <Route path="plan"        element={<PlanPage />} />
        <Route path="simulation"  element={<SimulationPage />} />
        <Route path="withdrawals" element={<WithdrawalsPage />} />
      </Route>
    </Routes>
  );
}
