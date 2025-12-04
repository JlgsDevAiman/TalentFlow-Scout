import { Mail, Phone, Briefcase, Calendar, Edit2, Trash2, Sparkles, Loader2, FileText, Download, Target, MoreVertical, CheckCircle, ClipboardList, MessageSquare, XCircle, Shield, ChevronDown, ChevronUp, GraduationCap, User, UserPlus } from 'lucide-react';
import { Candidate } from '../types/candidate';
import { useState } from 'react';
import { getCandidateFileUrl } from '../services/candidateService';
import { shortlistCandidate, sendForAssessment, scheduleInterview, rejectCandidate, sendForBackgroundCheck, transferToHiringApproval } from '../services/candidateActionService';

interface CandidateListProps {
  candidates: Candidate[];
  onEdit: (candidate: Candidate) => void;
  onDelete: (id: string) => void;
  onScore: (candidate: Candidate) => Promise<void>;
}

export default function CandidateList({ candidates, onEdit, onDelete, onScore }: CandidateListProps) {
  const [scoringId, setScoringId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [processingActionId, setProcessingActionId] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'Shortlisted': return 'bg-green-100 text-green-800';
      case 'Interview': return 'bg-cyan-100 text-cyan-800';
      case 'Assessment': return 'bg-amber-100 text-amber-800';
      case 'Background Check': return 'bg-indigo-100 text-indigo-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Hired': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleScore = async (candidate: Candidate) => {
    setScoringId(candidate.id);
    try {
      await onScore(candidate);
    } finally {
      setScoringId(null);
    }
  };

  const handleDownloadFile = async (candidate: Candidate) => {
    if (!candidate.jd_file_path) return;

    setDownloadingId(candidate.id);
    try {
      const url = await getCandidateFileUrl(candidate);
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Failed to download file:', error);
    } finally {
      setDownloadingId(null);
    }
  };

  const toggleCard = (candidateId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(candidateId)) {
        newSet.delete(candidateId);
      } else {
        newSet.add(candidateId);
      }
      return newSet;
    });
  };

  const handleAction = async (action: string, candidate: Candidate) => {
    setProcessingActionId(candidate.id);
    setActionMenuId(null);

    try {
      switch (action) {
        case 'shortlisted':
          await shortlistCandidate(candidate);
          break;
        case 'assessment':
          await sendForAssessment(candidate);
          break;
        case 'interview':
          await scheduleInterview(candidate);
          break;
        case 'hiring_approval':
          await transferToHiringApproval(candidate);
          break;
        case 'rejected':
          await rejectCandidate(candidate);
          break;
        case 'background_check':
          await sendForBackgroundCheck(candidate);
          break;
      }
      window.location.reload();
    } catch (error) {
      console.error('Failed to execute action:', error);
    } finally {
      setProcessingActionId(null);
    }
  };

  if (candidates.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm">
        <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates yet</h3>
        <p className="text-gray-500">Get started by adding your first candidate</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {candidates.map((candidate) => (
        <div
          key={candidate.id}
          className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => toggleCard(candidate.id)}
                  className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-cyan-600 transition-colors group"
                >
                  <span className="border-b-2 border-transparent group-hover:border-cyan-600">{candidate.full_name}</span>
                  {expandedCards.has(candidate.id) ? (
                    <ChevronUp className="w-4 h-4 text-cyan-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-cyan-600" />
                  )}
                </button>
                {candidate.jd_file_path && (
                  <FileText className="w-4 h-4 text-blue-600" title="Has job description file" />
                )}
              </div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(candidate.status)}`}>
                {candidate.status}
              </span>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <button
                  onClick={() => setActionMenuId(actionMenuId === candidate.id ? null : candidate.id)}
                  className="p-2 text-gray-600 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                  title="Actions"
                  disabled={processingActionId === candidate.id}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {actionMenuId === candidate.id && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <div className="py-1">
                      <button
                        onClick={() => handleAction('shortlisted', candidate)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Shortlist
                      </button>
                      <button
                        onClick={() => handleAction('assessment', candidate)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                      >
                        <ClipboardList className="w-4 h-4" />
                        Assessment
                      </button>
                      <button
                        onClick={() => handleAction('interview', candidate)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Interview
                      </button>
                      <button
                        onClick={() => handleAction('background_check', candidate)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                      >
                        <Shield className="w-4 h-4" />
                        Background Check
                      </button>
                      <button
                        onClick={() => handleAction('hiring_approval', candidate)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors"
                      >
                        <UserPlus className="w-4 h-4" />
                        Hiring Approval
                      </button>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button
                        onClick={() => handleAction('rejected', candidate)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => onEdit(candidate)}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit candidate"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(candidate.id)}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete candidate"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Briefcase className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{candidate.position_applied}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{candidate.email}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span>{candidate.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span>{candidate.years_experience} years experience</span>
            </div>
          </div>

          {(candidate.business_unit || candidate.job_category) && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-1 gap-2">
                {candidate.business_unit && (
                  <div className="flex items-start gap-2">
                    <div className="px-2 py-1 bg-cyan-50 border border-cyan-200 rounded text-xs font-medium text-cyan-700">
                      {candidate.business_unit}
                    </div>
                  </div>
                )}
                {candidate.job_category && (
                  <div className="flex items-start gap-2">
                    <div className="px-2 py-1 bg-blue-50 border border-blue-200 rounded text-xs font-medium text-blue-700">
                      {candidate.job_category}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {candidate.notes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-600 line-clamp-2">{candidate.notes}</p>
            </div>
          )}

          {candidate.ai_fit_score !== null && candidate.ai_fit_comment && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold text-gray-900">
                  AI Fit Score: {candidate.ai_fit_score}/100
                </span>
              </div>
              {candidate.ai_recommended_position && candidate.ai_recommended_position !== candidate.position_applied && (
                <div className="mb-2 flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg p-2">
                  <Target className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-green-900">Recommended Position</p>
                    <p className="text-sm text-green-700 font-semibold">{candidate.ai_recommended_position}</p>
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-600">{candidate.ai_fit_comment}</p>
            </div>
          )}

          {!expandedCards.has(candidate.id) && candidate.jd_file_path && candidate.jd_file_name && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between bg-slate-50 rounded-lg p-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText className="w-4 h-4 text-slate-600 flex-shrink-0" />
                  <span className="text-sm text-slate-700 truncate">{candidate.jd_file_name}</span>
                </div>
                <button
                  onClick={() => handleDownloadFile(candidate)}
                  disabled={downloadingId === candidate.id}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                  title="Download file"
                >
                  {downloadingId === candidate.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {expandedCards.has(candidate.id) && (
            <div className="mt-4 pt-4 border-t-2 border-gray-200 space-y-4">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-600" />
                  Extended Information
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <p className="text-xs text-slate-600 mb-1 font-medium">Submission Date</p>
                    <p className="text-slate-800 font-semibold">{new Date(candidate.created_at).toLocaleString()}</p>
                  </div>
                  {candidate.notes && (
                    <div className="bg-white rounded-lg p-3 border border-slate-200">
                      <p className="text-xs text-slate-600 mb-1 font-medium">Notes</p>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{candidate.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {candidate.ai_fit_comment && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border-2 border-amber-200">
                  <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    AI Detailed Analysis
                  </h4>
                  <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">{candidate.ai_fit_comment}</p>
                </div>
              )}

              {(candidate.jd_file_path || candidate.assessment_file_path || candidate.background_check_file_path) && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
                  <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Attached Documents
                  </h4>
                  <div className="space-y-2">
                    {candidate.jd_file_path && candidate.jd_file_name && (
                      <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-800">Resume / CV</p>
                            <p className="text-xs text-slate-600 truncate">{candidate.jd_file_name}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDownloadFile(candidate)}
                          disabled={downloadingId === candidate.id}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 flex-shrink-0"
                          title="Download file"
                        >
                          {downloadingId === candidate.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                    {candidate.assessment_file_path && candidate.assessment_file_name && (
                      <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-green-200">
                        <GraduationCap className="w-4 h-4 text-green-600" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-slate-800">Assessment Results</p>
                          <p className="text-xs text-slate-600">{candidate.assessment_file_name}</p>
                        </div>
                      </div>
                    )}
                    {candidate.background_check_file_path && candidate.background_check_file_name && (
                      <div className="flex items-center gap-3 bg-white rounded-lg p-3 border border-purple-200">
                        <CheckCircle className="w-4 h-4 text-purple-600" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-slate-800">Background Check</p>
                          <p className="text-xs text-slate-600">{candidate.background_check_file_name}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Added on {formatDate(candidate.created_at)}
            </span>
            {!candidate.ai_fit_score && (
              <button
                onClick={() => handleScore(candidate)}
                disabled={scoringId === candidate.id}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {scoringId === candidate.id ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Scoring...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    Get AI Score
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
