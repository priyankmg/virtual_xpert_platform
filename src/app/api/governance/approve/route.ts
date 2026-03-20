import { NextRequest, NextResponse } from 'next/server';
import { approveAction, rejectAction } from '@/services/governance-store';

export async function POST(req: NextRequest) {
  try {
    const { logId, action, expertId } = await req.json();
    if (!logId || !action) return NextResponse.json({ error: 'logId and action required' }, { status: 400 });
    const expert = expertId ?? 'EXPERT-DEFAULT';
    const entry = action === 'approve' ? approveAction(logId, expert) : rejectAction(logId, expert);
    if (!entry) return NextResponse.json({ error: 'Log entry not found' }, { status: 404 });
    return NextResponse.json(entry);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
