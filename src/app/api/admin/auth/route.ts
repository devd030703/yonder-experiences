import { adminChallenge, isAdmin } from '@/lib/request-guard';

export const runtime = 'nodejs';
export function GET(request: Request) {
  if (!isAdmin(request)) {
    return adminChallenge();
  }
  return Response.redirect(new URL('/admin', request.url));
}
