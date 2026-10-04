import { listCommunityExperiences } from '@/lib/community-store';
import { parseScreenshot } from '@/lib/parse-screenshot';
import { withinRateLimit } from '@/lib/request-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const EXPECTED_ERROR = /Could not|expired|numbers on this screenshot/i;

async function scanScreenshot(request: Request) {
  const form = await request.formData();
  const image = form.get('screenshot');
  if (
    !(image instanceof File) ||
    image.size === 0 ||
    image.size > 4 * 1024 * 1024 ||
    !['image/jpeg', 'image/png', 'image/webp'].includes(image.type)
  ) {
    throw new Error(
      'Could not use this image. Choose a JPG, PNG or WebP screenshot smaller than 4 MB.'
    );
  }
  const bytes = Buffer.from(await image.arrayBuffer());
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const webp =
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP';
  if (!(jpeg || png || webp)) {
    throw new Error('Could not use this file. It is not a supported image.');
  }
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng', 1, { cachePath: '/tmp' });
  try {
    return parseScreenshot((await worker.recognize(bytes)).data.text);
  } finally {
    await worker.terminate();
  }
}

export async function GET() {
  try {
    const experiences = await listCommunityExperiences();
    return Response.json(
      { experiences },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return Response.json(
      { error: 'Experiences are temporarily unavailable.' },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const length = Number(request.headers.get('content-length') || 0);
    if (length > 4 * 1024 * 1024) {
      return Response.json(
        { error: 'Choose a screenshot smaller than 4 MB.' },
        { status: 413 }
      );
    }
    if (!(await withinRateLimit(request, 'upload'))) {
      return Response.json(
        { error: 'Upload limit reached. Try again in an hour.' },
        { status: 429 }
      );
    }
    const offer = await scanScreenshot(request);
    const { saveCommunityExperience } = await import('@/lib/community-store');
    const result = await saveCommunityExperience(offer);
    return Response.json(result, { status: result.duplicate ? 200 : 201 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Could not process this screenshot.';
    const expected = EXPECTED_ERROR.test(message);
    return Response.json(
      { error: expected ? message : 'Could not save this experience.' },
      { status: expected ? 422 : 503 }
    );
  }
}
