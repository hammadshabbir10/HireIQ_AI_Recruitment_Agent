import { NextRequest } from 'next/server';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { runAgentStreamed } from '@/lib/agent/graph';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), { status: 400 });
    }

    // Get logged in recruiter
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const recruiterId = user?.id || null;
    const recruiterName = user?.user_metadata?.full_name || 'Recruiter';

    const langchainHistory = (history || []).map((msg: { role: string; content: string }) => {
      if (msg.role === 'user') return new HumanMessage(msg.content);
      return new AIMessage(msg.content);
    });

    // Return a Server-Sent Events stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const emit = (data: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        try {
          await runAgentStreamed(message, langchainHistory, emit, recruiterId, recruiterName);
        } catch (error: any) {
          console.error('Chat API error:', error);
          if (String(error).includes('429')) {
            emit({ type: 'error', message: 'Rate limit reached. Please wait a moment and try again.' });
          } else {
            emit({ type: 'error', message: error?.message || 'Something went wrong. Please try again.' });
          }
        } finally {
          emit({ type: 'done' });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API parse error:', error);
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
  }
}
