import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ jobs: data });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, description, requirements } = await request.json();

    const { data, error } = await supabase
      .from('jobs')
      .insert({ title, description, requirements })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ job: data });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
