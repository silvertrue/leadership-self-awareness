import { fail, ok } from '@/src/lib/http';
import { getAdminSessionRoute } from '@/src/routes/admin/auth';

export async function GET(request: Request) {
  try {
    const session = await getAdminSessionRoute(request);
    return ok({ ok: true, session });
  } catch (error) {
    return fail(error, 401);
  }
}
