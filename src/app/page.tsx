'use client';

import { SiGithub, SiX } from '@icons-pack/react-simple-icons';
import { useState } from 'react';
import { CategorySelect } from '@/components/category-select';
import { ExperienceCard } from '@/components/experience-card';
import { ExperienceChart } from '@/components/experience-chart';
import { ScreenshotUpload } from '@/components/screenshot-upload';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useExperiences } from '@/hooks/use-experiences';
import { experiences as originalExperiences } from '@/lib/experiences';

export default function HomePage() {
  const [category, setCategory] = useState<string | null>(null);
  const { experiences, loading, error, refresh } = useExperiences(category);
  const top = experiences.slice(0, 3);
  const rest = experiences.slice(3);

  return (
    <div>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="mb-1 font-bold text-4xl tracking-tighter sm:text-6xl">
            Yonder <span className="italic">E</span>xperiences
          </h1>
          <p className="text-lg">Find the best value for your Yonder points</p>
        </div>
        <Alert className="mb-6">
          <AlertDescription>
            Compare the £ value of each reward per 1,000 points. Offers can
            change; check the Yonder app before booking.
          </AlertDescription>
        </Alert>
        <ScreenshotUpload onPublished={refresh} />
        <div className="mb-10 grid place-items-center">
          <CategorySelect category={category} setCategory={setCategory} />
        </div>
        <h2 className="mb-4 font-semibold text-2xl">Community experiences</h2>
        {loading && <p className="mb-6">Loading experiences…</p>}
        {error && <p className="mb-6 text-red-700">{error}</p>}
        {!(loading || error) && experiences.length === 0 && (
          <p className="mb-6 text-muted-foreground">
            No current uploads in this category yet. Add the first screenshot
            above.
          </p>
        )}
        <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {top.map((experience) => (
            <ExperienceCard experience={experience} key={experience.id} />
          ))}
        </div>
        {rest.length > 0 && <ExperienceChart experiences={rest} />}
        <details className="mt-8 rounded-lg border p-4">
          <summary className="cursor-pointer font-medium">
            Original sample entries
          </summary>
          <p className="my-3 text-muted-foreground text-sm">
            These entries came with the original repository and have not been
            verified as current.
          </p>
          <ExperienceChart experiences={originalExperiences} />
        </details>
        <p className="mt-10 text-muted-foreground text-sm">
          This tool is not affiliated with Yonder. All information is provided
          for informational purposes only.
        </p>
      </div>
      <div className="mt-2 w-full bg-slate-100">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 p-8">
          <p className="text-sm">
            Made by{' '}
            <a
              className="font-bold underline"
              href="https://danbillson.com"
              rel="noopener noreferrer"
              target="_blank"
            >
              Dan Billson
            </a>
          </p>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/danbillson/yonder-experiences"
              rel="noopener noreferrer"
              target="_blank"
            >
              <SiGithub className="size-5" />
            </a>
            <a
              href="https://x.com/dbillson"
              rel="noopener noreferrer"
              target="_blank"
            >
              <SiX className="size-5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
