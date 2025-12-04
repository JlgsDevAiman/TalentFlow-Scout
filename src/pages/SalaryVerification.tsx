import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, XCircle, TrendingUp, User, FileCheck, AlertTriangle, Briefcase, DollarSign, Award, Shield } from 'lucide-react';

interface CandidateData {
  candidate: {
    name: string;
    position: string;
    years_experience: number;
    current_employer: string;
    current_salary_basic: number;
    current_salary_allowances: number;
    current_salary_total: number;
  };
  salary_proposal: {
    basic_salary: number;
    allowances_total: number;
    total_salary: number;
    employer_contribution: number;
    total_ctc: number;
    band_min: number;
    band_mid: number;
    band_max: number;
    range_fit_label: string;
    internal_parity_text: string;
    budget_fit_text: string;
    risk_flags: string[];
  };
  assessment: {
    status: string;
    score: string;
    strengths: string[];
    development_areas: string[];
  };
  background_check: {
    status: string;
    notes: string;
  };
  meta: {
    recruiter_name: string;
  };
}

export default function SalaryVerification() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CandidateData | null>(null);
  const [error, setError] = useState('');
  const [candidateId, setCandidateId] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('candidate_id');
    const token = params.get('token');

    if (id) {
      setCandidateId(id);
      fetchVerificationData(id);
    } else if (token) {
      fetchVerificationDataByToken(token);
    } else {
      setError('No candidate ID or token provided in URL');
      setLoading(false);
    }
  }, []);

  const fetchVerificationDataByToken = async (token: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-salary-verification?token=${token}`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch verification data');
      }

      const result = await response.json();
      setCandidateId(result.candidate_id || '');
      setData(result);
    } catch (err) {
      setError('Unable to load candidate data. Please contact HR.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVerificationData = async (id: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-salary-verification?candidate_id=${id}`,
        {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch verification data');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError('Unable to load candidate data. Please contact HR.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRangeFitColor = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes('within band') && !lower.includes('above')) {
      return 'bg-green-100 text-green-800 border-green-300';
    }
    if (lower.includes('near upper') || lower.includes('yellow')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
    return 'bg-red-100 text-red-800 border-red-300';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading verification data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Unable to Load Data</h2>
          <p className="text-slate-600">{error || 'An unexpected error occurred.'}</p>
        </div>
      </div>
    );
  }

  const { candidate, salary_proposal, assessment, background_check, meta } = data;

  const salaryIncrement = candidate.current_salary_total > 0
    ? ((salary_proposal.total_salary - candidate.current_salary_total) / candidate.current_salary_total) * 100
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white py-8 px-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Salary Package Verification</h1>
          <p className="text-cyan-100 text-lg">{candidate.name} – {candidate.position}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Executive Summary - New Comprehensive Section */}
        <div className="bg-gradient-to-br from-white to-cyan-50 rounded-lg shadow-lg border-2 border-cyan-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <FileCheck className="w-6 h-6 text-cyan-600" />
            <h2 className="text-2xl font-bold text-slate-800">Executive Summary</h2>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-blue-600" />
                <p className="text-xs font-medium text-slate-600 uppercase">Experience</p>
              </div>
              <p className="text-2xl font-bold text-slate-800">{candidate.years_experience} <span className="text-base font-normal text-slate-600">years</span></p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <p className="text-xs font-medium text-slate-600 uppercase">Current Salary</p>
              </div>
              <p className="text-2xl font-bold text-slate-800">RM {candidate.current_salary_total.toLocaleString()}</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-cyan-600" />
                <p className="text-xs font-medium text-slate-600 uppercase">Proposed Salary</p>
              </div>
              <p className="text-2xl font-bold text-cyan-700">RM {salary_proposal.total_salary.toLocaleString()}</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <p className="text-xs font-medium text-slate-600 uppercase">Increment</p>
              </div>
              <p className={`text-2xl font-bold ${salaryIncrement > 0 ? 'text-green-600' : 'text-slate-800'}`}>
                {salaryIncrement > 0 ? '+' : ''}{salaryIncrement.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Candidate Profile */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 mb-4">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-cyan-600" />
              Candidate Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600 mb-1">Full Name</p>
                <p className="font-semibold text-slate-800">{candidate.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Position Applied</p>
                <p className="font-semibold text-slate-800">{candidate.position}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Current Employer</p>
                <p className="font-semibold text-slate-800">{candidate.current_employer || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Years of Experience</p>
                <p className="font-semibold text-slate-800">{candidate.years_experience} years</p>
              </div>
            </div>
          </div>

          {/* Assessment & Background Check Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-slate-800">Assessment</h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  assessment.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {assessment.status}
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-slate-600">Score</p>
                  <p className="text-xl font-bold text-amber-700">{assessment.score}</p>
                </div>
                {assessment.strengths.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-green-700 mb-1">Key Strengths</p>
                    <p className="text-sm text-slate-700 line-clamp-2">{assessment.strengths.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-slate-800">Background Check</h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  background_check.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {background_check.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-slate-700 leading-relaxed">{background_check.notes || 'No issues found'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Salary Breakdown Details */}
        <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-cyan-600" />
            <h2 className="text-xl font-bold text-slate-800">Detailed Salary Comparison</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Current Salary Breakdown */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h3 className="font-semibold text-slate-800 mb-3">Current Salary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Basic:</span>
                  <span className="font-semibold">RM {candidate.current_salary_basic.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Allowances:</span>
                  <span className="font-semibold">RM {candidate.current_salary_allowances.toLocaleString()}</span>
                </div>
                <div className="border-t border-slate-300 pt-2 mt-2 flex justify-between">
                  <span className="font-semibold text-slate-800">Total:</span>
                  <span className="font-bold text-lg text-slate-800">RM {candidate.current_salary_total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Proposed Salary Breakdown */}
            <div className="bg-cyan-50 border-2 border-cyan-200 rounded-lg p-4">
              <h3 className="font-semibold text-cyan-800 mb-3">Proposed Salary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-700">Basic:</span>
                  <span className="font-semibold text-slate-800">RM {salary_proposal.basic_salary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-700">Allowances:</span>
                  <span className="font-semibold text-slate-800">RM {salary_proposal.allowances_total.toLocaleString()}</span>
                </div>
                <div className="border-t-2 border-cyan-300 pt-2 mt-2 flex justify-between">
                  <span className="font-semibold text-cyan-800">Total:</span>
                  <span className="font-bold text-lg text-cyan-700">RM {salary_proposal.total_salary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs pt-2 border-t border-cyan-200">
                  <span className="text-slate-600">Employer Contribution:</span>
                  <span className="font-medium">RM {salary_proposal.employer_contribution.toLocaleString()}</span>
                </div>
                <div className="flex justify-between bg-cyan-100 rounded p-2 mt-2">
                  <span className="font-semibold text-cyan-900">Total CTC:</span>
                  <span className="font-bold text-cyan-900">RM {salary_proposal.total_ctc.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Increment Summary */}
          <div className={`rounded-lg p-4 mb-6 ${
            salaryIncrement > 20 ? 'bg-orange-50 border-2 border-orange-300' :
            salaryIncrement > 10 ? 'bg-yellow-50 border border-yellow-300' :
            'bg-green-50 border border-green-300'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-1">Salary Increment</p>
                <p className="text-3xl font-bold text-slate-800">
                  {salaryIncrement > 0 ? '+' : ''}RM {(salary_proposal.total_salary - candidate.current_salary_total).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-700 mb-1">Percentage Increase</p>
                <p className={`text-3xl font-bold ${
                  salaryIncrement > 20 ? 'text-orange-600' :
                  salaryIncrement > 10 ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {salaryIncrement > 0 ? '+' : ''}{salaryIncrement.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Internal Band & Analysis */}
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-700 mb-2">Internal Salary Band</p>
            <div className="bg-slate-100 rounded-lg p-3 flex items-center justify-between">
              <span className="text-slate-700">Min: <strong>RM {salary_proposal.band_min.toLocaleString()}</strong></span>
              <span className="text-slate-700">Mid: <strong>RM {salary_proposal.band_mid.toLocaleString()}</strong></span>
              <span className="text-slate-700">Max: <strong>RM {salary_proposal.band_max.toLocaleString()}</strong></span>
            </div>
          </div>

          {/* Range Fit */}
          <div className="space-y-3 mb-6">
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Salary Range Fit</p>
              <div className={`inline-block px-4 py-2 rounded-lg border-2 font-semibold ${getRangeFitColor(salary_proposal.range_fit_label)}`}>
                {salary_proposal.range_fit_label}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">Internal Parity</p>
              <p className="text-slate-700">{salary_proposal.internal_parity_text}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 mb-1">Budget Fit</p>
              <p className="text-slate-700">{salary_proposal.budget_fit_text}</p>
            </div>
          </div>

          {/* Risk Flags */}
          <div className={`rounded-lg p-4 ${salary_proposal.risk_flags.length > 0 ? 'bg-red-50 border-2 border-red-300' : 'bg-green-50 border border-green-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              {salary_proposal.risk_flags.length > 0 ? (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              <p className="font-semibold text-slate-800">Risk Flags</p>
            </div>

            {salary_proposal.risk_flags.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-red-800">
                {salary_proposal.risk_flags.map((flag, index) => (
                  <li key={index}>{flag}</li>
                ))}
              </ul>
            ) : (
              <p className="text-green-700">No risk flags</p>
            )}
          </div>
        </div>

        {/* Additional Details - Assessment & Background */}
        <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileCheck className="w-5 h-5 text-cyan-600" />
            <h2 className="text-xl font-bold text-slate-800">Detailed Assessment & Verification</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assessment Details */}
            <div>
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                Assessment Results
              </h3>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    assessment.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {assessment.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Score:</span>
                  <span className="font-bold text-lg text-amber-700">{assessment.score}</span>
                </div>

                {assessment.strengths.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-2">Strengths:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                      {assessment.strengths.map((strength, index) => (
                        <li key={index}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {assessment.development_areas.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-orange-700 mb-2">Development Areas:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                      {assessment.development_areas.map((area, index) => (
                        <li key={index}>{area}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Background Check Details */}
            <div>
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Background Verification
              </h3>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    background_check.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    background_check.status === 'Not Required' ? 'bg-slate-100 text-slate-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {background_check.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-2">Verification Notes:</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{background_check.notes || 'No additional notes'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recruiter Info */}
          <div className="mt-6 pt-4 border-t border-slate-200 text-sm text-slate-500 text-right">
            Prepared by: <span className="font-medium text-slate-700">{meta.recruiter_name}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
