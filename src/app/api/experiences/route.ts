import { listCommunityExperiences } from '@/lib/community-store';
import { parseScreenshot } from '@/lib/parse-screenshot';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
    const body = await request.json();
    if (typeof body.text !== 'string' || body.text.length > 20_000) {
      return Response.json(
        { error: 'Invalid screenshot scan.' },
        { status: 400 }
      );
    }
    const offer = parseScreenshot(body.text);
    const { saveCommunityExperience } = await import('@/lib/community-store');
    const result = await saveCommunityExperience(offer);
    return Response.json(result, { status: result.duplicate ? 200 : 201 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Could not process this screenshot.';
    const expected = /Could not|expired|numbers on this screenshot/i.test(
      message
    );
    return Response.json(
      { error: expected ? message : 'Could not save this experience.' },
      { status: expected ? 422 : 503 }
    );
  }
}
