import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, ThumbsUp, ThumbsDown } from 'lucide-react';

interface ApprovalType {
  type: 'hm1' | 'hm2' | 'approver1' | 'approver2';
  title: string;
  approveText: string;
  rejectText: string;
}

const APPROVAL_TYPES: Record<string, ApprovalType> = {
  hm1: {
    type: 'hm1',
    title: 'Hiring Manager Recommendation',
    approveText: 'Recommend',
    rejectText: 'Do Not Recommend'
  },
  hm2: {
    type: 'hm2',
    title: 'Hiring Manager 2 Recommendation',
    approveText: 'Recommend',
    rejectText: 'Do Not Recommend'
  },
  approver1: {
    type: 'approver1',
    title: 'Approver Decision',
    approveText: 'Approve',
    rejectText: 'Reject'
  },
  approver2: {
    type: 'approver2',
    title: 'Final Approver Decision',
    approveText: 'Approve',
    rejectText: 'Reject'
  }
};

export default function ApprovalResponse() {
  const [token, setToken] = useState<string | null>(null);
  const [approvalType, setApprovalType] = useState<ApprovalType | null>(null);
  const [candidateInfo, setCandidateInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [decision, setDecision] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    const typeParam = params.get('type');
    const candidateParam = params.get('candidate');
    const positionParam = params.get('position');

    if (tokenParam && typeParam) {
      setToken(tokenParam);
      const approvalTypeData = APPROVAL_TYPES[typeParam];
      if (approvalTypeData) {
        setApprovalType(approvalTypeData);
      } else {
        setError('Invalid approval type');
      }
      if (candidateParam && positionParam) {
        setCandidateInfo({
          name: decodeURIComponent(candidateParam),
          position: decodeURIComponent(positionParam)
        });
      }
    } else {
      setError('Invalid approval link');
    }
    setLoading(false);
  }, []);

  const handleSubmit = async (selectedDecision: string) => {
    if (!token) return;

    setDecision(selectedDecision);
    setSubmitting(true);
    setError(null);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-approval`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          token,
          decision: selectedDecision,
          comment: comment.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit decision');
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error('Error submitting decision:', err);
      setError(err.message || 'Failed to submit decision. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (error && !token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Invalid Link</h1>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Decision Submitted</h1>
          <p className="text-slate-600 mb-4">
            Your decision has been recorded successfully. The recruiter has been notified.
          </p>
          <div className={`inline-block px-4 py-2 rounded-lg font-semibold ${
            decision?.includes('Recommend') || decision === 'Approved' ? 'bg-green-100 text-green-700' :
            decision?.includes('Not') || decision === 'Rejected' ? 'bg-red-100 text-red-700' :
            'bg-amber-100 text-amber-700'
          }`}>
            {decision}
          </div>
        </div>
      </div>
    );
  }

  if (!approvalType) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Invalid Approval Type</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white p-6">
            <h1 className="text-3xl font-bold mb-2">{approvalType.title}</h1>
            {candidateInfo && (
              <p className="text-cyan-100">
                {candidateInfo.name} - {candidateInfo.position}
              </p>
            )}
          </div>

          <div className="p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Add Comment (Optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add any comments or feedback..."
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                disabled={submitting}
              />
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700 mb-3">Select Your Decision:</p>

              <button
                onClick={() => handleSubmit(approvalType.approveText)}
                disabled={submitting}
                className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ThumbsUp className="w-6 h-6" />
                {submitting && decision === approvalType.approveText ? 'Submitting...' : approvalType.approveText}
              </button>

              <button
                onClick={() => handleSubmit('Request Change')}
                disabled={submitting}
                className="w-full px-6 py-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <AlertCircle className="w-6 h-6" />
                {submitting && decision === 'Request Change' ? 'Submitting...' : 'Request Change'}
              </button>

              <button
                onClick={() => handleSubmit(approvalType.rejectText)}
                disabled={submitting}
                className="w-full px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ThumbsDown className="w-6 h-6" />
                {submitting && decision === approvalType.rejectText ? 'Submitting...' : approvalType.rejectText}
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-6 text-center">
              This link is valid for 7 days and can only be used once.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
