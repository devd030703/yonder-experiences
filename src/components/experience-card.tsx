'use client';

import { useState } from 'react';
import type { CommunityExperience } from '@/lib/parse-screenshot';
import { calculateValue } from '@/lib/utils';

export function ExperienceCard({
  experience,
  featured = false,
}: {
  experience: CommunityExperience;
  featured?: boolean;
}) {
  const [reportStatus, setReportStatus] = useState<
    'idle' | 'sending' | 'done' | 'error'
  >('idle');
  const redemption = experience.redeemValues[0];
  let reportLabel = 'Report an issue';
  if (reportStatus === 'sending') {
    reportLabel = 'Sending…';
  }
  if (reportStatus === 'done') {
    reportLabel = 'Report received';
  }
  async function report() {
    setReportStatus('sending');
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: experience.id }),
      });
      if (!response.ok) {
        throw new Error('Could not send report. Please try again.');
      }
      setReportStatus('done');
    } catch {
      setReportStatus('error');
    }
  }
  return (
    <article
      className={`rounded-2xl border p-4 sm:p-5 ${featured ? 'border-[#c5b69c] bg-[#fffdf8]' : 'border-[#ded7c9] bg-white'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-bold text-[#7c6958] text-xs uppercase tracking-[0.16em]">
            {experience.category}
          </p>
          <h3 className="mt-1 font-bold text-[#202c28] text-xl leading-tight">
            {experience.name}
          </h3>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-extrabold text-2xl text-[#aa572f] leading-none">
            £{calculateValue(experience).toFixed(2)}
          </p>
          <p className="mt-1 text-[#675d52] text-xs">per 1,000 pts</p>
        </div>
      </div>
      <p className="mt-2 text-[#574f47] text-sm leading-relaxed">
        {experience.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-[#e7ded1] border-t pt-3 text-sm">
        <span>
          <strong>£{redemption.value}</strong> for{' '}
          {redemption.points.toLocaleString()} pts
        </span>
        <span>
          <strong>{experience.earnPointsPerPound}</strong> pts per £1
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[#675d52] text-xs">
        <span>
          Until{' '}
          {new Date(`${experience.expiresAt}T12:00:00Z`).toLocaleDateString(
            'en-GB',
            { day: 'numeric', month: 'short', year: 'numeric' }
          )}{' '}
          · Community submitted
        </span>
        <button
          className="underline underline-offset-2 hover:text-[#202c28] disabled:no-underline"
          disabled={reportStatus === 'sending' || reportStatus === 'done'}
          onClick={report}
          type="button"
        >
          {reportLabel}
        </button>
      </div>
      {reportStatus === 'error' && (
        <p className="mt-2 text-red-700 text-xs" role="alert">
          Could not send report. Please try again.
        </p>
      )}
    </article>
  );
}
