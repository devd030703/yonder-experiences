import { useCallback, useEffect, useState } from 'react';
import { type CommunityExperience, londonDate } from '@/lib/parse-screenshot';
import { calculateValue } from '@/lib/utils';

export function useExperiences(category: string | null) {
  const [experiences, setExperiences] = useState<CommunityExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    fetch('/api/experiences', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok)
          throw new Error('Could not load community experiences.');
        return response.json();
      })
      .then((data) => {
        if (active) {
          setExperiences(data.experiences);
          setError('');
        }
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : 'Could not load experiences.'
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [revision]);

  const filteredExperiences = experiences
    .filter((exp) => exp.expiresAt >= londonDate(new Date()))
    .filter(
      (exp) =>
        category === null ||
        (category === 'other' &&
          exp.category.toLocaleLowerCase() !== 'dining' &&
          exp.category.toLocaleLowerCase() !== 'shopping') ||
        exp.category.toLocaleLowerCase() === category.toLocaleLowerCase()
    )
    .sort((a, b) => calculateValue(b) - calculateValue(a));

  return { experiences: filteredExperiences, loading, error, refresh };
}
