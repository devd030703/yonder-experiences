'use client';

import { useCallback, useEffect, useState } from 'react';
import type { CommunityExperience } from '@/lib/parse-screenshot';

type Entry = {
  offer: CommunityExperience;
  moderation: { hidden: boolean };
  reportCount: number;
};
function inputType(name: string) {
  if (name === 'expiresAt') {
    return 'date';
  }
  if (['points', 'value', 'earnPointsPerPound'].includes(name)) {
    return 'number';
  }
  return 'text';
}

export function OwnerReview() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState('');
  const load = useCallback(async () => {
    const response = await fetch('/api/admin/entries', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('Could not load reports.');
    }
    setEntries((await response.json()).entries);
  }, []);
  useEffect(() => {
    load().catch((cause) => setError(cause.message));
  }, [load]);
  async function review(id: string, action: string, corrections?: object) {
    setSaving(id);
    setError('');
    try {
      const response = await fetch('/api/admin/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, corrections }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not save review.');
      }
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Could not save review.'
      );
    } finally {
      setSaving('');
    }
  }
  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <a className="text-sm underline" href="/">
        ← Back to experiences
      </a>
      <h1 className="mt-5 font-bold text-3xl">Owner review</h1>
      <p className="mt-2 text-muted-foreground text-sm">
        Reported entries appear first. Hide, dismiss or correct them here.
      </p>
      {error && (
        <p className="my-4 text-red-700" role="alert">
          {error}
        </p>
      )}
      <div className="mt-6 grid gap-4">
        {entries.map(({ offer, moderation, reportCount }) => (
          <article className="rounded-xl border bg-white p-4" key={offer.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold text-xl">{offer.name}</h2>
              <p className="text-sm">
                {reportCount} open reports ·{' '}
                {moderation.hidden ? 'Hidden' : 'Live'}
              </p>
            </div>
            <p className="mt-1 text-sm">{offer.description}</p>
            <p className="mt-2 text-sm">
              £{offer.redeemValues[0].value} for{' '}
              {offer.redeemValues[0].points.toLocaleString()} points · expires{' '}
              {offer.expiresAt}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="rounded-lg border px-3 py-2 text-sm"
                disabled={saving === offer.id}
                onClick={() =>
                  review(offer.id, moderation.hidden ? 'restore' : 'hide')
                }
                type="button"
              >
                {moderation.hidden ? 'Restore' : 'Hide'}
              </button>
              <button
                className="rounded-lg border px-3 py-2 text-sm"
                disabled={saving === offer.id}
                onClick={() => review(offer.id, 'dismiss')}
                type="button"
              >
                Dismiss reports
              </button>
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm underline">
                Correct details
              </summary>
              <form
                className="mt-3 grid gap-3 sm:grid-cols-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const data = new FormData(event.currentTarget);
                  review(
                    offer.id,
                    'correct',
                    Object.fromEntries(data.entries())
                  );
                }}
              >
                {(
                  [
                    ['name', offer.name],
                    ['description', offer.description],
                    ['points', String(offer.redeemValues[0].points)],
                    ['value', String(offer.redeemValues[0].value)],
                    ['earnPointsPerPound', String(offer.earnPointsPerPound)],
                    ['expiresAt', offer.expiresAt],
                  ] as const
                ).map(([name, value]) => (
                  <label className="grid gap-1 text-sm" key={name}>
                    {name}
                    <input
                      className="rounded-lg border p-2"
                      defaultValue={value}
                      name={name}
                      required
                      step={name === 'value' ? '0.01' : undefined}
                      type={inputType(name)}
                    />
                  </label>
                ))}
                <label className="grid gap-1 text-sm">
                  category
                  <select
                    className="rounded-lg border p-2"
                    defaultValue={offer.category}
                    name="category"
                  >
                    <option>Dining</option>
                    <option>Shopping</option>
                    <option>Other</option>
                  </select>
                </label>
                <button
                  className="rounded-lg bg-[#22332e] px-4 py-2 text-white sm:col-span-2"
                  disabled={saving === offer.id}
                  type="submit"
                >
                  Save correction
                </button>
              </form>
            </details>
          </article>
        ))}
      </div>
    </main>
  );
}
