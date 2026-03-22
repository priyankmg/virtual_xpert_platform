import { NextRequest, NextResponse } from 'next/server';
import { chat, ChatMessage } from '@/agents/expert-assistant';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Accept both { message: string } (from live/prep pages) and { messages: ChatMessage[] }
    let messages: ChatMessage[];
    const clientId: string = body.clientId ?? 'CLIENT-001';

    if (typeof body.message === 'string') {
      messages = [{ role: 'user', content: body.message }];
    } else if (Array.isArray(body.messages)) {
      messages = body.messages;
    } else {
      return NextResponse.json({ error: 'message or messages required' }, { status: 400 });
    }

    const { response, agentRouted, requiresExpertReview } = await chat(messages, clientId);

    return NextResponse.json({
      response,
      agentRouted,
      requiresExpertReview,
      timestamp: new Date().toISOString(),
      // legacy field kept for backwards compat
      reply: response,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
