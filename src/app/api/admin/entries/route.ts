import {
  listAllPaths,
  type Moderation,
  readModeration,
  readOffer,
  writeModeration,
} from '@/lib/community-store';
import { adminChallenge, isAdmin } from '@/lib/request-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const OFFER_ID = /^offers\/\d{4}\/[a-f0-9]{24}\.json$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const validId = (id: unknown): id is string =>
  typeof id === 'string' && OFFER_ID.test(id);

export async function GET(request: Request) {
  if (!isAdmin(request)) {
    return adminChallenge();
  }
  try {
    const [offerPaths, reportPaths] = await Promise.all([
      listAllPaths('offers/'),
      listAllPaths('reports/'),
    ]);
    const reports = (
      await Promise.all(
        reportPaths.map(async (path) => {
          const result = await import('@vercel/blob').then(({ get }) =>
            get(path, { access: 'private', useCache: false })
          );
          if (result?.statusCode !== 200 || !result.stream) {
            return null;
          }
          return JSON.parse(await new Response(result.stream).text()) as {
            id: string;
            reportedAt: string;
          };
        })
      )
    ).filter(
      (item): item is { id: string; reportedAt: string } =>
        !!item && validId(item.id)
    );
    const entries = (
      await Promise.all(
        offerPaths.map(async (id) => {
          const offer = await readOffer(id);
          if (!offer) {
            return null;
          }
          const moderation = await readModeration(id);
          return {
            offer: { ...offer, ...moderation.corrections },
            moderation,
            reportCount: reports.filter(
              (report) =>
                report.id === id &&
                (!moderation.reviewedAt ||
                  report.reportedAt > moderation.reviewedAt)
            ).length,
          };
        })
      )
    ).filter((entry) => entry !== null);
    return Response.json(
      {
        entries: entries.sort(
          (a, b) =>
            b.reportCount - a.reportCount ||
            b.offer.submittedAt.localeCompare(a.offer.submittedAt)
        ),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch {
    return Response.json(
      { error: 'Could not load owner review.' },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  if (!isAdmin(request)) {
    return adminChallenge();
  }
  try {
    const body = await request.json();
    if (
      !(
        validId(body.id) &&
        ['hide', 'restore', 'dismiss', 'correct'].includes(body.action)
      )
    ) {
      return Response.json(
        { error: 'Invalid review action.' },
        { status: 400 }
      );
    }
    const offer = await readOffer(body.id);
    if (!offer) {
      return Response.json({ error: 'Experience not found.' }, { status: 404 });
    }
    const current = await readModeration(body.id);
    const next: Moderation = {
      ...current,
      reviewedAt: new Date().toISOString(),
    };
    if (body.action === 'hide') {
      next.hidden = true;
    }
    if (body.action === 'restore') {
      next.hidden = false;
    }
    if (body.action === 'correct') {
      const value = body.corrections;
      const points = Number(value?.points);
      const pounds = Number(value?.value);
      const earn = Number(value?.earnPointsPerPound);
      if (
        typeof value?.name !== 'string' ||
        value.name.trim().length < 2 ||
        value.name.length > 100 ||
        typeof value?.description !== 'string' ||
        value.description.length > 240 ||
        !['Dining', 'Shopping', 'Other'].includes(value.category) ||
        !Number.isSafeInteger(points) ||
        points < 100 ||
        points > 1_000_000 ||
        !Number.isFinite(pounds) ||
        pounds <= 0 ||
        pounds > 5000 ||
        !Number.isInteger(earn) ||
        earn < 1 ||
        earn > 100 ||
        typeof value?.expiresAt !== 'string' ||
        !ISO_DATE.test(value.expiresAt)
      ) {
        return Response.json(
          { error: 'Check the correction fields.' },
          { status: 400 }
        );
      }
      next.corrections = {
        name: value.name.trim(),
        description: value.description.trim(),
        category: value.category,
        earnPointsPerPound: earn,
        redeemValues: [{ points, value: pounds }],
        expiresAt: value.expiresAt,
      };
      next.hidden = false;
    }
    await writeModeration(body.id, next);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Could not save review.' }, { status: 503 });
  }
}
