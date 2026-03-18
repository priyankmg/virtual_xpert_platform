import { NextRequest, NextResponse } from 'next/server';
import { classifyAction } from '@/agents/governance-agent';

export async function POST(req: NextRequest) {
  try {
    const { agentName, outputDescription } = await req.json();
    if (!agentName) return NextResponse.json({ error: 'agentName required' }, { status: 400 });
    const result = classifyAction(agentName, outputDescription ?? '');
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
