import { NextRequest, NextResponse } from 'next/server';
import { extractText } from 'unpdf';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Strict .pdf validation — only .pdf extension + correct MIME type accepted
    if (!file.name.toLowerCase().endsWith('.pdf') || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only .pdf files are accepted.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // unpdf — built for serverless/Next.js, no worker setup needed
    const { text } = await extractText(buffer, { mergePages: true });

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Could not extract text from this PDF. It may be a scanned/image-only PDF.' }, { status: 422 });
    }

    return NextResponse.json({ text: text.trim() });
  } catch (error: any) {
    console.error('PDF parsing error:', error);
    return NextResponse.json({ error: 'Failed to parse PDF: ' + error.message }, { status: 500 });
  }
}
