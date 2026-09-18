import { Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import CitizenDashboard from './pages/CitizenDashboard';
import PoliceDashboard from './pages/PoliceDashboard';
import AmbulanceDashboard from './pages/AmbulanceDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

// Route table for Phase 2 (Auth & RBAC) — see README section 6. Each dashboard route is
// wrapped in ProtectedRoute so an unauthenticated visitor lands on /login and a
// wrong-role visitor is bounced to their own dashboard instead of seeing someone else's.
function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/citizen"
        element={
          <ProtectedRoute roles={['CITIZEN']}>
            <CitizenDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/police"
        element={
          <ProtectedRoute roles={['POLICE']}>
            <PoliceDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ambulance"
        element={
          <ProtectedRoute roles={['AMBULANCE']}>
            <AmbulanceDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
