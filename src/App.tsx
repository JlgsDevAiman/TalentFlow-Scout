import { useAuth } from './contexts/AuthContext';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import ApprovalResponse from './pages/ApprovalResponse';
import SalaryVerification from './pages/SalaryVerification';
import { Loader2 } from 'lucide-react';

function App() {
  const currentPath = window.location.pathname;

  console.log('[App Router] Current path:', currentPath);
  console.log('[App Router] Search params:', window.location.search);

  if (currentPath === '/verify' || currentPath === '/salary-verification') {
    console.log('[App Router] Rendering SalaryVerification page');
    return <SalaryVerification />;
  }

  if (currentPath === '/approve') {
    console.log('[App Router] Rendering ApprovalResponse page');
    return <ApprovalResponse />;
  }

  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return user ? <Dashboard /> : <Auth />;
}

export default App;
