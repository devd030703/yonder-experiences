'use client';

import { Upload } from 'lucide-react';
import type { ChangeEvent } from 'react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { CommunityExperience } from '@/lib/parse-screenshot';
import { calculateValue } from '@/lib/utils';

type UploadResult = { offer: CommunityExperience; duplicate: boolean };
const validFile = (file: File) =>
  ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) &&
  file.size <= 4 * 1024 * 1024;

export function ScreenshotUpload({ onPublished }: { onPublished: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<UploadResult | null>(null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    event.target.value = '';
    setResult(null);

    if (!validFile(file)) {
      setMessage('Choose a JPG, PNG or WebP screenshot smaller than 4 MB.');
      return;
    }

    setBusy(true);
    setMessage('Reading and checking your screenshot…');
    try {
      const form = new FormData();
      form.set('screenshot', file);
      const response = await fetch('/api/experiences', {
        method: 'POST',
        body: form,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Upload failed.');
      }
      setResult(data as UploadResult);
      setMessage(
        data.duplicate
          ? 'This experience is already listed.'
          : 'Experience published.'
      );
      onPublished();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not read this screenshot.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="rounded-2xl border border-[#dac9ae] bg-[#f5ead8] p-4 sm:p-5"
      id="contribute"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-lg">Seen a new experience?</h2>
          <p className="mt-1 text-sm">
            Upload a Yonder app screenshot. We’ll read, check and add it
            automatically.
          </p>
        </div>
        <input
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handleFile}
          ref={input}
          type="file"
        />
        <Button
          disabled={busy}
          onClick={() => input.current?.click()}
          type="button"
        >
          <Upload className="mr-2 size-4" />
          {busy ? 'Processing…' : 'Upload screenshot'}
        </Button>
      </div>
      <output aria-live="polite" className="mt-3 block text-sm">
        {message}
      </output>
      {result && (
        <p className="mt-1 text-sm">
          {result.offer.name}: £{result.offer.redeemValues[0].value} for{' '}
          {result.offer.redeemValues[0].points.toLocaleString()} points — £
          {calculateValue(result.offer).toFixed(2)} per 1,000 points.
        </p>
      )}
      <p className="mt-2 text-muted-foreground text-xs">
        Your screenshot is checked privately and discarded. Only the offer
        details are saved.
      </p>
    </section>
  );
}
