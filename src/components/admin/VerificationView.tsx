import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, FileCheck, DollarSign, Mail, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { updateVerificationDecision, HiringCandidate } from '../../services/hiringFlowService';

export default function VerificationView() {
  const [candidates, setCandidates] = useState<HiringCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('candidate_hiring_flow')
        .select('*')
        .eq('current_step', 'Ready for Verification – Head, Talent Strategy')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCandidates(data || []);
    } catch (error) {
      console.error('Error loading candidates:', error);
      alert('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (candidateId: string, decision: 'Approved' | 'Rejected' | 'Request Change') => {
    const comment = commentInputs[candidateId] || '';

    if (!comment.trim()) {
      alert('Please add a comment for your decision');
      return;
    }

    setProcessingId(candidateId);
    try {
      await updateVerificationDecision(candidateId, decision, comment);
      await loadCandidates();
      setCommentInputs({ ...commentInputs, [candidateId]: '' });
    } catch (error) {
      console.error('Error submitting decision:', error);
      alert('Failed to submit decision');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-slate-800 mb-2">No Pending Verifications</h3>
        <p className="text-slate-600">There are no candidates awaiting verification at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Salary Package Verification</h2>
        <p className="text-slate-600">Review and approve salary packages for candidates</p>
      </div>

      {candidates.map((candidate) => (
        <div key={candidate.candidate_id} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white p-6">
            <h3 className="text-2xl font-bold mb-2">{candidate.name}</h3>
            <p className="text-cyan-100 flex items-center gap-2">
              <User className="w-4 h-4" />
              {candidate.position}
            </p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-cyan-600" />
                    Candidate Information
                  </h4>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">Recruiter:</span>{' '}
                      <span className="text-slate-600">{candidate.recruiter}</span>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Email:</span>{' '}
                      <span className="text-slate-600">{candidate.recruiter_email}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-cyan-600" />
                    Assessment Status
                  </h4>
                  <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">Status:</span>{' '}
                      <span className={`font-semibold ${candidate.assessment_status === 'Completed' ? 'text-green-600' : 'text-orange-600'}`}>
                        {candidate.assessment_status}
                      </span>
                    </div>
                    {candidate.assessment_score && (
                      <div>
                        <span className="font-medium text-slate-700">Score:</span>{' '}
                        <span className="text-slate-600 font-semibold">{candidate.assessment_score}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-cyan-600" />
                    Background Check
                  </h4>
                  <div className="bg-slate-50 rounded-lg p-4 text-sm">
                    <span className={`font-semibold ${candidate.background_check_status === 'Completed' ? 'text-green-600' : 'text-orange-600'}`}>
                      {candidate.background_check_status}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-cyan-600" />
                  Proposed Salary Package
                </h4>
                <div className="space-y-3">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-slate-700 mb-1">Basic Salary</div>
                    <div className="text-lg font-bold text-slate-800">{candidate.salary_proposal?.basic_salary}</div>
                  </div>

                  {candidate.salary_proposal?.allowances && candidate.salary_proposal.allowances.length > 0 && (
                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-slate-700 mb-2">Allowances</div>
                      <div className="space-y-1">
                        {candidate.salary_proposal.allowances.map((allowance: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-slate-600">{allowance.name}</span>
                            <span className="text-slate-800 font-medium">{allowance.amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-slate-700">Total Salary</span>
                      <span className="text-2xl font-bold text-green-700">{candidate.salary_proposal?.total_salary}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h4 className="font-semibold text-slate-800 mb-3">Your Decision</h4>
              <textarea
                value={commentInputs[candidate.candidate_id] || ''}
                onChange={(e) => setCommentInputs({ ...commentInputs, [candidate.candidate_id]: e.target.value })}
                placeholder="Add your comment or feedback..."
                rows={3}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm"
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handleDecision(candidate.candidate_id, 'Approved')}
                  disabled={processingId === candidate.candidate_id}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5" />
                  Approve
                </button>
                <button
                  onClick={() => handleDecision(candidate.candidate_id, 'Request Change')}
                  disabled={processingId === candidate.candidate_id}
                  className="flex-1 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <AlertCircle className="w-5 h-5" />
                  Request Change
                </button>
                <button
                  onClick={() => handleDecision(candidate.candidate_id, 'Rejected')}
                  disabled={processingId === candidate.candidate_id}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
