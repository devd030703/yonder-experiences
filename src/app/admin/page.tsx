import { headers } from 'next/headers';
import { OwnerReview } from '@/components/owner-review';
import { isAdmin } from '@/lib/request-guard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const header = (await headers()).get('authorization');
  if (
    !isAdmin(
      new Request('https://local.invalid/admin', {
        headers: header ? { authorization: header } : {},
      })
    )
  ) {
    return (
      <main className="mx-auto max-w-xl p-8">
        <h1 className="font-bold text-2xl">Owner review</h1>
        <p className="mt-4">Sign in to review community reports.</p>
        <a className="mt-5 inline-block underline" href="/api/admin/auth">
          Owner sign-in
        </a>
      </main>
    );
  }
  return <OwnerReview />;
}
