import { NextResponse } from 'next/server';
import { todaySessions, expertProfile, sessionStats } from '@/data/mock/expert-sessions';

export async function GET() {
  return NextResponse.json({
    expert: expertProfile,
    sessions: todaySessions,
    stats: sessionStats,
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
  });
}
