import { NextRequest, NextResponse } from 'next/server';
import { runFullPipeline } from '@/services/orchestrator';

export async function POST(req: NextRequest) {
  try {
    const { clientId } = await req.json();
    if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 });
    const result = await runFullPipeline(clientId);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
