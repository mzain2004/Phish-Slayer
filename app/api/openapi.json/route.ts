import { NextResponse } from 'next/server';
import { openApiSpec } from '@/lib/api/openapi';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(openApiSpec);
}
