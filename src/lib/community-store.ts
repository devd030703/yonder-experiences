import { createHash } from 'node:crypto';
import { get, list, put } from '@vercel/blob';
import type { CommunityExperience, ParsedScreenshot } from './parse-screenshot';

function requireStorage() {
  if (!(process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_OIDC_TOKEN)) {
    throw new Error('Community storage is not configured.');
  }
}

function offerPath(offer: ParsedScreenshot) {
  const fingerprint = createHash('sha256')
    .update(
      `${offer.name.toLocaleLowerCase()}|${offer.expiresAt}|${offer.redeemValues[0].points}|${offer.redeemValues[0].value}`
    )
    .digest('hex')
    .slice(0, 24);
  return `offers/${offer.expiresAt.slice(0, 4)}/${fingerprint}.json`;
}

async function readOffer(path: string): Promise<CommunityExperience | null> {
  const result = await get(path, { access: 'private', useCache: false });
  if (result?.statusCode !== 200 || !result.stream) return null;
  return JSON.parse(
    await new Response(result.stream).text()
  ) as CommunityExperience;
}

export async function saveCommunityExperience(offer: ParsedScreenshot) {
  requireStorage();
  const path = offerPath(offer);
  const existing = await readOffer(path);
  if (existing) return { offer: existing, duplicate: true };

  const entry: CommunityExperience = {
    ...offer,
    id: path,
    link: '',
    submittedAt: new Date().toISOString(),
    source: 'community',
  };
  await put(path, JSON.stringify(entry), {
    access: 'private',
    contentType: 'application/json',
    allowOverwrite: false,
  });
  return { offer: entry, duplicate: false };
}

export async function listCommunityExperiences() {
  requireStorage();
  const paths: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: 'offers/', limit: 1000, cursor });
    paths.push(...page.blobs.map((blob) => blob.pathname));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  const offers = (await Promise.all(paths.map(readOffer))).filter(
    (offer): offer is CommunityExperience => offer !== null
  );
  const latestByName = new Map<string, CommunityExperience>();
  for (const offer of offers) {
    const key = offer.name.toLocaleLowerCase();
    const previous = latestByName.get(key);
    if (!previous || offer.submittedAt > previous.submittedAt)
      latestByName.set(key, offer);
  }
  return [...latestByName.values()].sort((a, b) =>
    b.submittedAt.localeCompare(a.submittedAt)
  );
}
