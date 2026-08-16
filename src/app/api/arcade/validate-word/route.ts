import { validatePlayableWord } from '@/lib/server/word-validator';
import { assertSameOrigin, asApiError, enforceRateLimit, jsonError, jsonOk, parseJson } from '@/lib/server/api';
import { validateWordSchema } from '@/lib/server/request-schemas';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    enforceRateLimit(request, 'word-validation', 120, 60_000);
    const { word } = await parseJson(request, validateWordSchema);
    return jsonOk(validatePlayableWord(word), request);
  } catch (error) {
    return jsonError(asApiError(error, 'Could not validate that word.'), request);
  }
}
