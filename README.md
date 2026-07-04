# HireIQ Agentic Applicant Tracking System

An advanced, AI powered recruitment platform and applicant tracking system built to automate candidate screening, personalized outreach, and technical pre screening.

## Overview

HireIQ acts as an autonomous recruitment assistant. Instead of recruiters manually reviewing resumes and sending generic emails, the agent processes applicant data, evaluates their fit using semantic matching, drafts personalized communication, and generates custom technical questionnaires for shortlisted candidates. All operations are managed through a centralized dashboard.

## Core Features

* Automated Candidate Screening: AI extracts skills, evaluates them against job descriptions, and calculates a match score.
* Semantic Skill Matching: Intelligently matches candidate skills to job requirements rather than relying on rigid keyword filters.
* Automated Outreach: Generates highly personalized outreach or rejection emails based on the candidate's specific background and screening results.
* Dynamic Pre Screening Questionnaires: Generates targeted technical, behavioral, and gap probing questions based on the candidate's unique profile and the job description.
* Public Candidate Forms: Provides secure, token based public web forms for candidates to submit their answers seamlessly.
* AI Answer Evaluation: Automatically grades candidate responses against expected technical answers and assigns a pre screen score.
* Pipeline Dashboard: A comprehensive interface to track candidates through Sourced, Pending, Shortlisted, Contacted, and Rejected states.
* Interview Summarization: Parses raw recruiter notes into structured strengths, weaknesses, and final hire recommendations.
* Hiring Analytics: Visualizes pipeline conversion metrics and compares initial CV scores against pre screen performance.

## Technology Stack

* Frontend: Next.js 16 (App Router), React, Tailwind CSS, Recharts
* Backend: Node.js, Next.js API Routes
* Database and Authentication: Supabase (PostgreSQL, Row Level Security)
* AI and Agent Orchestration: LangGraph, LangChain, Groq (Llama 3.1)
* Document Processing: Unpdf

## Setup Instructions

1. Clone the repository.
2. Install dependencies using npm install.
3. Set up a Supabase project and execute the required SQL schema for candidates, outreach_emails, interview_summaries, and questionnaires tables.
4. Configure the environment variables.

### Environment Variables Required

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
EMAIL_HOST=your_smtp_host
EMAIL_PORT=your_smtp_port
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_password
NEXT_PUBLIC_BASE_URL=your_production_url

5. Run the development server using npm run dev.
6. Access the application at localhost:3000.

## Architecture and Harness Design

The application follows a monolithic serverless architecture. The Next.js frontend communicates with Next.js API routes that act as the backend. The core agentic logic is encapsulated in a LangGraph workflow.

When a recruiter submits a candidate, the system initiates a sequential AI pipeline:
1. Parsing and Scoring: Extracts entities and performs semantic matching.
2. Candidate Storage: Saves the initial profile to Supabase.
3. Questionnaire Generation: If the candidate passes the threshold, the agent generates custom questions and a public submission token.
4. Email Drafting: The agent writes an outreach email, embedding the unique questionnaire link.

Public interactions (like form submissions) are handled via separate, secure API routes that enforce Supabase Row Level Security policies to ensure data integrity without requiring candidate authentication.

## License

Proprietary. All rights reserved.
