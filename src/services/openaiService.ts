import { Candidate } from '../types/candidate';
import { JobDescription } from './jobDescriptionService';
import { JobDescriptionFile } from './jdParserService';

interface AIScoreResult {
  score: number;
  comment: string;
}

export interface PositionMatch {
  position_title: string;
  jd_id: string;
  score: number;
  reason: string;
}

export interface MultiPositionScoreResult {
  best_match: PositionMatch;
  all_matches: PositionMatch[];
  overall_comment: string;
}

export interface ParsedResumeData {
  full_name: string;
  email: string;
  phone: string;
  position_applied: string;
  years_experience: number;
  notes: string;
}

export async function getAIFitScore(candidate: Candidate): Promise<AIScoreResult> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    throw new Error('OpenAI API key not configured. Please add your API key to the .env file.');
  }

  const prompt = `You are an HR assistant evaluating candidates for job positions.

Candidate Information:
- Name: ${candidate.full_name}
- Position Applied: ${candidate.position_applied}
- Years of Experience: ${candidate.years_experience}
- Email: ${candidate.email}
- Phone: ${candidate.phone}
${candidate.notes ? `- Additional Notes: ${candidate.notes}` : ''}

Based on this information, provide:
1. A fit score from 0-100 (where 100 is an excellent fit)
2. A brief 1-2 sentence comment explaining the score

Format your response as JSON with this structure:
{
  "score": <number>,
  "comment": "<your comment>"
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an HR assistant that evaluates candidate fit for job positions. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 200
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to get AI score');
  }

  const data = await response.json();
  let content = data.choices[0].message.content;

  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  const result = JSON.parse(content);

  return {
    score: Math.min(100, Math.max(0, result.score)),
    comment: result.comment
  };
}

export async function getMultiPositionFitScoreFromFiles(
  candidate: Candidate,
  jobDescriptionFiles: JobDescriptionFile[]
): Promise<MultiPositionScoreResult> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    throw new Error('OpenAI API key not configured. Please add your API key to the .env file.');
  }

  const jdSummaries = jobDescriptionFiles.map((jd, index) => {
    const contentPreview = jd.content.length > 1500
      ? jd.content.substring(0, 1500) + '...'
      : jd.content;
    return `${index + 1}. ${jd.title}:\n${contentPreview}`;
  }).join('\n\n---\n\n');

  const prompt = `You are an expert HR assistant evaluating a candidate against multiple job positions.

Candidate Information:
- Name: ${candidate.full_name}
- Current Position Applied: ${candidate.position_applied}
- Years of Experience: ${candidate.years_experience}
${candidate.notes ? `- Skills & Background: ${candidate.notes}` : ''}

Available Positions:
${jdSummaries}

Tasks:
1. Carefully analyze the candidate's profile against EACH job description
2. Score each position from 0-100 based on:
   - Skills match
   - Experience level alignment
   - Qualifications fit
   - Overall suitability
3. Identify the BEST matching position
4. Provide specific reasons for each score

Format your response as JSON with this structure:
{
  "best_match": {
    "position_title": "<title of best matching position>",
    "jd_id": "<index number from list>",
    "score": <0-100>,
    "reason": "<specific explanation of why this is the best fit>"
  },
  "all_matches": [
    {
      "position_title": "<position title>",
      "jd_id": "<index number>",
      "score": <0-100>,
      "reason": "<brief explanation of fit>"
    }
  ],
  "overall_comment": "<1-2 sentence summary highlighting candidate's key strengths and best position match>"
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR assistant that carefully evaluates candidates against job descriptions. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to get AI score');
  }

  const data = await response.json();
  let content = data.choices[0].message.content;

  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  const result = JSON.parse(content);

  const mapMatch = (match: any): PositionMatch => {
    return {
      position_title: match.position_title,
      jd_id: match.jd_id,
      score: Math.min(100, Math.max(0, match.score)),
      reason: match.reason
    };
  };

  return {
    best_match: mapMatch(result.best_match),
    all_matches: result.all_matches.map(mapMatch),
    overall_comment: result.overall_comment
  };
}

export async function getMultiPositionFitScore(
  candidate: Candidate,
  jobDescriptions: JobDescription[]
): Promise<MultiPositionScoreResult> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    throw new Error('OpenAI API key not configured. Please add your API key to the .env file.');
  }

  const jdSummaries = jobDescriptions.map((jd, index) =>
    `${index + 1}. ${jd.title}:\n${jd.description.substring(0, 500)}...`
  ).join('\n\n');

  const prompt = `You are an expert HR assistant evaluating a candidate against multiple job positions.

Candidate Information:
- Name: ${candidate.full_name}
- Current Position Applied: ${candidate.position_applied}
- Years of Experience: ${candidate.years_experience}
${candidate.notes ? `- Skills & Background: ${candidate.notes}` : ''}

Available Positions:
${jdSummaries}

Tasks:
1. Evaluate the candidate's fit for EACH position (score 0-100 for each)
2. Identify the BEST matching position
3. Provide specific reasons why each position is or isn't a good fit
4. Give an overall assessment

Format your response as JSON with this structure:
{
  "best_match": {
    "position_title": "<title of best matching position>",
    "jd_id": "<index number from list>",
    "score": <0-100>,
    "reason": "<specific explanation>"
  },
  "all_matches": [
    {
      "position_title": "<position title>",
      "jd_id": "<index number>",
      "score": <0-100>,
      "reason": "<brief explanation>"
    }
  ],
  "overall_comment": "<1-2 sentence summary of candidate's strengths and best fit>"
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR assistant that evaluates candidates against multiple job positions. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1500
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to get AI score');
  }

  const data = await response.json();
  let content = data.choices[0].message.content;

  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  const result = JSON.parse(content);

  const mapMatch = (match: any): PositionMatch => {
    const jdIndex = parseInt(match.jd_id) - 1;
    const jd = jobDescriptions[jdIndex];

    return {
      position_title: match.position_title,
      jd_id: jd?.id || match.jd_id,
      score: Math.min(100, Math.max(0, match.score)),
      reason: match.reason
    };
  };

  return {
    best_match: mapMatch(result.best_match),
    all_matches: result.all_matches.map(mapMatch),
    overall_comment: result.overall_comment
  };
}

export interface SalaryPackage {
  base_salary: string;
  allowances: {
    housing?: string;
    transport?: string;
    meal?: string;
    other?: string;
  };
  benefits: string[];
  total_annual_package: string;
  justification: string;
  market_comparison: string;
}

export async function generateSalaryPackage(
  position: string,
  yearsExperience: string,
  notes: string,
  cvContent?: string
): Promise<SalaryPackage> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    throw new Error('OpenAI API key not configured. Please add your API key to the .env file.');
  }

  const prompt = `You are an expert HR compensation specialist. Generate a competitive salary package proposal.

Position Information:
- Position: ${position}
- Years of Experience: ${yearsExperience}
${notes ? `- Additional Notes: ${notes}` : ''}
${cvContent ? `- CV Summary: ${cvContent.substring(0, 1000)}` : ''}

Generate a comprehensive salary package that includes:
1. Base salary (annual amount in MYR - Malaysian Ringgit)
2. Allowances breakdown (housing, transport, meal, other)
3. Benefits list (insurance, leave, bonuses, etc.)
4. Total annual package value
5. Justification for the proposed amounts
6. Market comparison context

Consider:
- Industry standards in Malaysia
- Experience level
- Position seniority
- Competitive market rates
- Standard benefits packages

Format your response as JSON with this structure:
{
  "base_salary": "RM XXX,XXX per annum",
  "allowances": {
    "housing": "RM X,XXX per month",
    "transport": "RM X,XXX per month",
    "meal": "RM XXX per month",
    "other": "RM X,XXX per month"
  },
  "benefits": [
    "Medical insurance",
    "Annual leave (XX days)",
    "Performance bonus",
    "etc."
  ],
  "total_annual_package": "RM XXX,XXX",
  "justification": "Brief explanation of the package rationale",
  "market_comparison": "How this compares to market rates"
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR compensation specialist in Malaysia. Always respond with valid JSON and realistic Malaysian salary ranges.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to generate salary package');
  }

  const data = await response.json();
  let content = data.choices[0].message.content;

  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  const result = JSON.parse(content);

  return result;
}

export async function parseResume(fileContent: string): Promise<ParsedResumeData> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    throw new Error('OpenAI API key not configured. Please add your API key to the .env file.');
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

  let response;
  try {
    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an HR assistant that extracts structured data from resumes. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 500
      })
    });
  } catch (networkError) {
    throw new Error('Network error: Unable to connect to OpenAI API. Please check your internet connection.');
  }

  if (!response.ok) {
    let errorMessage = 'Failed to parse resume';

    try {
      const error = await response.json();
      errorMessage = error.error?.message || `API Error: ${response.status} ${response.statusText}`;
    } catch {
      errorMessage = `API Error: ${response.status} ${response.statusText}`;
    }

    if (response.status === 401) {
      throw new Error('401: Invalid OpenAI API key. Please check your .env file.');
    } else if (response.status === 429) {
      throw new Error('429: OpenAI API rate limit exceeded. Please try again later.');
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();
  let content = data.choices[0].message.content;

  content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  let result;
  try {
    result = JSON.parse(content);
  } catch (parseError) {
    throw new Error('Failed to parse AI response. Please try uploading a different resume format or check the file content.');
  }

  return {
    full_name: result.full_name || 'Unknown',
    email: result.email || 'not_provided@example.com',
    phone: result.phone || 'Not provided',
    position_applied: result.position_applied || 'General Application',
    years_experience: Math.max(0, result.years_experience || 0),
    notes: result.notes || ''
  };
}
