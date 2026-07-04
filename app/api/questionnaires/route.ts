import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';

// GET all questionnaires for current recruiter's candidates
export async function GET() {
  try {
    const supabaseClient = await createClient();
    const { data: { user } } = await supabaseClient.auth.getUser();

    let candidateQuery = supabase.from('candidates').select('id');
    if (user?.id) {
      candidateQuery = candidateQuery.eq('recruiter_id', user.id);
    }
    const { data: candidates } = await candidateQuery;
    const candidateIds = (candidates || []).map((c: any) => c.id);

    if (candidateIds.length === 0) {
      return NextResponse.json({ questionnaires: [] });
    }

    const { data, error } = await supabase
      .from('questionnaires')
      .select(`*, candidates(name, email, score, status)`)
      .in('candidate_id', candidateIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ questionnaires: data || [] });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE a questionnaire
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    const { error } = await supabase.from('questionnaires').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
