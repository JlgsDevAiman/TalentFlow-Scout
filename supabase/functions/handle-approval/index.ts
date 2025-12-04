import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token, decision, comment } = await req.json();

    if (!token || !decision) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { data: tokenData, error: tokenError } = await supabase
      .from('approval_tokens_unified')
      .select('*, candidate_hiring_flow(*)')
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const candidate = tokenData.candidate_hiring_flow;
    const approvalType = tokenData.approval_type;
    const approvals = candidate.approvals || {};

    approvals[approvalType] = {
      decision,
      comment: comment || '',
      timestamp: new Date().toISOString(),
      email: tokenData.approver_email
    };

    let nextStep = candidate.current_step;

    if (approvalType === 'hm1') {
      if (decision === 'Recommend') {
        if (candidate.hiring_manager2_email) {
          nextStep = 'Ready for Recommendation – Hiring Manager 2';
        } else {
          nextStep = 'Ready for Approval – Approver 1';
        }
      }
    } else if (approvalType === 'hm2') {
      if (decision === 'Recommend') {
        nextStep = 'Ready for Approval – Approver 1';
      }
    } else if (approvalType === 'approver1') {
      if (decision === 'Approved') {
        if (candidate.approver2_email) {
          nextStep = 'Ready for Approval – Approver 2';
        } else {
          nextStep = 'Ready for Contract Issuance';
        }
      }
    } else if (approvalType === 'approver2') {
      if (decision === 'Approved') {
        nextStep = 'Ready for Contract Issuance';
      }
    }

    const { error: updateError } = await supabase
      .from('candidate_hiring_flow')
      .update({
        approvals: approvals,
        current_step: nextStep,
      })
      .eq('candidate_id', tokenData.candidate_id);

    if (updateError) throw updateError;

    await supabase
      .from('approval_tokens_unified')
      .update({ used: true })
      .eq('token', token);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Decision recorded successfully',
        candidate: candidate.name,
        decision: decision,
        nextStep: nextStep
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});