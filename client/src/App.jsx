import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.jsx';
import Login        from './pages/Login.jsx';
import Dashboard    from './pages/Dashboard.jsx';
import Repos        from './pages/Repos.jsx';
import RepoPRs      from './pages/RepoPRs.jsx';
import ReviewDetail from './pages/ReviewDetail.jsx';
import RepoSettings from './pages/RepoSettings.jsx';
import Analytics    from './pages/Analytics.jsx';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 32 }}>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const App = () => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 32 }}>Loading...</div>;

  return (
    <Routes>
      <Route path="/login"              element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard"          element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/repos"              element={<ProtectedRoute><Repos /></ProtectedRoute>} />
      <Route path="/repos/:repoId"      element={<ProtectedRoute><RepoPRs /></ProtectedRoute>} />
      <Route path="/repos/:repoId/settings" element={<ProtectedRoute><RepoSettings /></ProtectedRoute>} />
      <Route path="/reviews/:prId"      element={<ProtectedRoute><ReviewDetail /></ProtectedRoute>} />
      <Route path="/analytics"          element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
      <Route path="*"                   element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
};

export default App;