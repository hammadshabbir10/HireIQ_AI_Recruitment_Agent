export interface Candidate {
  id: string;
  job_id: string;
  name: string | null;
  email: string | null;
  raw_cv: string;
  parsed_summary: string | null;
  score: number;
  score_reasoning: string | null;
  status: 'pending' | 'shortlisted' | 'rejected' | 'contacted';
  created_at: string;
  outreach_emails?: OutreachEmail[];
  interview_summaries?: InterviewSummary[];
  questionnaires?: Questionnaire[];
}

export interface Questionnaire {
  id: string;
  candidate_id: string;
  job_title: string;
  questions: any[];
  answers: any[] | null;
  pre_screen_score: number | null;
  form_token: string;
  status: 'pending' | 'submitted';
  submitted_at: string | null;
  created_at: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  created_at: string;
}

export interface OutreachEmail {
  id: string;
  candidate_id: string;
  subject_line: string | null;
  email_body: string;
  created_at: string;
}

export interface InterviewSummary {
  id: string;
  candidate_id: string;
  raw_notes: string;
  summary: string | null;
  strengths: string | null;
  weaknesses: string | null;
  recommendation: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AgentState {
  messages: Message[];
  currentJobId: string | null;
  currentCandidateId: string | null;
  lastAction: string | null;
}
