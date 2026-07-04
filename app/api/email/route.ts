import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { candidateId, to, subject, text } = await request.json();

    if (!to || !subject || !text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the logged in recruiter's email
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    const recruiterEmail = user?.email || process.env.EMAIL_USER;

    // Create a nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send the email
    const info = await transporter.sendMail({
      from: `"HireIQ Agent" <${process.env.EMAIL_USER}>`,
      replyTo: recruiterEmail,
      to,
      subject,
      text,
    });

    // Optionally update candidate status to "contacted" if candidateId is provided
    if (candidateId) {
      await supabase
        .from('candidates')
        .update({ status: 'contacted' })
        .eq('id', candidateId);
    }

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error('Email sending error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
