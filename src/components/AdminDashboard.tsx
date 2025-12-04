import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LayoutDashboard, Users, UserCog, FileText, ClipboardCheck, CheckSquare } from 'lucide-react';
import DashboardView from './admin/DashboardView';
import CandidatesView from './admin/CandidatesView';
import UserManagement from './admin/UserManagement';
import ReportsView from './admin/ReportsView';
import ApproversManagement from './admin/ApproversManagement';
import HiringApprovalView from './admin/HiringApprovalView';
import VerificationView from './admin/VerificationView';

type TabType = 'dashboard' | 'candidates' | 'users' | 'reports' | 'approvers' | 'hiring-approval' | 'verification';

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const tabs = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'candidates' as TabType, label: 'Candidates', icon: Users },
    { id: 'hiring-approval' as TabType, label: 'Hiring Approval', icon: ClipboardCheck },
    { id: 'verification' as TabType, label: 'Verification', icon: CheckSquare },
    { id: 'users' as TabType, label: 'User Management', icon: UserCog },
    { id: 'reports' as TabType, label: 'Reports', icon: FileText },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onNavigate={handleTabChange} />;
      case 'candidates':
        return <CandidatesView />;
      case 'hiring-approval':
        return <HiringApprovalView />;
      case 'verification':
        return <VerificationView />;
      case 'users':
        return <UserManagement />;
      case 'approvers':
        return <ApproversManagement />;
      case 'reports':
        return <ReportsView />;
      default:
        return <DashboardView onNavigate={handleTabChange} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-cyan-600" />
            <div>
              <h1 className="text-xl font-bold text-slate-800">TalentFlow Scout</h1>
              <p className="text-xs text-cyan-600 font-medium">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium text-left ${
                  activeTab === tab.id
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="mb-3 px-4">
            <p className="text-xs text-slate-500 mb-1">Signed in as</p>
            <p className="text-sm text-slate-700 font-medium truncate">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8">
        {renderContent()}
      </main>
    </div>
  );
}
