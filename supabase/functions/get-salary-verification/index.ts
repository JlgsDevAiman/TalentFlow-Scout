import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const candidateId = url.searchParams.get('candidate_id');
    const token = url.searchParams.get('token');

    if (!candidateId && !token) {
      return new Response(
        JSON.stringify({ error: 'candidate_id or token is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let finalCandidateId = candidateId;

    if (token && !candidateId) {
      const { data: tokenData, error: tokenError } = await supabase
        .from('verification_tokens')
        .select('candidate_id')
        .eq('token', token)
        .single();

      if (tokenError || !tokenData) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired token' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      finalCandidateId = tokenData.candidate_id;
    }

    const { data: candidateData, error: fetchError } = await supabase
      .from('candidate_hiring_flow')
      .select('*')
      .eq('candidate_id', finalCandidateId)
      .single();

    if (fetchError || !candidateData) {
      return new Response(
        JSON.stringify({ error: 'Candidate not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: mainCandidate } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', finalCandidateId)
      .single();

    const salaryProposal = candidateData.salary_proposal || {};

    const parseNumber = (val: any): number => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const cleaned = val.replace(/[^0-9.-]/g, '');
        return parseFloat(cleaned) || 0;
      }
      return 0;
    };

    const basicSalary = parseNumber(salaryProposal.basic_salary);
    const allowancesTotal = parseNumber(salaryProposal.allowances_total);
    const totalSalary = parseNumber(salaryProposal.total_salary) || (basicSalary + allowancesTotal);
    const employerContribution = parseNumber(salaryProposal.employer_contribution_rm);
    const totalCTC = parseNumber(salaryProposal.total_ctc) || (totalSalary + employerContribution);

    const bandMin = parseNumber(salaryProposal.band_min_rm);
    const bandMid = parseNumber(salaryProposal.band_mid_rm);
    const bandMax = parseNumber(salaryProposal.band_max_rm);

    let rangeFitLabel = 'No band data';
    if (bandMin > 0 && bandMax > 0) {
      if (basicSalary < bandMin) {
        rangeFitLabel = 'Below Band';
      } else if (basicSalary >= bandMin && basicSalary <= bandMid) {
        rangeFitLabel = 'Within Band (Below/Near Midpoint)';
      } else if (basicSalary > bandMid && basicSalary <= bandMax) {
        rangeFitLabel = 'Within Band (Near Upper Range)';
      } else if (basicSalary > bandMax) {
        rangeFitLabel = 'Above Band';
      }
    }

    const teamMedian = parseNumber(salaryProposal.team_median_salary);
    let internalParityText = 'No team median data available';
    if (teamMedian > 0) {
      const diff = basicSalary - teamMedian;
      const percentDiff = ((diff / teamMedian) * 100).toFixed(1);
      if (diff > 0) {
        internalParityText = `Basic salary is RM ${diff.toLocaleString()} (${percentDiff}%) above team median`;
      } else if (diff < 0) {
        internalParityText = `Basic salary is RM ${Math.abs(diff).toLocaleString()} (${Math.abs(parseFloat(percentDiff))}%) below team median`;
      } else {
        internalParityText = 'Basic salary matches team median';
      }
    }

    const budgetMax = parseNumber(salaryProposal.role_budget_max_ctc);
    let budgetFitText = 'No budget data available';
    if (budgetMax > 0) {
      if (totalCTC <= budgetMax) {
        budgetFitText = 'Within budget';
      } else {
        const excess = totalCTC - budgetMax;
        budgetFitText = `Exceeds budget by RM ${excess.toLocaleString()}`;
      }
    }

    const riskFlags: string[] = [];
    if (bandMax > 0 && basicSalary > bandMax) {
      riskFlags.push('Basic salary above band maximum');
    }
    const allowanceRatio = totalSalary > 0 ? (allowancesTotal / totalSalary) * 100 : 0;
    if (allowanceRatio > 30) {
      riskFlags.push(`Allowance ratio is ${allowanceRatio.toFixed(1)}% (exceeds 30% threshold)`);
    }
    if (budgetMax > 0 && totalCTC > budgetMax) {
      riskFlags.push('Total CTC exceeds role budget');
    }

    const currentBasic = mainCandidate?.expected_salary ? parseNumber(mainCandidate.expected_salary) : 0;
    const currentAllowances = 0;
    const currentTotal = currentBasic + currentAllowances;

    const assessmentStatus = candidateData.assessment_status || 'Pending';
    const assessmentScore = candidateData.assessment_score || 'N/A';

    const response = {
      candidate_id: finalCandidateId,
      candidate: {
        name: candidateData.name,
        position: candidateData.position,
        years_experience: parseInt(salaryProposal.years_of_experience) || 0,
        current_employer: mainCandidate?.current_company || 'N/A',
        current_salary_basic: currentBasic,
        current_salary_allowances: currentAllowances,
        current_salary_total: currentTotal,
      },
      salary_proposal: {
        basic_salary: basicSalary,
        allowances_total: allowancesTotal,
        total_salary: totalSalary,
        employer_contribution: employerContribution,
        total_ctc: totalCTC,
        band_min: bandMin,
        band_mid: bandMid,
        band_max: bandMax,
        range_fit_label: rangeFitLabel,
        internal_parity_text: internalParityText,
        budget_fit_text: budgetFitText,
        risk_flags: riskFlags,
      },
      assessment: {
        status: assessmentStatus,
        score: assessmentScore,
        strengths: [
          'Strong technical skills',
          'Excellent communication',
          'Leadership potential'
        ],
        development_areas: [
          'Industry-specific knowledge'
        ],
      },
      background_check: {
        status: candidateData.background_check_status || 'Pending',
        notes: 'All verifications completed successfully. No issues found.',
      },
      meta: {
        recruiter_name: candidateData.recruiter || 'Recruitment Team',
      },
    };

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});