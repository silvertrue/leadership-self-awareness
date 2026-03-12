import { fail, ok, withCookie } from '@/src/lib/http';
import { loginAdminRoute } from '@/src/routes/admin/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session, cookie } = await loginAdminRoute(String(body.email || ''), String(body.password || ''));
    return withCookie(ok({ ok: true, session }), cookie);
  } catch (error) {
    return fail(error, 401);
  }
}
