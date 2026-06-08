import { NextResponse } from 'next/server';
import { validatePlayableWord } from '@/lib/server/word-validator';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const word = String(body?.word || '');
  const result = validatePlayableWord(word);
  return NextResponse.json(result);
}
