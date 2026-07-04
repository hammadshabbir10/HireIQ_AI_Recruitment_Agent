import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ChatGroq } from '@langchain/groq';
import nodemailer from 'nodemailer';

const llm = new ChatGroq({
  model: 'llama-3.1-8b-instant',
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0.2,
});

// Public GET — candidate fetches their form via token
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { data, error } = await supabase
      .from('questionnaires')
      .select('id, job_title, questions, status, submitted_at, answers, candidates(name)')
      .eq('form_token', token)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    return NextResponse.json({ questionnaire: data });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// Public PUT — candidate submits answers
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { answers } = await request.json();

    // Fetch the questionnaire to get expected answers and candidate info
    const { data: qData, error: fetchError } = await supabase
      .from('questionnaires')
      .select('id, questions, status, job_title, candidates(id, name, email)')
      .eq('form_token', token)
      .single();

    if (fetchError || !qData) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    if (qData.status === 'submitted') {
      return NextResponse.json({ error: 'Form already submitted' }, { status: 409 });
    }

    const questions: any[] = qData.questions || [];

    // AI scores each answer against expected answer
    const scoringPrompt = `You are an expert interviewer. Score each candidate answer vs the expected answer on a scale of 0-10.

Questions and answers:
${questions.map((q: any, i: number) => `
Q${i + 1}: ${q.question}
Expected: ${q.expected_answer}
Candidate Answer: ${answers[i] || '(no answer)'}
`).join('\n')}

Reply ONLY with valid JSON array:
[{"id":1,"score":<0-10>,"feedback":"<one sentence feedback>"},{"id":2,"score":<0-10>,"feedback":"<one sentence feedback>"}]`;

    let scoredAnswers = questions.map((q: any, i: number) => ({
      id: q.id,
      question: q.question,
      expected_answer: q.expected_answer,
      candidate_answer: answers[i] || '',
      ai_score: 5,
      feedback: '',
    }));

    try {
      const response = await llm.invoke([{ role: 'user', content: scoringPrompt }]);
      const raw = (response.content as string).trim()
        .replace(/^```json\s*/m, '').replace(/^```\s*/m, '').replace(/```$/m, '').trim();
      const start = raw.indexOf('[');
      const end = raw.lastIndexOf(']');
      const scores = JSON.parse(raw.slice(start, end + 1));
      scoredAnswers = scoredAnswers.map((a, i) => ({
        ...a,
        ai_score: scores[i]?.score ?? 5,
        feedback: scores[i]?.feedback ?? '',
      }));
    } catch (e) {
      console.error('AI scoring error, using defaults:', e);
    }

    // Calculate overall pre-screen score (0-100)
    const totalScore = scoredAnswers.reduce((sum, a) => sum + (a.ai_score || 0), 0);
    const maxScore = scoredAnswers.length * 10;
    const preScreenScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

    const { error: updateError } = await supabase
      .from('questionnaires')
      .update({
        answers: scoredAnswers,
        pre_screen_score: preScreenScore,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('form_token', token);

    if (updateError) throw updateError;

    // Send Thank You Email to Candidate
    try {
      const candidateEmail = (qData.candidates as any)?.email;
      const candidateName = (qData.candidates as any)?.name || 'Candidate';
      
      if (candidateEmail && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: parseInt(process.env.EMAIL_PORT || '587'),
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const subject = `Thank you for completing the pre-screen for ${qData.job_title}`;
        const text = `Dear ${candidateName},\n\nThank you for taking the time to complete the pre-screen questionnaire for the ${qData.job_title} role.\n\nWe have successfully received your answers. Our hiring team will review your responses over the next 4-5 business days. If your profile is a strong fit for the role, we will be in touch to schedule the next steps.\n\nWe appreciate your interest in joining our team.\n\nBest regards,\nHireIQ Recruiting Team`;

        await transporter.sendMail({
          from: `"HireIQ Agent" <${process.env.EMAIL_USER}>`,
          to: candidateEmail,
          subject,
          text,
        });
      }
    } catch (emailError) {
      console.error('Failed to send thank you email:', emailError);
      // We don't throw here because the form was already successfully submitted
    }

    return NextResponse.json({ success: true, pre_screen_score: preScreenScore });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
