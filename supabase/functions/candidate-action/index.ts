import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const { action, candidateId } = await req.json();

    if (!action || !candidateId) {
      return new Response(
        JSON.stringify({ error: "Missing action or candidateId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const statusMap: Record<string, string> = {
      shortlisted: "Shortlisted",
      assessment: "Assessment",
      interview: "Interview",
      rejected: "Rejected",
      background_check: "Background Check",
    };

    const newStatus = statusMap[action] ?? "New";

    const updateRes = await fetch(`${supabaseUrl}/rest/v1/candidates?id=eq.${candidateId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${supabaseKey}`,
        "apikey": supabaseKey,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!updateRes.ok) {
      const error = await updateRes.text();
      console.error("Failed to update candidate status:", error);
      return new Response(
        JSON.stringify({ error: "Failed to update status" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, status: newStatus }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("candidate-action error:", err);
    return new Response(
      JSON.stringify({ error: "Error processing request" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});