import { NextResponse } from 'next/server';
import { getAuditLog } from '@/services/governance-store';

export async function GET() {
  return NextResponse.json(getAuditLog());
}
