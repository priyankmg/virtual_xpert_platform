import { NextResponse } from 'next/server';
import { getPendingApprovals } from '@/services/governance-store';

export async function GET() {
  return NextResponse.json(getPendingApprovals());
}
