import { NextRequest, NextResponse } from 'next/server';
import { runSummarizerAgent } from '@/agents/summarizer-agent';

export async function POST(req: NextRequest) {
  try {
    const { snapshot, audienceType } = await req.json();
    if (!snapshot) return NextResponse.json({ error: 'snapshot required' }, { status: 400 });
    const result = await runSummarizerAgent(snapshot, audienceType ?? 'expert');
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
