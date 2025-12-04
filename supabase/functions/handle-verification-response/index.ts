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
      .from('verification_tokens')
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
    const approvals = candidate.approvals || {};
    approvals.verifier = {
      decision,
      comment: comment || '',
      timestamp: new Date().toISOString()
    };

    const updates: any = {
      approvals: approvals,
    };

    if (decision === 'Approved') {
      updates.current_step = 'Ready for Recommendation – Hiring Manager 1';
    }

    const { error: updateError } = await supabase
      .from('candidate_hiring_flow')
      .update(updates)
      .eq('candidate_id', tokenData.candidate_id);

    if (updateError) throw updateError;

    await supabase
      .from('verification_tokens')
      .update({ used: true })
      .eq('token', token);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Verification decision recorded successfully',
        candidate: candidate.name,
        decision: decision
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