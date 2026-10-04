'use client';

import { useMemo, useState } from 'react';
import { ExperienceCard } from '@/components/experience-card';
import { ScreenshotUpload } from '@/components/screenshot-upload';
import { useExperiences } from '@/hooks/use-experiences';
import { calculateValue } from '@/lib/utils';

type Sort = 'value' | 'expiry' | 'name';
export default function HomePage() {
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('value');
  const { experiences, loading, error, refresh } = useExperiences(null);
  const visible = useMemo(
    () =>
      experiences
        .filter(
          (offer) =>
            (category === 'All' || offer.category === category) &&
            `${offer.name} ${offer.description}`
              .toLocaleLowerCase()
              .includes(query.trim().toLocaleLowerCase())
        )
        .sort((a, b) => {
          if (sort === 'expiry') {
            return a.expiresAt.localeCompare(b.expiresAt);
          }
          if (sort === 'name') {
            return a.name.localeCompare(b.name);
          }
          return calculateValue(b) - calculateValue(a);
        }),
    [experiences, category, query, sort]
  );
  const best = experiences[0];

  return (
    <div className="min-h-screen bg-[#f9f5ed] text-[#22332e]">
      <main className="mx-auto max-w-5xl px-4 pt-5 pb-14 sm:px-8 sm:pt-8">
        <header className="flex items-start justify-between gap-3 border-[#d9cbb7] border-b pb-4">
          <div>
            <p className="font-bold text-[#a65b3b] text-xs uppercase tracking-[0.22em]">
              Independent rewards guide
            </p>
            <h1 className="mt-1 font-extrabold text-2xl tracking-tight sm:text-4xl">
              Yonder Experiences
            </h1>
            <p className="mt-1 text-[#625a50] text-sm">
              Find more value in your points.
            </p>
          </div>
          <a
            className="shrink-0 rounded-full bg-[#22332e] px-3 py-2 font-bold text-white text-xs sm:px-5 sm:text-sm"
            href="#contribute"
          >
            + Add an offer
          </a>
        </header>

        <section aria-labelledby="best-heading" className="mt-5">
          <div className="mb-3 flex items-end justify-between gap-2">
            <div>
              <p className="font-bold text-[#aa572f] text-xs uppercase tracking-[0.18em]">
                Current picks
              </p>
              <h2 className="mt-1 font-bold text-2xl" id="best-heading">
                Best value right now
              </h2>
            </div>
            <span className="text-[#675d52] text-xs">£ per 1,000 points</span>
          </div>
          {loading && (
            <output className="block rounded-2xl border bg-white p-6">
              Loading current offers…
            </output>
          )}
          {error && (
            <p
              className="rounded-2xl border bg-white p-6 text-red-700"
              role="alert"
            >
              {error}{' '}
              <button className="underline" onClick={refresh} type="button">
                Retry
              </button>
            </p>
          )}
          {!(loading || error) &&
            (best ? (
              <ExperienceCard experience={best} featured />
            ) : (
              <p className="rounded-2xl border bg-white p-6">
                No current offers yet. Add the first screenshot below.
              </p>
            ))}
        </section>

        <section aria-labelledby="browse-heading" className="mt-7">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="font-bold text-[#aa572f] text-xs uppercase tracking-[0.18em]">
                Explore
              </p>
              <h2 className="mt-1 font-bold text-2xl" id="browse-heading">
                All current offers
              </h2>
            </div>
            <span className="text-[#675d52] text-sm">
              {visible.length} offers
            </span>
          </div>
          <div className="grid gap-3 rounded-2xl border border-[#ded7c9] bg-white p-3 sm:grid-cols-[1fr_auto] sm:p-4">
            <label className="sr-only" htmlFor="offer-search">
              Search experiences
            </label>
            <input
              className="w-full rounded-xl border border-[#d9cbb7] bg-[#fffdf8] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#aa572f]"
              id="offer-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search experiences"
              type="search"
              value={query}
            />
            <label className="flex items-center gap-2 text-sm">
              Sort by{' '}
              <select
                className="rounded-xl border border-[#d9cbb7] bg-[#fffdf8] px-3 py-3"
                onChange={(event) => setSort(event.target.value as Sort)}
                value={sort}
              >
                <option value="value">Best value</option>
                <option value="expiry">Ending soon</option>
                <option value="name">Name A–Z</option>
              </select>
            </label>
            <fieldset className="flex flex-wrap gap-2 sm:col-span-2">
              <legend className="sr-only">Offer category</legend>
              {['All', 'Dining', 'Shopping', 'Other'].map((item) => (
                <button
                  aria-pressed={category === item}
                  className={`rounded-full px-3 py-2 text-sm ${category === item ? 'bg-[#22332e] text-white' : 'bg-[#eee7da] text-[#22332e] hover:bg-[#e5d9c5]'}`}
                  key={item}
                  onClick={() => setCategory(item)}
                  type="button"
                >
                  {item}
                </button>
              ))}
            </fieldset>
          </div>
          {!(loading || error) && visible.length === 0 && (
            <p className="mt-4 rounded-2xl border bg-white p-6">
              No offers match. Try another search or category.
            </p>
          )}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {visible.map((experience) => (
              <ExperienceCard experience={experience} key={experience.id} />
            ))}
          </div>
        </section>

        <div className="mt-8">
          <ScreenshotUpload onPublished={refresh} />
        </div>
        <p className="mt-5 text-[#675d52] text-xs leading-relaxed">
          Community offers can change. Check the Yonder app before booking. This
          independent site is not affiliated with Yonder.
        </p>
      </main>
      <footer className="border-[#d9cbb7] border-t bg-[#f0e8d9] px-4 py-5 text-center text-[#675d52] text-xs">
        Based on the original{' '}
        <a
          className="underline"
          href="https://github.com/danbillson/yonder-experiences"
          rel="noopener noreferrer"
          target="_blank"
        >
          Yonder Experiences project by Dan Billson
        </a>
        .
      </footer>
    </div>
  );
}
