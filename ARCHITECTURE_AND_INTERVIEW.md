# HireIQ: System Architecture & Technical Interview Guide

This document provides a comprehensive breakdown of the **HireIQ** architecture, the purpose of every major file and directory, and a technical Q&A section designed to help you explain and defend your technical choices during an interview.

---

## 🏗️ 1. Project Structure & File Purposes

HireIQ is built as a **Monolithic Full-Stack Application** using the **Next.js App Router**. This allows us to have our React frontend and our secure API backend residing in the exact same repository, streamlining development and deployment.

### `/app` Directory (Routing & Pages)
The core of Next.js 14+. Every folder inside `app/` that contains a `page.tsx` becomes a public or private route in the browser.

*   **`app/page.tsx`**: The main Landing Page. 
    *   *Purpose*: Drives conversion. Contains the Hero, Features, How it Works, and FAQ sections.
    *   *Importance*: First impression for the user. Highly optimized with server-side rendering (SSR) for SEO and fast loading, enhanced with client-side scroll animations.
*   **`app/dashboard/page.tsx`**: The core application interface for recruiters.
    *   *Purpose*: A highly interactive, state-heavy Single Page Application (SPA) feel within a Next.js route. It holds the Agent Chat, Pipeline Kanban, Pre-Screen Forms, and Analytics.
    *   *Importance*: Requires strict authentication. We use `supabase.auth.getSession()` to ensure only logged-in recruiters can access it.
*   **`app/login/page.tsx`**: The Authentication page.
    *   *Purpose*: Handles Email/Password sign-up and sign-in using Supabase Auth.
*   **`app/api/email/route.ts`**: Serverless Backend Endpoint.
    *   *Purpose*: Since we cannot send secure emails from the browser (it exposes API keys), this Next.js API route securely uses Nodemailer on the server side to dispatch personalized candidate outreach emails.
    *   *Importance*: Protects SMTP credentials and offloads heavy networking tasks from the client.

### `/components` Directory (Reusable UI)
Separating UI from page logic keeps the codebase modular and clean.

*   **`components/landing/*`** (HeroSection, FeaturesSection, etc.):
    *   *Purpose*: Breaking down the massive landing page into manageable, reusable chunks. 
*   **`components/dashboard/*`** (ChatPanel, PipelineTable, InputPanel):
    *   *Purpose*: Complex stateful components. The `ChatPanel` handles the streaming UI of the LangGraph agent, while `PipelineTable` interfaces directly with Supabase to update candidate statuses.
*   **`components/ui/*`** (shadcn/ui components):
    *   *Purpose*: Standardized, accessible, unstyled base components (Buttons, Inputs, Cards) powered by Tailwind CSS.

### `/lib/agent` Directory (The AI Brain)
This is where the magic happens. It houses the **LangGraph** multi-agent workflow.

*   **`lib/agent/state.ts`**: Defines the `AgentState` interface. 
    *   *Importance*: LangGraph is a state machine. This file dictates exactly what data (resume text, job description, skills array, email draft) is passed between AI nodes.
*   **`lib/agent/nodes.ts`**: The individual "workers". 
    *   *Purpose*: Contains specific functions like `extract_skills`, `score_candidate`, and `draft_email`. Each node uses Gemini to perform one specific, highly scoped task, preventing hallucination.
*   **`lib/agent/graph.ts`**: The orchestrator.
    *   *Purpose*: Wires the nodes together into a sequential pipeline. It dictates that extraction must happen *before* scoring, and scoring *before* emailing.

### `/lib/supabase` Directory (Database Connection)
*   **`lib/supabase/client.ts`**: 
    *   *Purpose*: Initializes the Supabase client using environment variables. 
    *   *Importance*: Ensures we maintain a singleton connection to our PostgreSQL database to prevent connection leaks.

---

## 🧠 2. Technical Interview Q&A

If an interviewer asks about your stack, here is exactly how you should answer.

### Q1: "Why did you choose Next.js instead of a standard Node.js/Express backend with a separate React frontend?"
**Your Answer:** 
"For a product like HireIQ, speed of iteration and architectural simplicity were my top priorities. If I used Node.js and Express, I would have had to manage two separate repositories, setup CORS policies, manage complex state synchronization between the frontend and backend, and handle two separate deployment pipelines. 

Next.js (with the App Router) gave me a unified monolith. I can write my React frontend, and instantly create secure serverless backend routes in the `app/api` folder. Furthermore, Next.js provides incredible out-of-the-box performance optimizations like Server-Side Rendering (SSR) for my landing page, which is crucial for SEO, while still letting me use complex Client-Side Rendering (`"use client"`) for my interactive dashboard."

### Q2: "Why use TypeScript instead of vanilla JavaScript?"
**Your Answer:**
"As HireIQ relies on complex data structures—especially when passing data between the LangGraph AI nodes and saving candidate profiles to Supabase—type safety is non-negotiable. 

TypeScript prevents entire classes of runtime errors. For example, my `AgentState` interface guarantees that by the time the AI finishes drafting an email, I know with 100% certainty that the `candidateScore` and `extractedSkills` fields exist and are formatted correctly. It makes the codebase self-documenting and drastically speeds up development because my IDE catches errors before I even compile."

### Q3: "How does your AI Agent actually work? Why not just use a single ChatGPT prompt?"
**Your Answer:**
"A single massive prompt is highly prone to hallucination, forgotten instructions, and unpredictable JSON outputs. I built a **multi-step agentic workflow using LangGraph**. 

Instead of asking the LLM to do everything at once, LangGraph acts as a state machine. 
1. The first node *only* extracts skills. 
2. It passes those skills to the second node, which *only* scores the candidate against the Job Description.
3. The third node takes the score and *only* drafts a personalized email.
4. The final node generates dynamic pre-screen questions based on the candidate's weaknesses.

This separation of concerns mirrors traditional software engineering. It makes the AI's reasoning transparent, debuggable, and highly accurate."

### Q4: "Why did you choose Supabase over MongoDB or a standard SQL database?"
**Your Answer:**
"I needed a robust relational database (PostgreSQL) because recruitment data is highly relational (Users have many Candidates, Candidates have many Skills). MongoDB (NoSQL) would have made structured queries difficult.

I chose Supabase specifically because it gives me raw PostgreSQL combined with built-in **Row Level Security (RLS)** and Authentication. I didn't have to build a custom JWT authentication system from scratch. With RLS, I can write policies directly in the database that guarantee Recruiter A can never query or mutate the candidate data belonging to Recruiter B. It's secure by default."

### Q5: "How does the Pre-Screening form work securely without the candidate needing an account?"
**Your Answer:**
"When a candidate is parsed, Supabase generates a unique UUID for their database row. I generate a public URL containing that unique ID (e.g., `/candidate/[id]`). 

Because I use Row Level Security on the database, I created a specific policy that allows *anonymous inserts* strictly to the `candidate_answers` table, provided the `candidate_id` matches. This creates a frictionless experience for the candidate—they just click a link and type—while remaining entirely secure for the recruiter."

### Q6: "How did you handle the UI responsiveness and animations?"
**Your Answer:**
"I used **Tailwind CSS** for rapid, utility-first styling, ensuring the dashboard is a `flex` container that elegantly shifts from a `flex-row` sidebar layout on desktop to a `flex-col` app-like navigation bar on mobile screens (< 480px). For animations on the landing page, I wrote a custom React Hook (`useScrollReveal`) utilizing the native browser `IntersectionObserver` API. This is far more performant than importing a heavy third-party animation library like Framer Motion, as it natively triggers CSS transitions only when elements enter the viewport."
