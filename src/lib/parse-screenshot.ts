import type { Experience } from './experiences';

export type CommunityExperience = Experience & {
  id: string;
  expiresAt: string;
  submittedAt: string;
  source: 'community';
  earnPointsPerPound: number;
};

export type ParsedScreenshot = Pick<
  CommunityExperience,
  | 'name'
  | 'description'
  | 'category'
  | 'earnMultiplier'
  | 'earnPointsPerPound'
  | 'redeemValues'
  | 'expiresAt'
>;

const MONTHS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
];

export function londonDate(date: Date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function numberWithCommas(value: string) {
  return Number(value.replaceAll(',', ''));
}

export function parseScreenshot(
  text: string,
  uploadedAt = new Date()
): ParsedScreenshot {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const smartPickIndex = lines.findIndex((line) => /smart\s+pick/i.test(line));
  if (smartPickIndex < 2) {
    throw new Error(
      'Could not identify the Yonder experience on this screenshot.'
    );
  }

  // The balance is a reliable boundary between the app header and the offer.
  // It is used only in memory and is never saved with the listing.
  const balanceIndex = lines.findIndex(
    (line, index) => index < smartPickIndex && /\b\d{1,3},\d{3}\b/.test(line)
  );
  const nameIndex = balanceIndex >= 0 ? balanceIndex + 1 : 0;
  const name = lines[nameIndex]?.replace(/[^\p{L}\p{N}&.' -]/gu, '').trim();
  const description = lines
    .slice(nameIndex + 1, smartPickIndex)
    .join(' ')
    .trim();
  if (
    !name ||
    name.length < 2 ||
    name.length > 100 ||
    !description ||
    description.length > 240
  ) {
    throw new Error(
      'Could not read the experience name and description clearly.'
    );
  }

  const expiry = text.match(/Available\s+until\s+(\d{1,2})\s+([A-Za-z]{3,9})/i);
  const monthIndex = expiry
    ? MONTHS.indexOf(expiry[2].slice(0, 3).toLowerCase())
    : -1;
  const year = Number(londonDate(uploadedAt).slice(0, 4));
  const day = expiry ? Number(expiry[1]) : 0;
  const expiryDate = new Date(Date.UTC(year, monthIndex, day));
  if (
    monthIndex < 0 ||
    day < 1 ||
    expiryDate.getUTCMonth() !== monthIndex ||
    expiryDate.getUTCDate() !== day
  ) {
    throw new Error('Could not verify the offer expiry date.');
  }
  const expiresAt = expiryDate.toISOString().slice(0, 10);
  if (expiresAt < londonDate(uploadedAt)) {
    throw new Error('This offer appears to have expired.');
  }

  const earn = text.match(/(\d{1,3})\s*pts?\s*\/\s*£\s*1/i);
  const usual = text.match(/Usually\s*(\d{1,3})\s*pts?/i);
  const points = text.match(/REDEEM[\s\S]{0,100}?(\d{1,3}(?:,\d{3})+)\b/i);
  const value = text.match(/SPEND[\s\S]{0,100}?£\s*(\d+(?:\.\d+)?)\s+here\b/i);
  const earned = text.match(/£\s*\d+(?:\.\d+)?\s+here\s+([\d,]+)\s*pts?/i);
  if (!(earn && points && value && earned)) {
    throw new Error(
      'Could not verify the earn and redeem amounts from this screenshot.'
    );
  }

  const earnPointsPerPound = Number(earn[1]);
  const redeemPoints = numberWithCommas(points[1]);
  const redeemValue = Number(value[1]);
  const earnedPoints = numberWithCommas(earned[1]);
  const poundsPerThousand = (redeemValue / redeemPoints) * 1000;
  if (
    !Number.isSafeInteger(redeemPoints) ||
    redeemPoints < 100 ||
    redeemPoints > 1_000_000 ||
    redeemValue <= 0 ||
    redeemValue > 5000 ||
    earnPointsPerPound < 1 ||
    earnPointsPerPound > 100 ||
    Math.abs(redeemValue * earnPointsPerPound - earnedPoints) > 1 ||
    poundsPerThousand < 0.5 ||
    poundsPerThousand > 25
  ) {
    throw new Error(
      'The numbers on this screenshot do not pass the value checks.'
    );
  }

  const usualPoints = usual ? Number(usual[1]) : 0;
  const multiplier = usualPoints > 0 ? earnPointsPerPound / usualPoints : 0;
  const category = /make a booking|book a table/i.test(text)
    ? 'Dining'
    : /shop now|shop online/i.test(text)
      ? 'Shopping'
      : 'Other';

  return {
    name,
    description,
    category,
    earnMultiplier:
      Number.isInteger(multiplier) && multiplier > 0 ? `${multiplier}x` : '',
    earnPointsPerPound,
    redeemValues: [{ points: redeemPoints, value: redeemValue }],
    expiresAt,
  };
}
