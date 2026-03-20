import { NextResponse } from 'next/server';
import { todaySessions } from '@/data/mock/expert-sessions';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = todaySessions.find(s => s.sessionId === id || s.clientId === id);

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  return NextResponse.json({ session });
}
