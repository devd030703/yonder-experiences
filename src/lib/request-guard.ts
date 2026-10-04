import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { list, put } from '@vercel/blob';

export function isAdmin(request: Request) {
  const password = process.env.ADMIN_PASSWORD;
  const header = request.headers.get('authorization');
  if (!(password && header?.startsWith('Basic '))) {
    return false;
  }
  try {
    const supplied = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const separator = supplied.indexOf(':');
    if (separator < 0 || supplied.slice(0, separator) !== 'owner') {
      return false;
    }
    const actual = Buffer.from(supplied.slice(separator + 1));
    const expected = Buffer.from(password);
    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  } catch {
    return false;
  }
}

export function adminChallenge() {
  return new Response('Owner sign-in required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Yonder owner"',
      'Cache-Control': 'no-store',
    },
  });
}

// Shared Blob-backed limit works across Vercel instances. The key never contains a raw IP.
export async function withinRateLimit(
  request: Request,
  action: 'upload' | 'report'
) {
  const secret = process.env.BLOB_READ_WRITE_TOKEN;
  if (!secret) {
    throw new Error('Rate limit storage is not configured.');
  }
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const bucket = Math.floor(Date.now() / 3_600_000);
  const key = createHmac('sha256', secret)
    .update(`${action}:${ip}`)
    .digest('hex')
    .slice(0, 24);
  const prefix = `limits/${action}/${bucket}/${key}/`;
  const existing = await list({ prefix, limit: action === 'upload' ? 9 : 21 });
  if (existing.blobs.length >= (action === 'upload' ? 8 : 20)) {
    return false;
  }
  await put(`${prefix}${randomUUID()}.txt`, '1', {
    access: 'private',
    contentType: 'text/plain',
  });
  return true;
}
