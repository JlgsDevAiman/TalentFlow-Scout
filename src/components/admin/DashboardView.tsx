import { useState, useEffect } from 'react';
import { Users, CheckCircle, Clock, XCircle, Briefcase, Building2, Wrench, UserCog, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import EnhancedDashboard from './EnhancedDashboard';

interface Stats {
  totalCandidates: number;
  hired: number;
  shortlisted: number;
  processing: number;
  rejected: number;
  businessUnits: {
    holdingCompany: number;
    outsourcingServices: number;
    propertyDevelopment: number;
    propertyInvestment: number;
    integratedCommunitySolutions: number;
  };
  jobCategories: {
    management: number;
    supportServices: number;
    technical: number;
    nonTechnical: number;
  };
}

interface DashboardViewProps {
  onNavigate: (tab: 'dashboard' | 'candidates' | 'users' | 'reports' | 'approvers') => void;
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const [stats, setStats] = useState<Stats>({
    totalCandidates: 0,
    hired: 0,
    shortlisted: 0,
    processing: 0,
    rejected: 0,
    businessUnits: {
      holdingCompany: 0,
      outsourcingServices: 0,
      propertyDevelopment: 0,
      propertyInvestment: 0,
      integratedCommunitySolutions: 0,
    },
    jobCategories: {
      management: 0,
      supportServices: 0,
      technical: 0,
      nonTechnical: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: candidates } = await supabase
        .from('candidates')
        .select('status, business_unit, job_category');

      const totalCandidates = candidates?.length || 0;

      const hired = candidates?.filter(c => c.status === 'Hired').length || 0;
      const shortlisted = candidates?.filter(c => c.status === 'Shortlisted').length || 0;
      const rejected = candidates?.filter(c => c.status === 'Rejected').length || 0;

      const processing = candidates?.filter(c =>
        c.status !== 'Hired' && c.status !== 'Rejected' && c.status !== 'Shortlisted'
      ).length || 0;

      const businessUnits = {
        holdingCompany: candidates?.filter(c => c.business_unit === 'Holding Company').length || 0,
        outsourcingServices: candidates?.filter(c => c.business_unit === 'Outsourcing Services').length || 0,
        propertyDevelopment: candidates?.filter(c => c.business_unit === 'Property Development').length || 0,
        propertyInvestment: candidates?.filter(c => c.business_unit === 'Property Investment').length || 0,
        integratedCommunitySolutions: candidates?.filter(c => c.business_unit === 'Integrated Community Solutions').length || 0,
      };

      const jobCategories = {
        management: candidates?.filter(c => c.job_category === 'Management').length || 0,
        supportServices: candidates?.filter(c => c.job_category === 'Support Services').length || 0,
        technical: candidates?.filter(c => c.job_category === 'Technical').length || 0,
        nonTechnical: candidates?.filter(c => c.job_category === 'Non-technical').length || 0,
      };

      setStats({
        totalCandidates,
        hired,
        shortlisted,
        processing,
        rejected,
        businessUnits,
        jobCategories,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <EnhancedDashboard />

      <div className="border-t-2 border-slate-200 pt-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Candidate Pipeline Overview</h2>
          <p className="text-slate-600 mt-1">Traditional candidate statistics and insights</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-slate-600 font-medium mb-1">Total Candidates</p>
          <p className="text-3xl font-bold text-slate-800">{stats.totalCandidates}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-emerald-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-sm text-slate-600 font-medium mb-1">Hired</p>
          <p className="text-3xl font-bold text-emerald-600">{stats.hired}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-slate-600 font-medium mb-1">Shortlisted</p>
          <p className="text-3xl font-bold text-green-600">{stats.shortlisted}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-amber-50 rounded-lg">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-sm text-slate-600 font-medium mb-1">Processing</p>
          <p className="text-3xl font-bold text-amber-600">{stats.processing}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-red-50 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <p className="text-sm text-slate-600 font-medium mb-1">Rejected</p>
          <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="w-5 h-5 text-cyan-600" />
            <h3 className="text-lg font-semibold text-slate-800">
              Candidate Insights - Business Unit
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-cyan-300 transition-colors">
              <span className="text-sm font-medium text-slate-700">Holding Company</span>
              <span className="text-lg font-bold text-cyan-600">{stats.businessUnits.holdingCompany}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-cyan-300 transition-colors">
              <span className="text-sm font-medium text-slate-700">Outsourcing Services</span>
              <span className="text-lg font-bold text-cyan-600">{stats.businessUnits.outsourcingServices}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-cyan-300 transition-colors">
              <span className="text-sm font-medium text-slate-700">Property Development</span>
              <span className="text-lg font-bold text-cyan-600">{stats.businessUnits.propertyDevelopment}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-cyan-300 transition-colors">
              <span className="text-sm font-medium text-slate-700">Property Investment</span>
              <span className="text-lg font-bold text-cyan-600">{stats.businessUnits.propertyInvestment}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-cyan-300 transition-colors">
              <span className="text-sm font-medium text-slate-700">Integrated Community Solutions</span>
              <span className="text-lg font-bold text-cyan-600">{stats.businessUnits.integratedCommunitySolutions}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Briefcase className="w-5 h-5 text-cyan-600" />
            <h3 className="text-lg font-semibold text-slate-800">
              Candidate Insights - Job Category
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserCog className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium text-slate-700">Management</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">{stats.jobCategories.management}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-100 hover:border-emerald-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="font-medium text-slate-700">Support Services</span>
              </div>
              <span className="text-2xl font-bold text-emerald-600">{stats.jobCategories.supportServices}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100 hover:border-purple-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Wrench className="w-5 h-5 text-purple-600" />
                </div>
                <span className="font-medium text-slate-700">Technical</span>
              </div>
              <span className="text-2xl font-bold text-purple-600">{stats.jobCategories.technical}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-100 hover:border-amber-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Briefcase className="w-5 h-5 text-amber-600" />
                </div>
                <span className="font-medium text-slate-700">Non-technical</span>
              </div>
              <span className="text-2xl font-bold text-amber-600">{stats.jobCategories.nonTechnical}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
