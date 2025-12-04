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
    const { candidate_id, step, decision, comment } = await req.json();

    if (!candidate_id || !step || !decision) {
      return new Response(
        JSON.stringify({ error: 'candidate_id, step, and decision are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: candidateData, error: fetchError } = await supabase
      .from('candidate_hiring_flow')
      .select('approvals')
      .eq('candidate_id', candidate_id)
      .single();

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: 'Candidate not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const approvals = candidateData?.approvals || {};

    const decisionLabel = decision === 'approved' ? 'Approved' :
                         decision === 'request_change' ? 'Request Change' : 'Rejected';

    approvals.salary_verification = {
      decision: decisionLabel,
      comment: comment || '',
      timestamp: new Date().toISOString(),
      step: step,
    };

    let currentStep = 'Salary Package Prepared';

    if (decision === 'approved') {
      currentStep = 'Salary Verified and Approved';
    } else if (decision === 'request_change') {
      currentStep = 'Salary Package - Change Requested';
    } else if (decision === 'rejected') {
      currentStep = 'Salary Package Rejected';
    }

    const { error: updateError } = await supabase
      .from('candidate_hiring_flow')
      .update({
        approvals: approvals,
        current_step: currentStep,
        updated_at: new Date().toISOString(),
      })
      .eq('candidate_id', candidate_id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Decision submitted successfully',
        decision: decisionLabel,
        current_step: currentStep,
      }),
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