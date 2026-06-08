import { NextResponse } from 'next/server';
import { generateWordConnectPuzzle } from '@/lib/server/arcade-puzzle-generator';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(generateWordConnectPuzzle());
}
