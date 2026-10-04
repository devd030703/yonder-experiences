import { createHash, randomUUID } from 'node:crypto';
import { get, put } from '@vercel/blob';
import { withinRateLimit } from '@/lib/request-guard';

export const runtime = 'nodejs';
const OFFER_ID = /^offers\/\d{4}\/[a-f0-9]{24}\.json$/;

export async function POST(request: Request) {
  try {
    if (!(await withinRateLimit(request, 'report'))) {
      return Response.json(
        { error: 'Report limit reached. Try again later.' },
        { status: 429 }
      );
    }
    const body = await request.json();
    const id = body.id;
    if (typeof id !== 'string' || !OFFER_ID.test(id)) {
      return Response.json({ error: 'Invalid experience.' }, { status: 400 });
    }
    const offer = await get(id, { access: 'private' });
    if (offer?.statusCode !== 200) {
      return Response.json({ error: 'Experience not found.' }, { status: 404 });
    }

    const key = createHash('sha256').update(id).digest('hex').slice(0, 24);
    await put(
      `reports/${key}/${randomUUID()}.json`,
      JSON.stringify({ id, reportedAt: new Date().toISOString() }),
      {
        access: 'private',
        contentType: 'application/json',
      }
    );
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: 'Could not send this report.' },
      { status: 503 }
    );
  }
}
