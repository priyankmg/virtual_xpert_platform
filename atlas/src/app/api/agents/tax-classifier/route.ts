import { NextRequest, NextResponse } from 'next/server';
import { runTaxClassifierAgent } from '@/agents/tax-classifier-agent';

export async function POST(req: NextRequest) {
  try {
    const { snapshot } = await req.json();
    if (!snapshot) return NextResponse.json({ error: 'snapshot required' }, { status: 400 });
    const result = await runTaxClassifierAgent(snapshot);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
