import { createHash, randomUUID } from 'node:crypto';
import { get, put } from '@vercel/blob';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = body.id;
    if (
      typeof id !== 'string' ||
      !/^offers\/\d{4}\/[a-f0-9]{24}\.json$/.test(id)
    ) {
      return Response.json({ error: 'Invalid experience.' }, { status: 400 });
    }
    const offer = await get(id, { access: 'private' });
    if (!offer)
      return Response.json({ error: 'Experience not found.' }, { status: 404 });

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
