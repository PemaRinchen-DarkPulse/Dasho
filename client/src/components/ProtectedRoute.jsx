import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getUser, getToken } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function ProtectedRoute({ role }) {
  const location = useLocation();
  const token = getToken();
  const user = getUser();
  const { toast } = useToast();

  if (!token || !user) {
    toast({ title: 'Sign in required', description: 'Please log in to access this page.' });
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    );
  }

  if (role && user.role !== role) {
    toast({ title: 'Restricted', description: 'Admin access only.', variant: 'destructive' });
    // If role mismatch, redirect to a sensible default
    return <Navigate to={user.role === 'admin' ? '/admin-dashboard' : '/equipment'} replace />;
  }

  return <Outlet />;
}
