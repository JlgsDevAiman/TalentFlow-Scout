import { Candidate } from '../types/candidate';
import { supabase } from '../lib/supabase';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function updateCandidateStatus(action: string, candidateId: string): Promise<string | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/candidate-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ action, candidateId }),
    });

    if (!res.ok) {
      console.error('Failed to update status');
      return null;
    }

    const data = await res.json();
    return data.status;
  } catch (error) {
    console.error('Error updating candidate status:', error);
    return null;
  }
}

export async function shortlistCandidate(candidate: Candidate): Promise<void> {
  const hmEmail = window.prompt('Enter Hiring Manager email:');
  if (!hmEmail) return;

  const newStatus = await updateCandidateStatus('shortlisted', candidate.id);
  if (!newStatus) {
    alert('Failed to update candidate status');
    return;
  }

  const subject = encodeURIComponent(
    `Shortlisted Candidate – ${candidate.full_name} (${candidate.position_applied})`
  );

  const body = encodeURIComponent(`Dear Hiring Manager,

The following candidate has been shortlisted:

Name: ${candidate.full_name}
Position: ${candidate.position_applied}
Email: ${candidate.email}
Phone: ${candidate.phone}
Years of experience: ${candidate.years_experience}
${candidate.ai_fit_score ? `AI Fit Score: ${candidate.ai_fit_score}/100` : ''}
${candidate.ai_recommended_position ? `Recommended Position: ${candidate.ai_recommended_position}` : ''}

${candidate.ai_fit_comment ? `Summary:\n${candidate.ai_fit_comment}` : ''}

${candidate.notes ? `Notes:\n${candidate.notes}` : ''}

Regards,
TalentFlow Scout`);

  window.location.href = `mailto:${hmEmail}?subject=${subject}&body=${body}`;
}

export async function sendForAssessment(candidate: Candidate): Promise<void> {
  const newStatus = await updateCandidateStatus('assessment', candidate.id);
  if (!newStatus) {
    alert('Failed to update candidate status');
    return;
  }

  window.open('https://assessments-dashboard.foundit.in/login', '_blank');
}

export async function scheduleInterview(candidate: Candidate): Promise<void> {
  const panelEmails = window.prompt('Enter panel emails (separate using semicolons):');
  if (!panelEmails) return;

  const newStatus = await updateCandidateStatus('interview', candidate.id);
  if (!newStatus) {
    alert('Failed to update candidate status');
    return;
  }

  const subject = encodeURIComponent(
    `Interview Candidate – ${candidate.full_name} (${candidate.position_applied})`
  );

  const body = encodeURIComponent(`Dear Interview Panel,

Please find the candidate details:

Name: ${candidate.full_name}
Position: ${candidate.position_applied}
Email: ${candidate.email}
Phone: ${candidate.phone}
Years of experience: ${candidate.years_experience}
${candidate.ai_fit_score ? `AI Fit Score: ${candidate.ai_fit_score}/100` : ''}
${candidate.ai_recommended_position ? `Recommended Position: ${candidate.ai_recommended_position}` : ''}

${candidate.ai_fit_comment ? `Summary:\n${candidate.ai_fit_comment}` : ''}

${candidate.notes ? `Notes:\n${candidate.notes}` : ''}

Regards,
TalentFlow Scout`);

  window.location.href = `mailto:${panelEmails}?subject=${subject}&body=${body}`;
}

export async function rejectCandidate(candidate: Candidate): Promise<boolean> {
  const confirmed = window.confirm(`Are you sure you want to reject ${candidate.full_name}?`);
  if (!confirmed) return false;

  const newStatus = await updateCandidateStatus('rejected', candidate.id);
  if (!newStatus) {
    alert('Failed to update candidate status');
    return false;
  }

  return true;
}

export async function sendForBackgroundCheck(candidate: Candidate): Promise<boolean> {
  const newStatus = await updateCandidateStatus('background_check', candidate.id);
  if (!newStatus) {
    alert('Failed to update candidate status');
    return false;
  }

  return true;
}

export async function transferToHiringApproval(candidate: Candidate): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    const recruiterName = profile?.full_name || user.email?.split('@')[0] || 'Unknown';
    const recruiterEmail = user.email || 'unknown@system.local';

    const { error: insertError } = await supabase.from('candidate_hiring_flow').insert([
      {
        name: candidate.full_name,
        position: candidate.position_applied,
        recruiter: recruiterName,
        recruiter_email: recruiterEmail,
        hiring_manager1_email: 'pending@assignment.local',
        hiring_manager2_email: null,
        approver1_email: 'pending@assignment.local',
        approver2_email: null,
        current_step: 'Selected for Hiring',
        assessment_status: 'Pending',
        background_check_status: 'Pending',
      },
    ]);

    if (insertError) throw insertError;

    const { error: updateError } = await supabase
      .from('candidates')
      .update({ moved_to_hiring_approval: true })
      .eq('id', candidate.id);

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    console.error('Error transferring to hiring approval:', error);
    alert(`Failed to transfer candidate: ${error}`);
    return false;
  }
}
