import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const POWER_AUTOMATE_URL = "https://defaulte97b19be5239463599c99898cf4c3e.60.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/11f8b14b8e274a7fb71a0974a8d08dd6/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=IIM-aEF-Lxu4HGDUvV4pyFgoyGP4yrIyzzjs5o5kv9U";

interface RequestBody {
  reportType: string;
  data: any[];
  emailAddress: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { reportType, data, emailAddress }: RequestBody = await req.json();

    if (!reportType || !data || !Array.isArray(data) || data.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid request: reportType and data are required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!emailAddress || !emailAddress.includes('@')) {
      return new Response(
        JSON.stringify({ error: "Invalid request: valid emailAddress is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const reportData = {
      toEmail: emailAddress,
      reportType,
      generatedAt: new Date().toISOString(),
      totalRecords: data.length,
      records: data,
    };

    const response = await fetch(POWER_AUTOMATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reportData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Power Automate responded with status: ${response.status}, body: ${errorText}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${reportType} sent successfully to ${emailAddress}`,
        recordCount: data.length,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending report:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to send report",
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
