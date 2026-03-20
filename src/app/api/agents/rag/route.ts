import { NextRequest, NextResponse } from 'next/server';
import { runRAGAgent } from '@/agents/rag-agent';

export async function POST(req: NextRequest) {
  try {
    const { query, clientId } = await req.json();
    if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 });
    const result = await runRAGAgent(query, clientId ?? 'CLIENT-001');
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
