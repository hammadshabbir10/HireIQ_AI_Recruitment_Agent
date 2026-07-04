import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { ChatGroq } from '@langchain/groq';
import { supabase } from '../supabase';

// Internal LLM for tool-level reasoning (fast model for analysis)
const analysisLLM = new ChatGroq({
  model: 'llama-3.3-70b-versatile',
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0.1,
});

// ─── TOOL 1: Parse and Score ──────────────────────────────────────────────────
// Model calls this with simple inputs. The tool itself does AI analysis internally.
export const parseAndScoreTool = tool(
  async ({ cv_text, job_description, job_title, candidate_name, candidate_email }) => {
    const prompt = `You are an expert technical recruiter. Analyze this candidate against the job description.

JOB TITLE: ${job_title}

JOB DESCRIPTION:
${job_description}

CANDIDATE CV:
${cv_text}

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "score": <number 0-100>,
  "score_reasoning": "<3-5 sentences explaining the score, referencing specific skills and gaps>",
  "key_strengths": "<3-5 key strengths comma-separated>",
  "experience_summary": "<2-3 sentence professional summary of this candidate>",
  "status": "<'shortlisted' if score >= 70, 'pending' if 50-69, 'rejected' if below 50>"
}`;

    try {
      const response = await analysisLLM.invoke([{ role: 'user', content: prompt }]);
      const raw = (response.content as string).trim();
      // Strip any accidental markdown code fences
      const cleaned = raw.replace(/^```json\n?|^```\n?|\n?```$/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return JSON.stringify({
        success: true,
        candidate_name,
        candidate_email,
        job_title,
        score: parsed.score,
        score_reasoning: parsed.score_reasoning,
        key_strengths: parsed.key_strengths,
        experience_summary: parsed.experience_summary,
        status: parsed.status,
        message: `✅ Scored ${candidate_name}: ${parsed.score}/100`
      });
    } catch (e) {
      return JSON.stringify({ success: false, error: String(e) });
    }
  },
  {
    name: 'parse_and_score_tool',
    description: 'Parse a candidate CV and score them against a job description. Call this first when screening a candidate. Pass the raw CV text, job description, job title, candidate name and email.',
    schema: z.object({
      cv_text: z.string().describe('The full raw CV/resume text'),
      job_description: z.string().describe('The full job description text'),
      job_title: z.string().describe('The job title being hired for'),
      candidate_name: z.string().describe('Full name of the candidate extracted from the CV'),
      candidate_email: z.string().describe('Email address of the candidate extracted from the CV'),
    }),
  }
);

// ─── TOOL 2: Draft Outreach Email ─────────────────────────────────────────────
export const draftOutreachTool = tool(
  async ({ candidate_name, candidate_email, job_title, score, key_strengths, experience_summary }) => {
    const prompt = `You are a professional recruiter. Write a warm, personalized outreach email for this candidate.

Candidate: ${candidate_name} (${candidate_email})
Job Title: ${job_title}
Score: ${score}/100
Key Strengths: ${key_strengths}
Background: ${experience_summary}

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "subject": "<compelling subject line>",
  "body": "<full professional email body, 3-4 paragraphs, warm tone, reference their specific strengths, clear call to action>"
}`;

    try {
      const response = await analysisLLM.invoke([{ role: 'user', content: prompt }]);
      const raw = (response.content as string).trim();
      const cleaned = raw.replace(/^```json\n?|^```\n?|\n?```$/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return JSON.stringify({
        success: true,
        candidate_name,
        candidate_email,
        email_subject: parsed.subject,
        email_body: parsed.body,
        message: `✅ Outreach email drafted for ${candidate_name}`
      });
    } catch (e) {
      return JSON.stringify({ success: false, error: String(e) });
    }
  },
  {
    name: 'draft_outreach_tool',
    description: 'Draft a personalized outreach email for a candidate. Call this AFTER parse_and_score_tool. Pass the candidate details and score from the previous step.',
    schema: z.object({
      candidate_name: z.string().describe('Full name of the candidate'),
      candidate_email: z.string().describe('Email of the candidate'),
      job_title: z.string().describe('The job title they are being considered for'),
      score: z.number().describe('The candidate score from parse_and_score_tool'),
      key_strengths: z.string().describe('Key strengths from parse_and_score_tool result'),
      experience_summary: z.string().describe('Experience summary from parse_and_score_tool result'),
    }),
  }
);

// ─── TOOL 3: Summarize Interview ──────────────────────────────────────────────
export const summarizeInterviewTool = tool(
  async ({ interview_notes, candidate_name }) => {
    const prompt = `You are an expert interviewer. Summarize these interview notes for candidate: ${candidate_name}

INTERVIEW NOTES:
${interview_notes}

Respond with ONLY valid JSON (no markdown, no code blocks):
{
  "strengths": "<3-4 key strengths demonstrated>",
  "weaknesses": "<2-3 areas of concern or improvement>",
  "recommendation": "<one of: Strong Hire, Hire, Maybe, No Hire>",
  "overall_assessment": "<3-4 sentence comprehensive assessment>"
}`;

    try {
      const response = await analysisLLM.invoke([{ role: 'user', content: prompt }]);
      const raw = (response.content as string).trim();
      const cleaned = raw.replace(/^```json\n?|^```\n?|\n?```$/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return JSON.stringify({
        success: true,
        candidate_name,
        strengths: parsed.strengths,
        weaknesses: parsed.weaknesses,
        recommendation: parsed.recommendation,
        overall_assessment: parsed.overall_assessment,
        message: `✅ Interview summary created for ${candidate_name}: ${parsed.recommendation}`
      });
    } catch (e) {
      return JSON.stringify({ success: false, error: String(e) });
    }
  },
  {
    name: 'summarize_interview_tool',
    description: 'Summarize raw interview notes into a structured format with strengths, weaknesses, and recommendation.',
    schema: z.object({
      interview_notes: z.string().describe('Raw interview notes or transcript'),
      candidate_name: z.string().describe('Name of the candidate interviewed'),
    }),
  }
);

// ─── TOOL 4: Save to Pipeline ─────────────────────────────────────────────────
export const saveToPipelineTool = tool(
  async ({
    name, email, raw_cv, parsed_summary, score, score_reasoning,
    status, email_subject, email_body, job_id,
  }) => {
    try {
      const { data: candidate, error: candidateError } = await supabase
        .from('candidates')
        .insert({
          job_id: job_id || null,
          name,
          email,
          raw_cv,
          parsed_summary,
          score: score || null,
          score_reasoning: score_reasoning || null,
          status: status || 'pending',
        })
        .select()
        .single();

      if (candidateError) throw candidateError;
      const savedId = candidate.id;

      if (email_body && savedId) {
        await supabase.from('outreach_emails').insert({
          candidate_id: savedId,
          subject_line: email_subject || 'Invitation to Interview',
          email_body,
        });
      }

      return JSON.stringify({
        success: true,
        candidate_id: savedId,
        message: `✅ ${name} saved to pipeline (${status || 'pending'}, score: ${score || 'N/A'}/100)`,
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: String(error),
        message: `Failed to save: ${String(error)}`
      });
    }
  },
  {
    name: 'save_to_pipeline_tool',
    description: 'Save a candidate to the Supabase hiring pipeline. Call this LAST after scoring and drafting the email. Pass all data collected from previous tool steps.',
    schema: z.object({
      name: z.string().describe('Candidate full name'),
      email: z.string().describe('Candidate email address'),
      raw_cv: z.string().describe('The original CV text'),
      parsed_summary: z.string().describe('Experience summary from parse_and_score_tool'),
      score: z.number().optional().describe('Score from parse_and_score_tool (0-100)'),
      score_reasoning: z.string().optional().describe('Score reasoning from parse_and_score_tool'),
      status: z.enum(['pending', 'shortlisted', 'rejected', 'contacted']).describe('Pipeline status from parse_and_score_tool'),
      email_subject: z.string().optional().describe('Email subject from draft_outreach_tool'),
      email_body: z.string().optional().describe('Email body from draft_outreach_tool'),
      job_id: z.string().optional().describe('Job ID if available, otherwise omit'),
    }),
  }
);

export const tools = [
  parseAndScoreTool,
  draftOutreachTool,
  summarizeInterviewTool,
  saveToPipelineTool,
];
