import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getUser, getToken } from '@/lib/api';

export default function ProtectedRoute({ role }) {
  const location = useLocation();
  const token = getToken();
  const user = getUser();

  if (!token || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  if (role && user.role !== role) {
    // If role mismatch, redirect to a sensible default
    return <Navigate to={user.role === 'admin' ? '/admin-dashboard' : '/equipment'} replace />;
  }

  return <Outlet />;
}
