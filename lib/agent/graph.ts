import { ChatGroq } from '@langchain/groq';
import { HumanMessage, AIMessage, BaseMessage } from '@langchain/core/messages';
import { supabase } from '../supabase';

// I used the fast 8b model for analysis because it has much lower token usage
const analysisLLM = new ChatGroq({
  model: 'llama-3.1-8b-instant',
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0.1,
});

// Sleep helper
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// I built a retry wrapper that handles 429 errors with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 15000): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const is429 = String(err).includes('429') || String(err?.message).includes('rate_limit');
      if (is429 && attempt < maxRetries - 1) {
        const delay = baseDelay * (attempt + 1); // 15s, 30s, 45s
        console.log(`Rate limit hit — waiting ${delay / 1000}s before retry ${attempt + 1}/${maxRetries}`);
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
}

// I created a robust JSON extractor that handles LLM quirks like control chars and extra text
function extractJSON(raw: string): any {
  // 1. Strip markdown code fences
  let text = raw
    .replace(/^```json\s*/gm, '')
    .replace(/^```\s*/gm, '')
    .replace(/```$/gm, '')
    .trim();

  // 2. Find the first { and last } to extract just the JSON object
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found in response');
  text = text.slice(start, end + 1);

  // 3. Remove control characters (tab, newline, carriage return, etc.) INSIDE JSON strings
  // Replace literal newlines inside strings with \\n
  text = text.replace(/("(?:[^"\\]|\\.)*")/g, (match) => {
    return match
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      // Remove other bad control chars (ASCII 0-31 except \\n \\r \\t which are now escaped)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  });

  try {
    return JSON.parse(text);
  } catch (e) {
    // Last resort: aggressively strip all control chars and retry
    const sanitized = text.replace(/[\x00-\x1F\x7F]/g, (c) => {
      if (c === '\n') return '\\n';
      if (c === '\r') return '\\r';
      if (c === '\t') return '\\t';
      return '';
    });
    return JSON.parse(sanitized);
  }
}

// I call the LLM and parse JSON from the response. I added retries on non JSON responses
async function callLLMForJSON(prompt: string, retries = 3): Promise<any> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await withRetry(() => analysisLLM.invoke([{ role: 'user', content: prompt }]));
      const raw = (response.content as string).trim();

      // If response looks like a rate-limit or error message (no JSON), wait and retry
      if (!raw.includes('{') && !raw.includes('[')) {
        console.warn(`Attempt ${attempt + 1}: LLM returned non-JSON response:`, raw.slice(0, 200));
        if (attempt < retries - 1) await sleep(10000 * (attempt + 1));
        continue;
      }

      return extractJSON(raw);
    } catch (e: any) {
      console.warn(`Attempt ${attempt + 1}: extractJSON failed:`, e.message);
      if (attempt < retries - 1) await sleep(8000 * (attempt + 1));
    }
  }
  throw new Error('LLM failed to return valid JSON after multiple attempts');
}

// STEP 1: I parse the CV and Score the candidate
async function stepParseAndScore(cvText: string, jobDescription: string, jobTitle: string) {
  const cv = cvText.slice(0, 2800);
  const jd = jobDescription.slice(0, 1500);

  // PHASE 1: I instructed the AI to just extract skills to keep it focused and reduce hallucination
  const extractPrompt = `You are a CV parser. ⚠️ INSTRUCTIONS:
- Read the JD and extract the core requirements into jd_must_haves and jd_nice_to_haves.
- Read the CV and intelligently match the candidate's skills against the JD requirements.
- Use SEMANTIC MATCHING. If the JD asks for "modern AI tools" and the CV has "LLMs" or "LangChain", that IS a match. If JD asks for "Generative AI", "HuggingFace" is a match.
- Extract ALL of: candidate_name, candidate_email, candidate_links, education, projects, experience from the CV.

═══ JOB DESCRIPTION ═══
${jd}

═══ CANDIDATE CV ═══
${cv}

Reply ONLY with valid single-line JSON:
{"candidate_name":"<name from CV>","candidate_email":"<email from CV>","candidate_links":["<urls/linkedin/github found in CV>"],"education":["<degree and school>"],"projects":["<project name and brief description>"],"experience":["<job title at company, duration>"],"experience_summary":"<2 sentence summary of what this person actually did>","jd_must_haves":["<skill1>","<skill2>"],"jd_nice_to_haves":["<skill1>","<skill2>"],"matched_must_haves":["<subset of jd_must_haves that candidate actually possesses (semantic matches allowed)>"],"matched_nice_to_haves":["<subset of jd_nice_to_haves that candidate possesses>"],"cv_skills":["<all technical skills found in CV>"],"has_real_work_experience":<true if has actual job/internship, false if only student projects>,"has_independent_projects":<true if built own projects>,"has_measurable_achievements":<true if CV has numbers/metrics>,"domain_relevance_note":"<1 sentence: how relevant is their actual experience to this specific JD>"}
`;

  const extracted = await callLLMForJSON(extractPrompt);

  // PHASE 2: I use the AI semantic matching to calculate the final scores
  const mustHaves: string[] = extracted.jd_must_haves || [];
  const niceToHaves: string[] = extracted.jd_nice_to_haves || [];
  
  const mustHaveMatches: string[] = extracted.matched_must_haves || [];
  const niceToHaveMatches: string[] = extracted.matched_nice_to_haves || [];

  // I calculate category scores using pure math
  const scoreA = mustHaves.length > 0 ? Math.round(40 * (mustHaveMatches.length / mustHaves.length)) : 0;
  const scoreB = niceToHaves.length > 0 ? Math.round(30 * (niceToHaveMatches.length / niceToHaves.length)) : 0;

  // I score the domain relevance based on the AI keyword sentiment
  const domainNote = (extracted.domain_relevance_note || '').toLowerCase();
  const scoreC = domainNote.includes('directly') || domainNote.includes('strong') ? 15
    : domainNote.includes('relevant') || domainNote.includes('related') ? 10
    : domainNote.includes('partial') || domainNote.includes('some') ? 6
    : 3;

  // Work experience
  const scoreD = extracted.has_real_work_experience ? 10 : 4;

  // Penalties
  let penalty = 0;
  if (mustHaveMatches.length < mustHaves.length * 0.25) penalty += 10;
  if (!extracted.has_independent_projects) penalty += 5;
  if (!extracted.has_measurable_achievements) penalty += 5;

  const total = Math.max(0, Math.min(100, scoreA + scoreB + scoreC + scoreD - penalty));
  const status = total >= 70 ? 'shortlisted' : total >= 50 ? 'pending' : 'rejected';

  const reasoning = `Must-Have Match: ${mustHaveMatches.length}/${mustHaves.length} matched (${mustHaveMatches.join(', ') || 'none'}). ` +
    `Tech Stack: ${niceToHaveMatches.length}/${niceToHaves.length} nice-to-haves matched. ` +
    `${domainNote.charAt(0).toUpperCase() + domainNote.slice(1)}.`;

  return {
    candidate_name: extracted.candidate_name || 'Unknown',
    candidate_email: extracted.candidate_email || '',
    score: total,
    score_reasoning: reasoning,
    key_strengths: extracted.cv_skills.slice(0, 5).join(', '),
    experience_summary: extracted.experience_summary || '',
    status,
    category_scores: { must_have: scoreA, tech_stack: scoreB, domain_experience: scoreC, work_experience: scoreD, penalties: penalty },
    extracted_jd_must_haves: mustHaves.join(', '),
    extracted_cv_skills: extracted.cv_skills.join(', '),
  };
}

// STEP 2: I draft the Outreach Email
async function stepDraftEmail(name: string, email: string, jobTitle: string, score: number, strengths: string, summary: string, recruiterName: string, status: string, formUrl?: string) {
  const isRejected = status === 'rejected';
  
  const instruction = isRejected 
    ? `Write a polite, professional, and appreciative rejection email (2-3 paragraphs). Thank them for taking the time to apply, acknowledge their specific background and effort, but clearly state we are not moving forward with their candidacy at this time. Wish them the best in their future endeavors.`
    : `Write a warm, professional recruiter outreach email (2-3 paragraphs). Invite them for an interview. Reference their specific work and include a clear call to action.` + (formUrl ? `\n\nCRITICAL: You MUST include this pre-screen questionnaire link in the email and ask them to fill it out: ${formUrl}` : '');

  const prompt = `${instruction}

IMPORTANT: You MUST sign off the email at the very end with "Best regards, \\n${recruiterName}".

Recruiter Name: ${recruiterName}
Candidate: ${name} (${email})
Role: ${jobTitle}
Background: ${summary}
Key Strengths: ${strengths}

Reply ONLY with valid single-line JSON:
{"subject":"<professional subject line>","body":"<2-3 paragraph email body including the sign-off at the end>"}`;

  return callLLMForJSON(prompt);
}

// STEP 3: I save the parsed data to Supabase
async function stepSavePipeline(data: {
  name: string; email: string; rawCv: string;
  summary: string; score: number; reasoning: string;
  status: string; emailSubject: string; emailBody: string;
  recruiterId: string | null;
}) {
  const { data: candidate, error } = await supabase
    .from('candidates')
    .insert({
      name: data.name,
      email: data.email,
      raw_cv: data.rawCv,
      parsed_summary: data.summary,
      score: data.score,
      score_reasoning: data.reasoning,
      status: data.status,
      ...(data.recruiterId ? { recruiter_id: data.recruiterId } : {}),
    })
    .select()
    .single();

  if (error) throw error;

  if (data.emailBody && candidate?.id) {
    await supabase.from('outreach_emails').insert({
      candidate_id: candidate.id,
      subject_line: data.emailSubject,
      email_body: data.emailBody,
    });
  }

  return candidate;
}

// ─── STEP 4: Generate Pre-Screen Questionnaire (shortlisted only) ──────────────
async function stepGenerateQuestionnaire(
  candidateId: string,
  jobTitle: string,
  jobDescription: string,
  cvText: string,
  cvSkills: string,
  summary: string
) {
  const prompt = `You are a senior recruiter. Generate exactly 8 pre-screen interview questions for a candidate applying for: ${jobTitle}.

Job Description (excerpt): ${jobDescription.slice(0, 1000)}
Candidate Background: ${summary}
Candidate Skills: ${cvSkills}

Generate a mix of:
- 3 technical questions (test specific skills required by the JD)
- 3 behavioural questions (situational, STAR-method style)
- 2 gap-probe questions (probe any weaknesses or missing skills)

For each question, also provide a concise expected answer (2-3 sentences) that a strong candidate should give.

Reply ONLY with valid JSON array:
[{"id":1,"type":"technical","question":"<question>","expected_answer":"<expected answer>"},{"id":2,"type":"behavioural","question":"<question>","expected_answer":"<expected answer>"}]`;

  let questions: any[] = [];
  try {
    const response = await withRetry(() => analysisLLM.invoke([{ role: 'user', content: prompt }]));
    const raw = (response.content as string).trim()
      .replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/```$/m, '').trim();
    const start = raw.indexOf('[');
    const end = raw.lastIndexOf(']');
    questions = JSON.parse(raw.slice(start, end + 1));
  } catch (e) {
    console.error('Failed to generate questions:', e);
    return null;
  }

  const { data, error } = await supabase
    .from('questionnaires')
    .insert({
      candidate_id: candidateId,
      job_title: jobTitle,
      questions,
      status: 'pending',
    })
    .select('form_token')
    .single();

  if (error) {
    console.error('Failed to save questionnaire:', error);
    return null;
  }

  return data?.form_token as string;
}

// ─── DIRECT SEQUENTIAL PIPELINE ───────────────────────────────────────────────
// No orchestrator LLM — we parse the message and call tools directly in order.
// This avoids burning token budget on routing decisions.
function extractCvAndJd(userMessage: string) {
  const jdMatch = userMessage.match(/JOB DESCRIPTION:\n([\s\S]*?)\n\nCANDIDATE CV:/);
  const cvMatch = userMessage.match(/CANDIDATE CV:\n([\s\S]*?)(?:\n\nPlease|$)/);

  const jobDescription = jdMatch?.[1]?.trim() || '';
  const cvText = cvMatch?.[1]?.trim() || userMessage;
  const jobTitleMatch = jobDescription.match(/Job Title:\s*(.+)/);
  const jobTitle = jobTitleMatch?.[1]?.trim() || 'Software Engineer';

  return { jobDescription, cvText, jobTitle };
}

// ─── MAIN STREAMING RUNNER ────────────────────────────────────────────────────
export async function runAgentStreamed(
  userMessage: string,
  history: BaseMessage[],
  emit: (data: object) => void,
  recruiterId: string | null = null,
  recruiterName: string = 'Recruiter'
) {
  const isScreeningRequest =
    userMessage.includes('JOB DESCRIPTION:') && userMessage.includes('CANDIDATE CV:');

  const isInterviewRequest = userMessage.includes('INTERVIEW NOTES:');

  // ── Screening Flow ──────────────────────────────────────────────────────────
  if (isScreeningRequest) {
    const { cvText, jobDescription, jobTitle } = extractCvAndJd(userMessage);
    const isShortlisted = true; // determined after scoring
    const TOTAL = 4; // 4 steps (3 base + questionnaire for shortlisted)

    // STEP 1 — Parse & Score
    emit({ type: 'step_start', tool: 'parse_and_score_tool', label: 'Analysing CV & scoring candidate…', step: 1, total: TOTAL, percent: 0 });
    const scored = await stepParseAndScore(cvText, jobDescription, jobTitle);
    emit({ type: 'step_complete', tool: 'parse_and_score_tool', label: 'Scored!', step: 1, total: TOTAL, percent: 25, result: { score: scored.score, message: `Scored ${scored.candidate_name}: ${scored.score}/100` } });

    // Build display elements
    const scoreEmoji = scored.score >= 70 ? '✅' : scored.score >= 50 ? '⚠️' : '❌';
    const recommendation = scored.status === 'shortlisted' ? 'Shortlisted for interview' : scored.status === 'pending' ? 'Added to review queue' : 'Rejected — does not meet requirements';
    const cs = scored.category_scores;
    const scoreBreakdown = cs
      ? `\n**Score Breakdown:**\n| Category | Score |\n|---|---|\n| A. Must-Have Match | ${cs.must_have ?? '?'}/40 |\n| B. Tech Stack Overlap | ${cs.tech_stack ?? '?'}/30 |\n| C. Domain Experience | ${cs.domain_experience ?? '?'}/15 |\n| D. Work Experience | ${cs.work_experience ?? '?'}/10 |\n| E. Penalties | -${cs.penalties ?? 0} |\n| **Total** | **${scored.score}/100** |`
      : '';
    const extractedInfo = scored.extracted_jd_must_haves
      ? `\n**JD Must-Haves extracted:** ${scored.extracted_jd_must_haves}\n**CV Skills found:** ${scored.extracted_cv_skills}`
      : '';

    // STEP 2 — Save to Pipeline (Initial Candidate Profile)
    emit({ type: 'step_start', tool: 'save_to_pipeline_tool', label: 'Saving to pipeline…', step: 2, total: TOTAL, percent: 25 });
    const savedCandidate = await stepSavePipeline({
      name: scored.candidate_name,
      email: scored.candidate_email,
      rawCv: cvText,
      summary: scored.experience_summary,
      score: scored.score,
      reasoning: scored.score_reasoning,
      status: scored.status,
      emailSubject: '',
      emailBody: '',
      recruiterId,
    });
    emit({ type: 'step_complete', tool: 'save_to_pipeline_tool', label: 'Saved!', step: 2, total: TOTAL, percent: 50, result: { success: true, message: `${scored.candidate_name} saved to pipeline` } });

    // STEP 3 — Generate questionnaire (shortlisted/pending only)
    let formToken: string | null = null;
    let formUrl = '';
    if (scored.status !== 'rejected' && savedCandidate?.id) {
      emit({ type: 'step_start', tool: 'generate_questionnaire_tool', label: 'Generating pre-screen questionnaire…', step: 3, total: TOTAL, percent: 50 });
      formToken = await stepGenerateQuestionnaire(
        savedCandidate.id,
        jobTitle,
        jobDescription,
        cvText,
        scored.key_strengths,
        scored.experience_summary
      );
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      formUrl = formToken ? `${baseUrl}/pre-screen/${formToken}` : '';
      emit({ type: 'step_complete', tool: 'generate_questionnaire_tool', label: 'Questionnaire ready!', step: 3, total: TOTAL, percent: 75, result: { success: !!formToken, message: formToken ? 'Pre-screen form generated' : 'Questionnaire generation skipped' } });
    } else {
      emit({ type: 'step_complete', tool: 'generate_questionnaire_tool', label: 'No questionnaire needed', step: 3, total: TOTAL, percent: 75, result: { success: true, message: 'Rejected candidates skip questionnaire' } });
    }

    // STEP 4 — Draft Email (now includes form URL)
    await sleep(2000);
    const emailActionLabel = scored.status === 'rejected' ? 'Drafting polite rejection email…' : 'Drafting personalised outreach email…';
    emit({ type: 'step_start', tool: 'draft_outreach_tool', label: emailActionLabel, step: 4, total: TOTAL, percent: 75 });
    const drafted = await stepDraftEmail(scored.candidate_name, scored.candidate_email, jobTitle, scored.score, scored.key_strengths, scored.experience_summary, recruiterName, scored.status, formUrl);
    
    // Save email to DB
    if (savedCandidate?.id && drafted.body) {
      await supabase.from('outreach_emails').insert({
        candidate_id: savedCandidate.id,
        subject_line: drafted.subject,
        email_body: drafted.body,
      });
    }

    emit({ type: 'step_complete', tool: 'draft_outreach_tool', label: 'Email drafted!', step: 4, total: TOTAL, percent: 100, result: { message: `Email drafted for ${scored.candidate_name}` } });

    const questionnaireNote = formUrl
      ? `\n\n📋 **Pre-Screen Form Generated:** A unique questionnaire form has been created for this candidate. Share this link with them:\n\`${formUrl}\`\n\nYou can monitor their responses in the **Pre-Screen** tab in the sidebar.`
      : '';

    const finalMessage = `${scoreEmoji} **${scored.candidate_name}** — Score: **${scored.score}/100** — ${recommendation}
${scoreBreakdown}
${extractedInfo}

**Evaluation Summary:**
${scored.score_reasoning}

**Key Strengths:** ${scored.key_strengths}

**Drafted Email Subject:** "${drafted.subject}"

The candidate has been saved to your pipeline with status: **${scored.status}**.${questionnaireNote}`;

    emit({ type: 'response', message: finalMessage });
    return;
  }

  // ── Interview Summary Flow ──────────────────────────────────────────────────
  if (isInterviewRequest) {
    const nameMatch = userMessage.match(/candidate: (.+)\n/);
    const candidateName = nameMatch?.[1] || 'Candidate';
    const notesMatch = userMessage.match(/INTERVIEW NOTES:\n([\s\S]*?)(?:\n\nPlease|$)/);
    const notes = notesMatch?.[1] || userMessage;

    emit({ type: 'step_start', tool: 'summarize_interview_tool', label: 'Summarising interview notes…', step: 1, total: 1, percent: 0 });

    const prompt = `Summarise this interview for ${candidateName}.

NOTES: ${notes.slice(0, 3000)}

Reply ONLY with valid, single-line JSON, no markdown or markdown code blocks:
{"strengths":"<key strengths>","weaknesses":"<areas of concern>","recommendation":"<Strong Hire|Hire|Maybe|No Hire>","overall_assessment":"<3 sentence assessment>"}`;

    const summary = await callLLMForJSON(prompt);
    
    // Save to database
    try {
      console.log('Searching for candidate:', candidateName);
      // Find candidate by name
      const { data: candidates, error: searchError } = await supabase
        .from('candidates')
        .select('id')
        .ilike('name', `%${candidateName}%`)
        .limit(1);
        
      if (searchError) {
        console.error("Error searching for candidate:", searchError);
      }
        
      if (candidates && candidates.length > 0) {
        console.log('Found candidate ID:', candidates[0].id);
        const { error: insertError } = await supabase.from('interview_summaries').insert({
          candidate_id: candidates[0].id,
          summary: summary.overall_assessment,
          strengths: summary.strengths,
          weaknesses: summary.weaknesses,
          recommendation: summary.recommendation,
          raw_notes: notes,
        });
        
        if (insertError) {
          console.error("Supabase insert error:", insertError);
          // Let's emit this back so we can see it in the UI temporarily for debugging
          emit({ type: 'error', message: `DB Insert Error: ${insertError.message}` });
        } else {
          console.log('Successfully inserted interview summary');
        }
      } else {
        console.log('Candidate not found in DB');
        emit({ type: 'error', message: `Could not find a candidate named "${candidateName}" in the pipeline. Please make sure the name matches exactly.` });
      }
    } catch (e) {
      console.error("Failed to save interview summary to DB", e);
    }
    
    emit({ type: 'step_complete', tool: 'summarize_interview_tool', label: 'Summary saved!', step: 1, total: 1, percent: 100, result: { message: `Interview summarised: ${summary.recommendation}` } });

    const finalMessage = `**Interview Summary — ${candidateName}**

**Recommendation: ${summary.recommendation}**

**Strengths:** ${summary.strengths}

**Areas of Concern:** ${summary.weaknesses}

**Overall Assessment:** ${summary.overall_assessment}

*(This summary has been automatically saved to the candidate's profile in the pipeline)*`;

    emit({ type: 'response', message: finalMessage });
    return;
  }

  // ── General Chat (no tools needed) ─────────────────────────────────────────
  const chatMessages = [
    { role: 'system' as const, content: 'You are HireIQ, an expert AI recruiting assistant. Answer questions about hiring, candidates, and recruiting best practices.' },
    ...history.map((m) => ({
      role: m._getType() === 'human' ? 'user' as const : 'assistant' as const,
      content: String(m.content),
    })),
    { role: 'user' as const, content: userMessage },
  ];

  const response = await withRetry(() => analysisLLM.invoke(chatMessages));
  emit({ type: 'response', message: response.content as string });
}
