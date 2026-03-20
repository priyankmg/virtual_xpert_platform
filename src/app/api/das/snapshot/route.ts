import { NextRequest, NextResponse } from 'next/server';
import { generateSnapshot, getCachedSnapshot } from '@/agents/das';

export async function POST(req: NextRequest) {
  try {
    const { clientId, snapshotDate } = await req.json();
    if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 });
    const snapshot = await generateSnapshot(clientId, snapshotDate);
    return NextResponse.json(snapshot);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get('clientId');
  if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 });
  const snapshot = getCachedSnapshot(clientId);
  if (!snapshot) return NextResponse.json({ error: 'No snapshot found. POST to generate one.' }, { status: 404 });
  return NextResponse.json(snapshot);
}
