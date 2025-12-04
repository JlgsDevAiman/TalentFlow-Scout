import { useState, useEffect } from 'react';
import { Download, FileText, Calendar, Loader2, Users, CheckCircle, Mail, X, ClipboardCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type ReportType = 'all_candidates' | 'approval_process' | 'recent_candidates' | 'user_activity';

interface ReportStats {
  totalCandidates: number;
  approvalProcesses: number;
  recentCandidates: number;
  totalUsers: number;
}

export default function ReportsView() {
  const [generating, setGenerating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [selectedReport, setSelectedReport] = useState<ReportType>('approval_process');
  const [stats, setStats] = useState<ReportStats>({
    totalCandidates: 0,
    approvalProcesses: 0,
    recentCandidates: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: candidates } = await supabase
        .from('candidates')
        .select('created_at');

      const { data: approvals } = await supabase
        .from('approval_history')
        .select('id');

      const { data: users } = await supabase
        .from('profiles')
        .select('id');

      const totalCandidates = candidates?.length || 0;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentCandidates = candidates?.filter(
        c => new Date(c.created_at) > thirtyDaysAgo
      ).length || 0;

      setStats({
        totalCandidates,
        approvalProcesses: approvals?.length || 0,
        recentCandidates,
        totalUsers: users?.length || 0,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const reportTypes = [
    {
      id: 'approval_process' as ReportType,
      title: 'Approval Process Report',
      description: 'Export all approval processes with verifier, approver, and detailed status',
    },
    {
      id: 'all_candidates' as ReportType,
      title: 'All Candidates Report',
      description: 'Export all candidate data including personal information, skills, and scores',
    },
    {
      id: 'recent_candidates' as ReportType,
      title: 'Recent Candidates Report',
      description: 'Export candidates added in the last 30 days',
    },
    {
      id: 'user_activity' as ReportType,
      title: 'User Activity Report',
      description: 'Export user activity and statistics',
    },
  ];

  const generateReport = async () => {
    setGenerating(true);
    try {
      let data: any[] = [];
      let reportType = '';
      let filename = '';

      switch (selectedReport) {
        case 'approval_process':
          const { data: approvalData } = await supabase
            .from('approval_history')
            .select(`
              id,
              approval_type,
              status,
              comments,
              created_at,
              updated_at,
              candidate_id,
              approver_id,
              candidates (
                full_name,
                email,
                phone,
                position_applied,
                years_experience,
                status,
                business_unit,
                job_category,
                ai_fit_score,
                ai_fit_comment,
                ai_recommended_position,
                notes,
                created_at,
                jd_file_name,
                assessment_file_name,
                background_check_file_name
              )
            `)
            .order('created_at', { ascending: false });

          if (approvalData) {
            const enrichedData = await Promise.all(
              approvalData.map(async (approval: any) => {
                let approverName = 'N/A';
                let approverEmail = 'N/A';
                let verifierName = 'N/A';
                let verifierEmail = 'N/A';

                if (approval.approver_id) {
                  const { data: approverProfile } = await supabase
                    .from('profiles')
                    .select('full_name, email')
                    .eq('id', approval.approver_id)
                    .maybeSingle();

                  if (approverProfile) {
                    approverName = approverProfile.full_name || 'N/A';
                    approverEmail = approverProfile.email || 'N/A';
                  }
                }

                const { data: candidateData } = await supabase
                  .from('candidates')
                  .select('user_id')
                  .eq('id', approval.candidate_id)
                  .maybeSingle();

                if (candidateData?.user_id) {
                  const { data: verifierProfile } = await supabase
                    .from('profiles')
                    .select('full_name, email')
                    .eq('id', candidateData.user_id)
                    .maybeSingle();

                  if (verifierProfile) {
                    verifierName = verifierProfile.full_name || 'N/A';
                    verifierEmail = verifierProfile.email || 'N/A';
                  }
                }

                const candidate = approval.candidates;

                return {
                  'Approval ID': approval.id,
                  'Candidate Name': candidate?.full_name || 'N/A',
                  'Candidate Email': candidate?.email || 'N/A',
                  'Candidate Phone': candidate?.phone || 'N/A',
                  'Position Applied': candidate?.position_applied || 'N/A',
                  'Years of Experience': candidate?.years_experience || 'N/A',
                  'Candidate Status': candidate?.status || 'N/A',
                  'Business Unit': candidate?.business_unit || 'N/A',
                  'Job Category': candidate?.job_category || 'N/A',
                  'AI Fit Score': candidate?.ai_fit_score || 'N/A',
                  'AI Recommended Position': candidate?.ai_recommended_position || 'N/A',
                  'AI Detailed Analysis': candidate?.ai_fit_comment || 'N/A',
                  'Candidate Notes': candidate?.notes || 'N/A',
                  'Candidate Submission Date': candidate?.created_at ? new Date(candidate.created_at).toLocaleString() : 'N/A',
                  'Resume / CV File': candidate?.jd_file_name || 'N/A',
                  'Assessment File': candidate?.assessment_file_name || 'N/A',
                  'Background Check File': candidate?.background_check_file_name || 'N/A',
                  'Approval Type': approval.approval_type,
                  'Approval Status': approval.status,
                  'Verifier Name': verifierName,
                  'Verifier Email': verifierEmail,
                  'Approver Name': approverName,
                  'Approver Email': approverEmail,
                  'Approval Comments': approval.comments || 'No comments',
                  'Approval Created At': new Date(approval.created_at).toLocaleString(),
                  'Approval Updated At': new Date(approval.updated_at).toLocaleString(),
                };
              })
            );
            data = enrichedData;
          }
          reportType = 'Approval Process Report';
          filename = 'approval_process_report';
          break;

        case 'all_candidates':
          const { data: allCandidates } = await supabase
            .from('candidates')
            .select('*')
            .order('created_at', { ascending: false });
          data = allCandidates || [];
          reportType = 'All Candidates Report';
          filename = 'all_candidates_report';
          break;

        case 'recent_candidates':
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const { data: recentCandidates } = await supabase
            .from('candidates')
            .select('*')
            .gte('created_at', thirtyDaysAgo.toISOString())
            .order('created_at', { ascending: false });
          data = recentCandidates || [];
          reportType = 'Recent Candidates Report';
          filename = 'recent_candidates_report';
          break;

        case 'user_activity':
          const { data: users } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
          data = users || [];
          reportType = 'User Activity Report';
          filename = 'user_activity_report';
          break;
      }

      if (data.length === 0) {
        alert('No data available for this report.');
        return;
      }

      await downloadPDF(data, reportType, filename);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const getReportRecordCount = () => {
    switch (selectedReport) {
      case 'all_candidates':
        return stats.totalCandidates;
      case 'approval_process':
        return stats.approvalProcesses;
      case 'recent_candidates':
        return stats.recentCandidates;
      case 'user_activity':
        return stats.totalUsers;
      default:
        return 0;
    }
  };

  const handleEmailClick = () => {
    setShowEmailModal(true);
    setEmailAddress('');
  };

  const sendEmail = async () => {
    if (!emailAddress || !emailAddress.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }

    setShowEmailModal(false);
    setSendingEmail(true);
    try {
      let data: any[] = [];
      let reportType = '';

      switch (selectedReport) {
        case 'approval_process':
          const { data: approvalDataEmail } = await supabase
            .from('approval_history')
            .select(`
              id,
              approval_type,
              status,
              comments,
              created_at,
              updated_at,
              candidate_id,
              approver_id,
              candidates (
                full_name,
                email,
                phone,
                position_applied,
                years_experience,
                status,
                business_unit,
                job_category,
                ai_fit_score,
                ai_fit_comment,
                ai_recommended_position,
                notes,
                created_at,
                jd_file_name,
                assessment_file_name,
                background_check_file_name
              )
            `)
            .order('created_at', { ascending: false });

          if (approvalDataEmail) {
            const enrichedDataEmail = await Promise.all(
              approvalDataEmail.map(async (approval: any) => {
                let approverName = 'N/A';
                let approverEmail = 'N/A';
                let verifierName = 'N/A';
                let verifierEmail = 'N/A';

                if (approval.approver_id) {
                  const { data: approverProfile } = await supabase
                    .from('profiles')
                    .select('full_name, email')
                    .eq('id', approval.approver_id)
                    .maybeSingle();

                  if (approverProfile) {
                    approverName = approverProfile.full_name || 'N/A';
                    approverEmail = approverProfile.email || 'N/A';
                  }
                }

                const { data: candidateData } = await supabase
                  .from('candidates')
                  .select('user_id')
                  .eq('id', approval.candidate_id)
                  .maybeSingle();

                if (candidateData?.user_id) {
                  const { data: verifierProfile } = await supabase
                    .from('profiles')
                    .select('full_name, email')
                    .eq('id', candidateData.user_id)
                    .maybeSingle();

                  if (verifierProfile) {
                    verifierName = verifierProfile.full_name || 'N/A';
                    verifierEmail = verifierProfile.email || 'N/A';
                  }
                }

                const candidate = approval.candidates;

                return {
                  'Approval ID': approval.id,
                  'Candidate Name': candidate?.full_name || 'N/A',
                  'Candidate Email': candidate?.email || 'N/A',
                  'Candidate Phone': candidate?.phone || 'N/A',
                  'Position Applied': candidate?.position_applied || 'N/A',
                  'Years of Experience': candidate?.years_experience || 'N/A',
                  'Candidate Status': candidate?.status || 'N/A',
                  'Business Unit': candidate?.business_unit || 'N/A',
                  'Job Category': candidate?.job_category || 'N/A',
                  'AI Fit Score': candidate?.ai_fit_score || 'N/A',
                  'AI Recommended Position': candidate?.ai_recommended_position || 'N/A',
                  'AI Detailed Analysis': candidate?.ai_fit_comment || 'N/A',
                  'Candidate Notes': candidate?.notes || 'N/A',
                  'Candidate Submission Date': candidate?.created_at ? new Date(candidate.created_at).toLocaleString() : 'N/A',
                  'Resume / CV File': candidate?.jd_file_name || 'N/A',
                  'Assessment File': candidate?.assessment_file_name || 'N/A',
                  'Background Check File': candidate?.background_check_file_name || 'N/A',
                  'Approval Type': approval.approval_type,
                  'Approval Status': approval.status,
                  'Verifier Name': verifierName,
                  'Verifier Email': verifierEmail,
                  'Approver Name': approverName,
                  'Approver Email': approverEmail,
                  'Approval Comments': approval.comments || 'No comments',
                  'Approval Created At': new Date(approval.created_at).toLocaleString(),
                  'Approval Updated At': new Date(approval.updated_at).toLocaleString(),
                };
              })
            );
            data = enrichedDataEmail;
          }
          reportType = 'Approval Process Report';
          break;

        case 'all_candidates':
          const { data: allCandidates } = await supabase
            .from('candidates')
            .select('*')
            .order('created_at', { ascending: false });
          data = allCandidates || [];
          reportType = 'All Candidates Report';
          break;

        case 'recent_candidates':
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const { data: recentCandidates } = await supabase
            .from('candidates')
            .select('*')
            .gte('created_at', thirtyDaysAgo.toISOString())
            .order('created_at', { ascending: false });
          data = recentCandidates || [];
          reportType = 'Recent Candidates Report';
          break;

        case 'user_activity':
          const { data: users } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });
          data = users || [];
          reportType = 'User Activity Report';
          break;
      }

      if (data.length === 0) {
        alert('No data available to send.');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pdf-report`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportType, data, emailAddress }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      const result = await response.json();
      alert(`${reportType} sent successfully!`);
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setSendingEmail(false);
    }
  };

  const downloadPDF = async (data: any[], reportType: string, filename: string) => {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pdf-report`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType,
          data,
          emailAddress: 'download@localhost.local'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const result = await response.json();

      if (result.success && result.pdfBase64) {
        const byteCharacters = atob(result.pdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });

        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().split('T')[0];

        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}_${timestamp}.pdf`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to download PDF:', error);
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Report Generation</h2>
        <p className="text-slate-600 mt-1">Generate and export various reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium mb-1">Total Candidates</p>
              <p className="text-3xl font-bold text-blue-900">{stats.totalCandidates}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium mb-1">Approval Processes</p>
              <p className="text-3xl font-bold text-green-900">{stats.approvalProcesses}</p>
            </div>
            <ClipboardCheck className="w-8 h-8 text-green-600" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-sm border border-amber-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-700 font-medium mb-1">Active Users</p>
              <p className="text-3xl font-bold text-amber-900">{stats.totalUsers}</p>
            </div>
            <Users className="w-8 h-8 text-amber-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTypes.map((report) => (
          <button
            key={report.id}
            onClick={() => setSelectedReport(report.id)}
            className={`p-6 border-2 rounded-xl text-left transition-all ${
              selectedReport === report.id
                ? 'border-cyan-500 bg-cyan-50'
                : 'border-slate-200 hover:border-slate-300 bg-white'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${
                selectedReport === report.id ? 'bg-cyan-100' : 'bg-slate-100'
              }`}>
                {report.id === 'approval_process' ? (
                  <ClipboardCheck className={`w-6 h-6 ${
                    selectedReport === report.id ? 'text-cyan-600' : 'text-slate-600'
                  }`} />
                ) : (
                  <FileText className={`w-6 h-6 ${
                    selectedReport === report.id ? 'text-cyan-600' : 'text-slate-600'
                  }`} />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 mb-1">{report.title}</h3>
                <p className="text-sm text-slate-600">{report.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Export Settings</h3>
            <p className="text-sm text-slate-600 mt-1">
              Data will be exported in PDF format
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4" />
            {new Date().toLocaleDateString()}
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Selected Report</p>
              <p className="font-semibold text-slate-800">
                {reportTypes.find(r => r.id === selectedReport)?.title}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600 mb-1">Records to Export</p>
              <p className="text-2xl font-bold text-cyan-600">{getReportRecordCount()}</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4">
          <div className="flex gap-3">
            <button
              onClick={handleEmailClick}
              disabled={sendingEmail || getReportRecordCount() === 0}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed font-medium flex-1 justify-center"
            >
              {sendingEmail ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending Email...
                </>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Email Report
                </>
              )}
            </button>
            <button
              onClick={generateReport}
              disabled={generating || getReportRecordCount() === 0}
              className="flex items-center gap-2 px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed font-medium flex-1 justify-center"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download PDF
                </>
              )}
            </button>
          </div>
          {getReportRecordCount() === 0 && (
            <p className="text-sm text-amber-600 mt-2 text-center">
              No data available for this report type
            </p>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex gap-3">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Report Information</h4>
            <p className="text-sm text-blue-800">
              Reports are generated in real-time from the current database state.
              The PDF file will include all relevant fields for the selected report type with professional formatting and visual charts.
              {selectedReport === 'approval_process' && ' The Approval Process Report includes verifier details, approver information, and complete approval history.'}
            </p>
          </div>
        </div>
      </div>

      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowEmailModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Email Report</h3>
              </div>
              <p className="text-sm text-slate-600 ml-12">
                Enter the email address where you want to send the {reportTypes.find(r => r.id === selectedReport)?.title}
              </p>
            </div>

            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEmailModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={sendEmail}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Mail className="w-5 h-5" />
                Send Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
