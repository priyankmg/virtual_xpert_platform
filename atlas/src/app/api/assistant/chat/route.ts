import { NextRequest, NextResponse } from 'next/server';
import { chat } from '@/agents/intuit-assistant';

export async function POST(req: NextRequest) {
  try {
    const { messages, clientId } = await req.json();
    if (!messages || !clientId) return NextResponse.json({ error: 'messages and clientId required' }, { status: 400 });
    const reply = await chat(messages, clientId);
    return NextResponse.json({ reply, timestamp: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
