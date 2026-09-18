// Route guard — see README section 6, Phase 2 (Auth & RBAC) DoD: "hitting a role-guarded
// route with the wrong role" must not render that route's content.
//
// Usage: <Route path="/police" element={<ProtectedRoute roles={['POLICE']}><PoliceDashboard />
// </ProtectedRoute>} />

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_DASHBOARD_PATH } from '../constants';

function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) return null; // avoid a flash-redirect to /login while /auth/me is still in flight

  if (!user) return <Navigate to="/login" replace />;

  // Logged in, but as the wrong role for this route — send them to their own dashboard
  // instead of a bare 403 page, since the actual enforcement already happened server-side.
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={ROLE_DASHBOARD_PATH[user.role]} replace />;
  }

  return children;
}

export default ProtectedRoute;
