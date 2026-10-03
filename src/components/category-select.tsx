'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function CategorySelect({
  category,
  setCategory,
}: {
  category: string | null;
  setCategory: (category: string | null) => void;
}) {
  return (
    <div className="flex gap-2">
      <Button
        className={cn(category !== null && 'bg-transparent')}
        onClick={() => setCategory(null)}
        variant="all"
      >
        All
      </Button>
      <Button
        className={cn(category !== 'shopping' && 'bg-transparent')}
        onClick={() => setCategory('shopping')}
        variant="shopping"
      >
        Shopping
      </Button>
      <Button
        className={cn(category !== 'dining' && 'bg-transparent')}
        onClick={() => setCategory('dining')}
        variant="dining"
      >
        Dining
      </Button>
      <Button
        className={cn(category !== 'other' && 'bg-transparent')}
        onClick={() => setCategory('other')}
        variant="other"
      >
        Other
      </Button>
    </div>
  );
}
