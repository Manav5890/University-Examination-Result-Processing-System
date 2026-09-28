import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { ResultsPage } from './pages/ResultsPage';

export function App() {
  const { account } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={account ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/signup" element={account ? <Navigate to="/" replace /> : <SignupPage />} />
      <Route path="/" element={account ? <DashboardPage /> : <Navigate to="/login" replace />} />
      <Route path="/results" element={account ? <ResultsPage /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to={account ? '/' : '/login'} replace />} />
    </Routes>
  );
}
