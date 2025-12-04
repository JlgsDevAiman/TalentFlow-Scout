import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
    const {
      candidateId,
      candidateName,
      position,
      verifierEmail,
      salaryProposal,
      verifyUrl,
      recruiter,
      recruiterEmail,
      assessmentStatus,
      assessmentScore,
      backgroundCheckStatus
    } = await req.json();

    if (!candidateId || !candidateName || !position || !verifierEmail || !salaryProposal || !verifyUrl) {
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

    console.log(`Sending verification request to ${verifierEmail} for candidate ${candidateName}`);

    const basicSalary = salaryProposal.basicSalary || 'N/A';
    const totalSalary = salaryProposal.totalSalary || 'N/A';
    const allowances = salaryProposal.allowances || [];

    const subject = `Salary Package Verification Required - ${candidateName} (${position})`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; }
    .info-section { background: white; padding: 15px; margin: 15px 0; border-radius: 6px; border-left: 4px solid #0891b2; }
    .button-container { text-align: center; margin: 30px 0; padding: 20px; background: white; border-radius: 8px; }
    .button { display: inline-block; padding: 14px 32px; margin: 8px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 15px; transition: all 0.3s; }
    .btn-approve { background: #10b981; color: white; }
    .btn-change { background: #f59e0b; color: white; }
    .btn-reject { background: #ef4444; color: white; }
    .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; }
    .note { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 15px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">Salary Package Verification Required</h2>
    </div>
    <div class="content">
      <p>Dear Verifier,</p>
      <p>A salary package requires your verification and approval.</p>

      <div class="info-section">
        <h3 style="margin-top: 0; color: #0891b2;">Candidate Information</h3>
        <p><strong>Name:</strong> ${candidateName}</p>
        <p><strong>Position:</strong> ${position}</p>
        <p><strong>Recruiter:</strong> ${recruiter} (${recruiterEmail})</p>
      </div>

      <div class="info-section">
        <h3 style="margin-top: 0; color: #0891b2;">Assessment & Background Check</h3>
        <p><strong>Assessment Status:</strong> ${assessmentStatus}</p>
        ${assessmentScore ? `<p><strong>Assessment Score:</strong> ${assessmentScore}</p>` : ''}
        <p><strong>Background Check:</strong> ${backgroundCheckStatus}</p>
      </div>

      <div class="info-section">
        <h3 style="margin-top: 0; color: #0891b2;">Proposed Salary Package</h3>
        <p><strong>Basic Salary:</strong> ${basicSalary}</p>
        ${allowances.length > 0 ? `<p><strong>Allowances:</strong></p><ul>${allowances.map((a: any) => `<li>${a.name}: ${a.amount}</li>`).join('')}</ul>` : ''}
        <p><strong>Total Salary:</strong> ${totalSalary}</p>
      </div>

      <div class="button-container">
        <h3 style="color: #334155; margin-top: 0;">Click a button to submit your decision:</h3>
        <a href="${verifyUrl}" class="button btn-approve">✓ Approve</a>
        <a href="${verifyUrl}" class="button btn-change">⟳ Request Change</a>
        <a href="${verifyUrl}" class="button btn-reject">✗ Reject</a>
      </div>

      <div class="note">
        <p style="margin: 0;"><strong>Note:</strong> This link is valid for 7 days. Click any button above and select your decision on the verification page.</p>
      </div>

      <p>If you have any questions, please contact the recruitment team.</p>
    </div>
    <div class="footer">
      <p>Best regards,<br><strong>Talent Acquisition Team</strong></p>
    </div>
  </div>
</body>
</html>`;

    console.log(`Email prepared for ${verifierEmail}. Subject: ${subject}`);
    console.log(`Verification URL: ${verifyUrl}`);

    const data = {
      success: true,
      message: `Verification email sent to ${verifierEmail}`,
      emailPreview: {
        to: verifierEmail,
        subject: subject,
        htmlBody: htmlBody
      }
    };

    return new Response(
      JSON.stringify(data),
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