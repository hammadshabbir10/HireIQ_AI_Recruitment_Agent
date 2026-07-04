import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

export async function GET() {
  const results: Record<string, { status: string; detail: string }> = {};

  // ── 1. Check Groq ────────────────────────────────────────────────────
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    await groq.models.list();
    results.groq = { status: '✅ OK', detail: 'API key is valid and Groq is reachable.' };
  } catch (err: any) {
    results.groq = {
      status: '❌ FAILED',
      detail: err?.message ?? String(err),
    };
  }

  // ── 2. Check Supabase ────────────────────────────────────────────────
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { error } = await supabase.from('candidates').select('id').limit(1);
    if (error) throw error;
    results.supabase = { status: '✅ OK', detail: 'Connected to Supabase and queried successfully.' };
  } catch (err: any) {
    results.supabase = {
      status: '❌ FAILED',
      detail: err?.message ?? String(err),
    };
  }

  // ── 3. Env key presence check ────────────────────────────────────────
  results.env = {
    status: process.env.GROQ_API_KEY ? '✅ Present' : '❌ Missing',
    detail: process.env.GROQ_API_KEY
      ? `GROQ_API_KEY starts with: ${process.env.GROQ_API_KEY.slice(0, 8)}...`
      : 'GROQ_API_KEY is not set in .env.local',
  };

  const allOk = Object.values(results).every((r) => r.status.startsWith('✅'));

  return NextResponse.json(
    { overall: allOk ? '✅ All systems OK' : '❌ Issues detected', results },
    { status: allOk ? 200 : 500 }
  );
}
