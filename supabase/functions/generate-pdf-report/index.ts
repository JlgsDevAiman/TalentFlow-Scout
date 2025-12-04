import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import PDFDocument from "npm:pdfkit@0.15.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const POWER_AUTOMATE_URL = "https://defaulte97b19be5239463599c99898cf4c3e.60.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/11f8b14b8e274a7fb71a0974a8d08dd6/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=IIM-aEF-Lxu4HGDUvV4pyFgoyGP4yrIyzzjs5o5kv9U";

const JLG_LOGO_URL = "https://vhigwvycchyxbcfvsxpl.supabase.co/storage/v1/object/public/approval-documents/JLG%20Logo_White.png";

interface RequestBody {
  reportType: string;
  data: any[];
  emailAddress: string;
}

interface CandidateRecord {
  'Approval ID': string;
  'Candidate Name': string;
  'Candidate Email': string;
  'Candidate Phone': string;
  'Position Applied': string;
  'Years of Experience': number | string;
  'Candidate Status': string;
  'Business Unit': string;
  'Job Category': string;
  'AI Fit Score': number | string;
  'AI Recommended Position': string;
  'AI Detailed Analysis': string;
  'Candidate Notes': string;
  'Candidate Submission Date': string;
  'Resume / CV File': string;
  'Assessment File': string;
  'Background Check File': string;
  'Approval Type': string;
  'Approval Status': string;
  'Verifier Name': string;
  'Verifier Email': string;
  'Approver Name': string;
  'Approver Email': string;
  'Approval Comments': string;
  'Approval Created At': string;
  'Approval Updated At': string;
}

function calculateStats(records: CandidateRecord[]) {
  const totalCandidates = records.length;
  const uniqueCandidates = new Set(records.map(r => r['Candidate Name'])).size;

  const approvalStats = {
    approved: records.filter(r => r['Approval Status'] === 'Approved').length,
    pending: records.filter(r => r['Approval Status'] === 'Pending').length,
    rejected: records.filter(r => r['Approval Status'] === 'Rejected').length,
  };

  const avgAiScore = records
    .filter(r => r['AI Fit Score'] !== 'N/A')
    .reduce((sum, r) => sum + Number(r['AI Fit Score']), 0) / records.filter(r => r['AI Fit Score'] !== 'N/A').length || 0;

  const businessUnits = records.reduce((acc: { [key: string]: number }, r) => {
    const unit = r['Business Unit'];
    if (unit !== 'N/A') {
      acc[unit] = (acc[unit] || 0) + 1;
    }
    return acc;
  }, {});

  return {
    totalCandidates,
    uniqueCandidates,
    approvalStats,
    avgAiScore: avgAiScore.toFixed(1),
    businessUnits,
  };
}

async function fetchLogo(): Promise<Buffer | null> {
  try {
    const response = await fetch(JLG_LOGO_URL);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Failed to fetch logo:', error);
    return null;
  }
}

function getStatusColor(status: string): string {
  const colors: { [key: string]: string } = {
    'Approved': '#10b981',
    'Pending': '#f59e0b',
    'Rejected': '#ef4444',
    'New': '#3b82f6',
    'Shortlisted': '#10b981',
    'Interview': '#06b6d4',
    'Assessment': '#f59e0b',
    'Background Check': '#8b5cf6',
    'Hired': '#a855f7',
  };
  return colors[status] || '#6b7280';
}

function wrapText(doc: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const testWidth = doc.widthOfString(testLine);

    if (testWidth > maxWidth && i > 0) {
      doc.text(line.trim(), x, currentY);
      line = words[i] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }

  if (line.trim().length > 0) {
    doc.text(line.trim(), x, currentY);
    currentY += lineHeight;
  }

  return currentY;
}

async function generatePDF(data: CandidateRecord[]): Promise<Uint8Array> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        bufferPages: true,
      });

      const chunks: Uint8Array[] = [];
      doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const stats = calculateStats(data);
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 40;
      const contentWidth = pageWidth - 2 * margin;

      const logo = await fetchLogo();

      for (let i = 0; i < data.length; i++) {
        if (i > 0) doc.addPage();

        const record = data[i];
        let yPos = margin;

        doc.rect(0, 0, pageWidth, 80).fill('#06b6d4');

        doc.fontSize(24).fillColor('#ffffff').font('Helvetica-Bold')
          .text('Candidate Approval Report', margin, yPos + 15, { width: contentWidth - 150, continued: false });

        if (logo) {
          try {
            doc.image(logo, pageWidth - margin - 120, yPos + 10, { width: 100, height: 50 });
          } catch (e) {
            console.error('Error adding logo:', e);
          }
        }

        doc.fontSize(10).fillColor('#e0f2fe')
          .text(`Generated: ${new Date().toLocaleString()}`, margin, yPos + 50, { continued: false });

        yPos = 100;

        doc.fontSize(16).fillColor('#0f172a').font('Helvetica-Bold')
          .text('Candidate Information', margin, yPos, { continued: false });
        yPos += 25;

        doc.fontSize(18).fillColor('#06b6d4').font('Helvetica-Bold')
          .text(record['Candidate Name'], margin, yPos, { continued: false });
        yPos += 25;

        doc.fontSize(9).fillColor('#64748b').font('Helvetica')
          .text('Email:', margin, yPos, { continued: false })
          .fillColor('#1e293b')
          .text(record['Candidate Email'], margin + 100, yPos, { continued: false });
        yPos += 15;

        doc.fillColor('#64748b')
          .text('Phone:', margin, yPos, { continued: false })
          .fillColor('#1e293b')
          .text(record['Candidate Phone'], margin + 100, yPos, { continued: false });
        yPos += 15;

        doc.fillColor('#64748b')
          .text('Position Applied:', margin, yPos, { continued: false })
          .fillColor('#1e293b').font('Helvetica-Bold')
          .text(record['Position Applied'], margin + 100, yPos, { width: contentWidth - 100, continued: false });
        yPos += 15;

        doc.font('Helvetica').fillColor('#64748b')
          .text('Experience:', margin, yPos, { continued: false })
          .fillColor('#1e293b')
          .text(`${record['Years of Experience']} years`, margin + 100, yPos, { continued: false });
        yPos += 15;

        doc.fillColor('#64748b')
          .text('Business Unit:', margin, yPos, { continued: false })
          .fillColor('#1e293b')
          .text(record['Business Unit'], margin + 100, yPos, { continued: false });
        yPos += 15;

        doc.fillColor('#64748b')
          .text('Job Category:', margin, yPos, { continued: false })
          .fillColor('#1e293b')
          .text(record['Job Category'], margin + 100, yPos, { continued: false });
        yPos += 20;

        doc.fontSize(14).fillColor('#0f172a').font('Helvetica-Bold')
          .text('AI Evaluation', margin, yPos, { continued: false });
        yPos += 20;

        const scoreBoxY = yPos;
        doc.roundedRect(margin, scoreBoxY, 120, 50, 5).fill('#f0f9ff');
        doc.fontSize(10).fillColor('#64748b').font('Helvetica')
          .text('AI Fit Score', margin + 10, scoreBoxY + 10, { continued: false });
        doc.fontSize(20).fillColor('#06b6d4').font('Helvetica-Bold')
          .text(`${record['AI Fit Score']}/100`, margin + 10, scoreBoxY + 25, { continued: false });

        if (record['AI Recommended Position'] !== 'N/A') {
          doc.roundedRect(margin + 140, scoreBoxY, 200, 50, 5).fill('#f0fdf4');
          doc.fontSize(10).fillColor('#64748b').font('Helvetica')
            .text('Recommended Position', margin + 150, scoreBoxY + 10, { continued: false });
          doc.fontSize(11).fillColor('#10b981').font('Helvetica-Bold')
            .text(record['AI Recommended Position'], margin + 150, scoreBoxY + 25, { width: 180, continued: false });
        }

        yPos = scoreBoxY + 60;

        if (record['AI Detailed Analysis'] !== 'N/A') {
          doc.fontSize(10).fillColor('#64748b').font('Helvetica-Bold')
            .text('Detailed Analysis:', margin, yPos, { continued: false });
          yPos += 15;

          doc.fontSize(9).fillColor('#334155').font('Helvetica');
          const analysisHeight = doc.heightOfString(record['AI Detailed Analysis'], { width: contentWidth });
          const maxAnalysisHeight = 60;

          if (analysisHeight > maxAnalysisHeight) {
            const truncatedText = record['AI Detailed Analysis'].substring(0, 400) + '...';
            doc.text(truncatedText, margin, yPos, { width: contentWidth, continued: false });
            yPos += maxAnalysisHeight + 10;
          } else {
            doc.text(record['AI Detailed Analysis'], margin, yPos, { width: contentWidth, continued: false });
            yPos += analysisHeight + 10;
          }
        }

        doc.fontSize(14).fillColor('#0f172a').font('Helvetica-Bold')
          .text('Approval Workflow', margin, yPos, { continued: false });
        yPos += 20;

        const statusColor = getStatusColor(record['Approval Status']);
        doc.roundedRect(margin, yPos, contentWidth, 80, 8).fill('#f8fafc').stroke('#e2e8f0');

        doc.fontSize(10).fillColor('#64748b').font('Helvetica')
          .text('Approval Type:', margin + 15, yPos + 15, { continued: false });
        doc.fontSize(11).fillColor('#1e293b').font('Helvetica-Bold')
          .text(record['Approval Type'], margin + 15, yPos + 30, { continued: false });

        doc.fontSize(10).fillColor('#64748b').font('Helvetica')
          .text('Status:', margin + 200, yPos + 15, { continued: false });
        doc.fontSize(11).fillColor(statusColor).font('Helvetica-Bold')
          .text(record['Approval Status'], margin + 200, yPos + 30, { continued: false });

        if (record['Verifier Name'] !== 'N/A') {
          doc.fontSize(8).fillColor('#64748b').font('Helvetica')
            .text(`Verifier: ${record['Verifier Name']}`, margin + 15, yPos + 55, { continued: false });
        }

        if (record['Approver Name'] !== 'N/A') {
          doc.fontSize(8).fillColor('#64748b').font('Helvetica')
            .text(`Approver: ${record['Approver Name']}`, margin + 200, yPos + 55, { continued: false });
        }

        yPos += 95;

        if (record['Approval Comments'] !== 'No comments') {
          doc.fontSize(9).fillColor('#64748b').font('Helvetica-Bold')
            .text('Comments:', margin, yPos, { continued: false });
          yPos += 12;

          const commentHeight = doc.heightOfString(record['Approval Comments'], { width: contentWidth });
          const maxCommentHeight = 30;

          doc.fontSize(8).fillColor('#334155').font('Helvetica');
          if (commentHeight > maxCommentHeight) {
            const truncatedComment = record['Approval Comments'].substring(0, 200) + '...';
            doc.text(truncatedComment, margin, yPos, { width: contentWidth, continued: false });
            yPos += maxCommentHeight + 10;
          } else {
            doc.text(record['Approval Comments'], margin, yPos, { width: contentWidth, continued: false });
            yPos += commentHeight + 10;
          }
        }

        doc.fontSize(14).fillColor('#0f172a').font('Helvetica-Bold')
          .text('Supporting Documents', margin, yPos, { continued: false });
        yPos += 18;

        const docs = [
          { label: 'Resume/CV', value: record['Resume / CV File'] },
          { label: 'Assessment', value: record['Assessment File'] },
          { label: 'Background Check', value: record['Background Check File'] },
        ].filter(d => d.value !== 'N/A');

        docs.forEach(docItem => {
          doc.fontSize(9).fillColor('#1e293b').font('Helvetica-Bold')
            .text(`• ${docItem.label}:`, margin, yPos, { continued: false });
          doc.fillColor('#64748b').font('Helvetica')
            .text(docItem.value, margin + 100, yPos, { width: contentWidth - 100, continued: false });
          yPos += 12;
        });

        yPos += 10;

        doc.fontSize(8).fillColor('#94a3b8').font('Helvetica')
          .text(`Submitted: ${record['Candidate Submission Date']}`, margin, yPos, { continued: false });
        doc.text(`Last Updated: ${record['Approval Updated At']}`, margin + 250, yPos, { continued: false });

        const footerY = pageHeight - 30;
        doc.fontSize(8).fillColor('#94a3b8').font('Helvetica')
          .text(`Record ${i + 1} of ${data.length} | TalentFlow Scout System - Confidential`, margin, footerY, {
            width: contentWidth,
            align: 'center',
            continued: false
          });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
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

    const pdfBuffer = await generatePDF(data);
    const pdfBase64 = btoa(String.fromCharCode(...pdfBuffer));

    if (emailAddress === 'download@localhost.local') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'PDF generated successfully',
          recordCount: data.length,
          pdfSize: pdfBuffer.length,
          pdfBase64,
        }),
        {
          status: 200,
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
      pdfBase64,
      fileName: `Candidate_Approval_Report_${new Date().toISOString().split('T')[0]}.pdf`,
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
        pdfSize: pdfBuffer.length,
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
    console.error("Error generating PDF report:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to generate PDF report",
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