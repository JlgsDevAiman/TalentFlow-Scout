export type CandidateStatus = 'New' | 'Shortlisted' | 'Interview' | 'Assessment' | 'Background Check' | 'Rejected' | 'Hired';

export interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  position_applied: string;
  years_experience: number;
  status: CandidateStatus;
  notes: string;
  ai_fit_score: number | null;
  ai_fit_comment: string | null;
  ai_recommended_position: string | null;
  ai_recommended_position_id: string | null;
  ai_all_position_scores: any | null;
  created_at: string;
  user_id: string;
  jd_file_path: string | null;
  jd_file_name: string | null;
  jd_file_size: number | null;
  jd_file_type: string | null;
  business_unit: string | null;
  job_category: string | null;
  assessment_file_path: string | null;
  assessment_file_name: string | null;
  background_check_file_path: string | null;
  background_check_file_name: string | null;
}

export interface CreateCandidateInput {
  full_name: string;
  email: string;
  phone: string;
  position_applied: string;
  years_experience: number;
  status?: CandidateStatus;
  notes?: string;
  business_unit?: string;
  job_category?: string;
}

export interface UpdateCandidateInput {
  full_name?: string;
  email?: string;
  phone?: string;
  position_applied?: string;
  years_experience?: number;
  status?: CandidateStatus;
  notes?: string;
  business_unit?: string;
  job_category?: string;
}
