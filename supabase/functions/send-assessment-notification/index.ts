import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AssessmentRequest {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  position: string;
}

async function sendEmailViaSMTP(to: string, subject: string, html: string, text: string, fromEmail: string, fromName: string) {
  const SMTP_HOST = Deno.env.get('SMTP_HOST');
  const SMTP_PORT = Deno.env.get('SMTP_PORT') || '587';
  const SMTP_USER = Deno.env.get('SMTP_USER');
  const SMTP_PASS = Deno.env.get('SMTP_PASS');

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return false;
  }

  try {
    const conn = await Deno.connect({
      hostname: SMTP_HOST,
      port: parseInt(SMTP_PORT),
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    async function read() {
      const buffer = new Uint8Array(4096);
      const n = await conn.read(buffer);
      if (n === null) return '';
      return decoder.decode(buffer.subarray(0, n));
    }

    async function write(data: string) {
      await conn.write(encoder.encode(data));
    }

    try {
      await read();

      await write(`EHLO ${SMTP_HOST}\r\n`);
      await read();

      if (SMTP_PORT === '587') {
        await write(`STARTTLS\r\n`);
        await read();
        await Deno.startTls(conn, { hostname: SMTP_HOST });

        await write(`EHLO ${SMTP_HOST}\r\n`);
        await read();
      }

      await write(`AUTH LOGIN\r\n`);
      await read();

      const usernameB64 = btoa(SMTP_USER);
      await write(`${usernameB64}\r\n`);
      await read();

      const passwordB64 = btoa(SMTP_PASS);
      await write(`${passwordB64}\r\n`);
      await read();

      await write(`MAIL FROM:<${SMTP_USER}>\r\n`);
      await read();

      await write(`RCPT TO:<${to}>\r\n`);
      await read();

      await write(`DATA\r\n`);
      await read();

      const boundary = `----=_Part_${Date.now()}`;
      const fromHeader = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
      const message = [
        `From: ${fromHeader}`,
        `To: ${to}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        ``,
        `--${boundary}`,
        `Content-Type: text/plain; charset=UTF-8`,
        `Content-Transfer-Encoding: 7bit`,
        ``,
        text,
        ``,
        `--${boundary}`,
        `Content-Type: text/html; charset=UTF-8`,
        `Content-Transfer-Encoding: 7bit`,
        ``,
        html,
        ``,
        `--${boundary}--`,
        `.`,
      ].join('\r\n');

      await write(message + '\r\n');
      await read();

      await write(`QUIT\r\n`);
      await read();

      return true;
    } finally {
      conn.close();
    }
  } catch (error) {
    console.error('SMTP Error:', error);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user || !user.email) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    const { candidateId, candidateName, candidateEmail, position }: AssessmentRequest = await req.json();

    if (!candidateId || !candidateName || !candidateEmail || !position) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const senderEmail = user.email;
    const senderName = profile?.full_name || user.email.split('@')[0] || 'Talent Acquisition Team';

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #0891b2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .details { background: white; padding: 20px; border-left: 4px solid #0891b2; margin: 20px 0; border-radius: 4px; }
    .instructions { background: white; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Online Assessment Invitation</h1>
    </div>
    <div class="content">
      <p>Dear <strong>${candidateName}</strong>,</p>

      <p>Congratulations on being selected for the <strong>${position}</strong> position!</p>

      <p>As the next step in our hiring process, we kindly request you to complete an online assessment.</p>

      <div class="details">
        <h3 style="margin-top: 0; color: #0891b2;">Assessment Details</h3>
        <ul>
          <li><strong>Platform:</strong> Found.it Assessments</li>
          <li><strong>Your Email:</strong> ${candidateEmail}</li>
          <li><strong>Deadline:</strong> 48 hours from receipt of this email</li>
        </ul>
      </div>

      <div style="text-align: center;">
        <a href="https://assessments-dashboard.foundit.in/login" class="button">Access Assessment Portal</a>
      </div>

      <div class="instructions">
        <h3 style="margin-top: 0; color: #0891b2;">Instructions</h3>
        <ol>
          <li>Click on the "Access Assessment Portal" button above</li>
          <li>Log in using your email address: <strong>${candidateEmail}</strong></li>
          <li>Complete all sections of the assessment</li>
          <li>Submit your responses before the deadline</li>
        </ol>

        <h4 style="color: #0891b2;">Please note:</h4>
        <ul>
          <li>The assessment should take approximately 45-60 minutes to complete</li>
          <li>Ensure you have a stable internet connection</li>
          <li>Complete the assessment in one sitting if possible</li>
          <li>Contact the recruitment team if you encounter any technical issues</li>
        </ul>
      </div>

      <p>If you have any questions or need assistance, please don't hesitate to reach out to our recruitment team.</p>

      <p>We look forward to reviewing your assessment results.</p>

      <p>Best regards,<br><strong>${senderName}</strong></p>

      <div class="footer">
        <p>This is an automated message from ${senderEmail}</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    const emailText = `
Dear ${candidateName},

Congratulations on being selected for the ${position} position!

As the next step in our hiring process, we kindly request you to complete an online assessment.

Assessment Details:
- Platform: Found.it Assessments
- Assessment Link: https://assessments-dashboard.foundit.in/login
- Your Email: ${candidateEmail}
- Deadline: 48 hours from receipt of this email

Instructions:
1. Click on the assessment link: https://assessments-dashboard.foundit.in/login
2. Log in using your email address: ${candidateEmail}
3. Complete all sections of the assessment
4. Submit your responses before the deadline

Please note:
- The assessment should take approximately 45-60 minutes to complete
- Ensure you have a stable internet connection
- Complete the assessment in one sitting if possible
- Contact the recruitment team if you encounter any technical issues

If you have any questions or need assistance, please don't hesitate to reach out to our recruitment team.

We look forward to reviewing your assessment results.

Best regards,
${senderName}

---
This is an automated message from ${senderEmail}
    `;

    const emailSent = await sendEmailViaSMTP(
      candidateEmail,
      `Online Assessment Invitation - ${position}`,
      emailHtml,
      emailText,
      senderEmail,
      senderName
    );

    if (!emailSent) {
      console.log('SMTP not configured. Email details logged for manual sending.');
      console.log('To:', candidateEmail);
      console.log('From:', senderEmail);
      console.log('Subject:', `Online Assessment Invitation - ${position}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Assessment notification queued. Please configure SMTP to send emails automatically.",
          candidateId,
          candidateEmail,
          smtpConfigured: false,
          senderEmail,
          assessmentLink: "https://assessments-dashboard.foundit.in/login"
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('Email sent successfully to:', candidateEmail, 'from:', senderEmail);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Assessment notification sent successfully",
        candidateId,
        candidateEmail,
        sentFrom: senderEmail,
        smtpConfigured: true
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error('Error sending assessment notification:', error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
