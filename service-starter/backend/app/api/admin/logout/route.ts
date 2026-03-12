import { ok, withCookie } from '@/src/lib/http';
import { logoutAdminRoute } from '@/src/routes/admin/auth';

export async function POST() {
  const { cookie } = logoutAdminRoute();
  return withCookie(ok({ ok: true }), cookie);
}
