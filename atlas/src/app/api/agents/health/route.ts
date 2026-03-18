import { NextRequest, NextResponse } from 'next/server';
import { runHealthCheck } from '@/agents/api-healing-agent';

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('clientId') ?? 'CLIENT-001';
  try {
    const report = await runHealthCheck(clientId);
    return NextResponse.json(report);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { clientId = 'CLIENT-001' } = await req.json();
    const report = await runHealthCheck(clientId);
    return NextResponse.json(report);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
