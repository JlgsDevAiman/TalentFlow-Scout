import { useState, useEffect } from 'react';
import { RefreshCw, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp, Users, FileCheck, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CandidateStats {
  total: number;
  inProgress: number;
  completed: number;
  pending: number;
}

interface SLAStatus {
  candidateId: string;
  name: string;
  position: string;
  currentStep: string;
  daysInCurrentStep: number;
  isOverdue: boolean;
  slaTarget: number;
}

const WORKFLOW_STEPS = [
  'Selected for Hiring',
  'Assessment Notification Sent',
  'Assessment Completed',
  'Background Check Completed',
  'Salary Package Prepared',
  'Ready for Verification – Head, Talent Strategy',
  'Ready for Recommendation – Hiring Manager 1',
  'Ready for Recommendation – Hiring Manager 2',
  'Ready for Approval – Approver 1',
  'Ready for Approval – Approver 2',
  'Ready for Contract Issuance',
  'Contract Issued'
];

const SLA_TARGETS: Record<string, number> = {
  'Assessment Notification Sent': 2,
  'Ready for Verification – Head, Talent Strategy': 2,
  'Ready for Recommendation – Hiring Manager 1': 2,
  'Ready for Recommendation – Hiring Manager 2': 2,
  'Ready for Approval – Approver 1': 1,
  'Ready for Approval – Approver 2': 1,
};

export default function EnhancedDashboard() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [stats, setStats] = useState<CandidateStats>({ total: 0, inProgress: 0, completed: 0, pending: 0 });
  const [slaStatus, setSlaStatus] = useState<SLAStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('candidate_hiring_flow')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCandidates(data || []);
      calculateStats(data || []);
      calculateSLA(data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: any[]) => {
    const total = data.length;
    const completed = data.filter(c => c.current_step === 'Contract Issued').length;
    const pending = data.filter(c =>
      c.current_step?.includes('Ready for') ||
      c.current_step?.includes('Notification Sent')
    ).length;
    const inProgress = total - completed;

    setStats({ total, inProgress, completed, pending });
  };

  const calculateSLA = (data: any[]) => {
    const slaData: SLAStatus[] = data
      .filter(c => c.current_step !== 'Contract Issued')
      .map(candidate => {
        const createdAt = new Date(candidate.created_at);
        const now = new Date();
        const daysInCurrentStep = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const slaTarget = SLA_TARGETS[candidate.current_step] || 3;
        const isOverdue = daysInCurrentStep > slaTarget;

        return {
          candidateId: candidate.candidate_id,
          name: candidate.name,
          position: candidate.position,
          currentStep: candidate.current_step,
          daysInCurrentStep,
          isOverdue,
          slaTarget
        };
      })
      .sort((a, b) => b.daysInCurrentStep - a.daysInCurrentStep);

    setSlaStatus(slaData);
  };

  const getStepProgress = (currentStep: string): number => {
    const index = WORKFLOW_STEPS.indexOf(currentStep);
    if (index === -1) return 0;
    return Math.round((index / (WORKFLOW_STEPS.length - 1)) * 100);
  };

  const getProgressColor = (progress: number): string => {
    if (progress >= 90) return 'bg-green-600';
    if (progress >= 70) return 'bg-cyan-600';
    if (progress >= 50) return 'bg-blue-600';
    if (progress >= 30) return 'bg-amber-600';
    return 'bg-slate-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Hiring Dashboard Overview</h2>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-cyan-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Candidates</p>
              <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
            </div>
            <Users className="w-10 h-10 text-cyan-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">In Progress</p>
              <p className="text-3xl font-bold text-slate-800">{stats.inProgress}</p>
            </div>
            <Clock className="w-10 h-10 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-amber-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Pending Action</p>
              <p className="text-3xl font-bold text-slate-800">{stats.pending}</p>
            </div>
            <AlertCircle className="w-10 h-10 text-amber-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Completed</p>
              <p className="text-3xl font-bold text-slate-800">{stats.completed}</p>
            </div>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Candidate Progress Tracking
          </h3>
        </div>
        <div className="p-6 space-y-4">
          {candidates.slice(0, 10).map(candidate => {
            const progress = getStepProgress(candidate.current_step);
            const progressColor = getProgressColor(progress);

            return (
              <div key={candidate.candidate_id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-800">{candidate.name}</h4>
                    <p className="text-sm text-slate-600">{candidate.position}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-cyan-600">{progress}%</span>
                    <p className="text-xs text-slate-500">Complete</p>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                    <span>Current: {candidate.current_step}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full ${progressColor} transition-all duration-500 rounded-full`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Started: {new Date(candidate.created_at).toLocaleDateString()}
                  </span>
                  {candidate.current_step === 'Contract Issued' && (
                    <span className="flex items-center gap-1 text-green-600 font-semibold">
                      <FileCheck className="w-3 h-3" />
                      Complete
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5" />
            SLA Status & Pending Actions
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Candidate</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Position</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Current Step</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Days Pending</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">SLA Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {slaStatus.map(item => (
                <tr key={item.candidateId} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-800">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.position}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.currentStep}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`font-semibold ${item.isOverdue ? 'text-red-600' : 'text-slate-800'}`}>
                      {item.daysInCurrentStep} {item.daysInCurrentStep === 1 ? 'day' : 'days'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {item.isOverdue ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        <XCircle className="w-3 h-3" />
                        Overdue ({item.slaTarget}d target)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3" />
                        On Track
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
