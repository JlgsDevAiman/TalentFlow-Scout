import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ApprovalRequest {
  candidateId: string;
  approvalType: string;
  hiringManagerEmail: string;
  frontendUrl?: string;
}

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
    const { candidateId, approvalType, hiringManagerEmail, frontendUrl }: ApprovalRequest = await req.json();

    if (!candidateId || !approvalType || !hiringManagerEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("*")
      .eq("id", candidateId)
      .single();

    if (candidateError || !candidate) {
      return new Response(
        JSON.stringify({ error: "Candidate not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: approver } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", hiringManagerEmail)
      .maybeSingle();

    const { data: approvalHistory, error: historyError } = await supabase
      .from("approval_history")
      .insert({
        candidate_id: candidateId,
        approver_id: approver?.id || null,
        approval_type: approvalType,
        status: "Pending",
      })
      .select()
      .single();

    if (historyError || !approvalHistory) {
      console.error("Failed to create approval history:", historyError);
      return new Response(
        JSON.stringify({ error: "Failed to create approval history" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const approvalToken = crypto.randomUUID() + '-' + crypto.randomUUID();

    const { error: tokenError } = await supabase
      .from("approval_tokens")
      .insert({
        approval_history_id: approvalHistory.id,
        token: approvalToken,
      });

    if (tokenError) {
      console.error("Failed to create approval token:", tokenError);
    }

    const origin = frontendUrl || req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || supabaseUrl.replace('.supabase.co', '.local-credentialless.webcontainer-api.io');
    const approvalUrl = `${origin}/approve?token=${approvalToken}`;

    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", user.id)
      .single();

    let assessmentUrl = "";
    let backgroundCheckUrl = "";

    if (candidate.assessment_file_path) {
      const { data: assessmentSignedUrl } = await supabase
        .storage
        .from("approval-documents")
        .createSignedUrl(candidate.assessment_file_path, 604800);
      assessmentUrl = assessmentSignedUrl?.signedUrl || "";
    }

    if (candidate.background_check_file_path) {
      const { data: bgSignedUrl } = await supabase
        .storage
        .from("approval-documents")
        .createSignedUrl(candidate.background_check_file_path, 604800);
      backgroundCheckUrl = bgSignedUrl?.signedUrl || "";
    }

    const subject = `Approval Request: ${approvalType} - ${candidate.full_name} (${candidate.position_applied})`;
    
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
          .section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
          .section-title { color: #0891b2; font-weight: bold; font-size: 16px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #0891b2; }
          .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
          .info-label { font-weight: 600; min-width: 180px; color: #475569; }
          .info-value { color: #1e293b; }
          .score-badge { display: inline-block; padding: 8px 16px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border-radius: 20px; font-weight: bold; font-size: 18px; }
          .document-link { display: inline-block; padding: 12px 24px; background: #0891b2; color: white; text-decoration: none; border-radius: 6px; margin: 10px 10px 10px 0; font-weight: 600; }
          .document-link:hover { background: #0e7490; }
          .approval-badge { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 12px 20px; border-radius: 8px; font-weight: bold; font-size: 16px; text-align: center; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; border-top: 1px solid #e2e8f0; margin-top: 20px; }
          .no-data { color: #94a3b8; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">🎯 Candidate Approval Request</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">TalentFlow Scout System</p>
        </div>
        
        <div class="content">
          <p style="font-size: 16px; margin-bottom: 20px;">Dear Hiring Manager,</p>
          <p>You have received an approval request for the following candidate. Please review the details below and take appropriate action.</p>
          
          <div class="approval-badge">
            📋 ${approvalType}
          </div>

          <div class="section">
            <div class="section-title">👤 CANDIDATE INFORMATION</div>
            <div class="info-row">
              <span class="info-label">Name:</span>
              <span class="info-value">${candidate.full_name}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">${candidate.email}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Phone:</span>
              <span class="info-value">${candidate.phone}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Position Applied:</span>
              <span class="info-value"><strong>${candidate.position_applied}</strong></span>
            </div>
            <div class="info-row">
              <span class="info-label">Years of Experience:</span>
              <span class="info-value">${candidate.years_experience} years</span>
            </div>
            <div class="info-row">
              <span class="info-label">Current Status:</span>
              <span class="info-value"><strong>${candidate.status}</strong></span>
            </div>
          </div>

          ${candidate.ai_fit_score ? `
          <div class="section">
            <div class="section-title">🤖 AI EVALUATION</div>
            <div style="text-align: center; padding: 20px;">
              <div style="margin-bottom: 10px; color: #64748b; font-size: 14px;">AI Fit Score</div>
              <div class="score-badge">${candidate.ai_fit_score}/100</div>
            </div>
            ${candidate.ai_recommended_position ? `
            <div class="info-row">
              <span class="info-label">Recommended Position:</span>
              <span class="info-value"><strong>${candidate.ai_recommended_position}</strong></span>
            </div>
            ` : ''}
            ${candidate.ai_fit_comment ? `
            <div style="margin-top: 15px; padding: 15px; background: #f8fafc; border-left: 4px solid #0891b2; border-radius: 4px;">
              <div style="font-weight: 600; color: #475569; margin-bottom: 8px;">AI Analysis:</div>
              <div style="color: #1e293b;">${candidate.ai_fit_comment.replace(/\n/g, '<br>')}</div>
            </div>
            ` : ''}
          </div>
          ` : `
          <div class="section">
            <div class="section-title">🤖 AI EVALUATION</div>
            <p class="no-data">This candidate has not been evaluated by AI yet.</p>
          </div>
          `}

          <div class="section">
            <div class="section-title">📄 DOCUMENTS</div>
            ${assessmentUrl ? `
            <a href="${assessmentUrl}" class="document-link">📊 View Assessment Report</a>
            ` : '<p class="no-data">Assessment report not uploaded yet.</p>'}
            ${backgroundCheckUrl ? `
            <a href="${backgroundCheckUrl}" class="document-link">🔍 View Background Check Report</a>
            ` : !assessmentUrl ? '<p class="no-data">Background check report not uploaded yet.</p>' : ''}
          </div>

          ${candidate.notes ? `
          <div class="section">
            <div class="section-title">📝 NOTES</div>
            <div style="color: #1e293b; line-height: 1.8;">${candidate.notes.replace(/\n/g, '<br>')}</div>
          </div>
          ` : ''}

          <div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 8px; border: 1px solid #bfdbfe;">
            <p style="margin: 0 0 20px 0; color: #1e40af; font-size: 14px; text-align: center;">
              <strong>⏰ Action Required:</strong> Please review this candidate and provide your ${approvalType.toLowerCase()} decision.
            </p>
            <div style="text-align: center; margin-top: 20px;">
              <a href="${approvalUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 0 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                ✓ Review & Approve/Reject
              </a>
            </div>
            <p style="margin: 15px 0 0 0; color: #64748b; font-size: 12px; text-align: center;">
              This link will expire in 7 days and can only be used once.
            </p>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 0 0 10px 0;">This email was sent by <strong>TalentFlow Scout</strong></p>
          <p style="margin: 0; font-size: 12px;">Requested by: ${senderProfile?.email || user.email}</p>
        </div>
      </body>
      </html>
    `;

    const textBody = `Dear Hiring Manager,\n\nYou have received an approval request for the following candidate:\n\n=== CANDIDATE INFORMATION ===\nName: ${candidate.full_name}\nEmail: ${candidate.email}\nPhone: ${candidate.phone}\nPosition Applied: ${candidate.position_applied}\nYears of Experience: ${candidate.years_experience}\nCurrent Status: ${candidate.status}\n\n=== AI EVALUATION ===\n${candidate.ai_fit_score ? `AI Fit Score: ${candidate.ai_fit_score}/100` : "Not yet evaluated"}\n${candidate.ai_recommended_position ? `Recommended Position: ${candidate.ai_recommended_position}` : ""}\n${candidate.ai_fit_comment ? `\nAI Comments:\n${candidate.ai_fit_comment}` : ""}\n\n=== DOCUMENTS ===\n${assessmentUrl ? `Assessment Report: ${assessmentUrl}` : "Assessment: Not uploaded"}\n${backgroundCheckUrl ? `Background Check Report: ${backgroundCheckUrl}` : "Background Check: Not uploaded"}\n\n${candidate.notes ? `=== NOTES ===\n${candidate.notes}\n` : ""}=== APPROVAL TYPE ===\n${approvalType}\n\n=== ACTION REQUIRED ===\nClick the link below to review and approve/reject this candidate:\n${approvalUrl}\n\nThis link expires in 7 days and can only be used once.\n\nPlease review the candidate profile and documents, then take appropriate action.\n\nBest regards,\nTalentFlow Scout System\nRequested by: ${senderProfile?.email || user.email}`;

    if (resendApiKey) {
      try {
        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "TalentFlow Scout <onboarding@resend.dev>",
            to: [hiringManagerEmail],
            subject: subject,
            html: htmlBody,
            text: textBody,
          }),
        });

        if (!resendResponse.ok) {
          const errorText = await resendResponse.text();
          console.error("Resend API error:", errorText);
          throw new Error(`Failed to send email: ${errorText}`);
        }

        const resendData = await resendResponse.json();
        console.log("Email sent successfully via Resend:", resendData);

        return new Response(
          JSON.stringify({
            success: true,
            message: "Approval request sent successfully via email",
            emailId: resendData.id,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (emailError) {
        console.error("Failed to send email via Resend:", emailError);
        
        const mailtoUrl = `mailto:${hiringManagerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(textBody)}`;
        return new Response(
          JSON.stringify({
            success: true,
            message: "Approval request created (email service unavailable, using mailto)",
            mailtoUrl,
            emailError: String(emailError),
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      const mailtoUrl = `mailto:${hiringManagerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(textBody)}`;
      return new Response(
        JSON.stringify({
          success: true,
          message: "Approval request created (configure RESEND_API_KEY for automatic email sending)",
          mailtoUrl,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (err) {
    console.error("send-approval-request error:", err);
    return new Response(
      JSON.stringify({ error: "Error processing request", details: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});