import { NextRequest, NextResponse } from 'next/server';
import { runPolicyEvaluationAgent } from '@/agents/policy-evaluation-agent';

export async function POST(req: NextRequest) {
  try {
    const { snapshot } = await req.json();
    if (!snapshot) return NextResponse.json({ error: 'snapshot required' }, { status: 400 });
    const result = await runPolicyEvaluationAgent(snapshot);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
