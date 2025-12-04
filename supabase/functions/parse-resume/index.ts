import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ParseResumeRequest {
  fileContent: string;
}

interface ParsedResumeData {
  full_name: string;
  email: string;
  phone: string;
  position_applied: string;
  years_experience: number;
  notes: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed. Use POST." }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { fileContent }: ParseResumeRequest = await req.json();

    if (!fileContent || fileContent.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "File content is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured on server" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const prompt = `You are an HR assistant that extracts information from resumes/CVs.

Parse the following resume and extract:
1. Full name
2. Email address
3. Phone number
4. The most recent or primary job position/role (for "position_applied")
5. Total years of professional experience (estimate if not explicitly stated)
6. A brief summary of skills, education, and experience (for notes field)

Resume content:
${fileContent}

Format your response as JSON with this exact structure:
{
  "full_name": "<extracted name>",
  "email": "<extracted email>",
  "phone": "<extracted phone>",
  "position_applied": "<most relevant position/role>",
  "years_experience": <number>,
  "notes": "<brief summary of skills, education, and experience>"
}

If any field cannot be found, use reasonable defaults:
- full_name: "Unknown"
- email: "not_provided@example.com"
- phone: "Not provided"
- position_applied: "General Application"
- years_experience: 0
- notes: Include whatever information is available`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an HR assistant that extracts structured data from resumes. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 500
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      throw new Error(errorData.error?.message || `OpenAI API error: ${openaiResponse.status}`);
    }

    const data = await openaiResponse.json();
    let content = data.choices[0].message.content;

    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const result: ParsedResumeData = JSON.parse(content);

    const parsedData: ParsedResumeData = {
      full_name: result.full_name || "Unknown",
      email: result.email || "not_provided@example.com",
      phone: result.phone || "Not provided",
      position_applied: result.position_applied || "General Application",
      years_experience: Math.max(0, result.years_experience || 0),
      notes: result.notes || ""
    };

    return new Response(
      JSON.stringify(parsedData),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error parsing resume:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to parse resume",
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
