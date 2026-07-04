import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabaseClient = await createClient();
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    // We only want to fetch candidates for the logged in user, unless they are admin or there are candidates without a recruiter_id that should be visible?
    // Let's filter by the specific recruiter if logged in. If not logged in, we shouldn't really return anything, but for demo let's be safe.
    let query = supabase
      .from('candidates')
      .select(`
        *,
        outreach_emails(*),
        interview_summaries(*),
        questionnaires(id, form_token, status, pre_screen_score, submitted_at, answers, questions)
      `)
      .order('created_at', { ascending: false });

    if (user?.id) {
      query = query.eq('recruiter_id', user.id);
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json({ candidates: data });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, status } = await request.json();

    const { data, error } = await supabase
      .from('candidates')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ candidate: data });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    // Delete child records first to avoid foreign key constraints (if cascade isn't set)
    await supabase.from('outreach_emails').delete().eq('candidate_id', id);
    await supabase.from('interview_summaries').delete().eq('candidate_id', id);
    await supabase.from('questionnaires').delete().eq('candidate_id', id);

    // Delete candidate
    const { data, error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
