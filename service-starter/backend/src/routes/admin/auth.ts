import { authenticateAdmin, createAdminSessionCookie, clearAdminSessionCookie, requireAdminSession } from '../../lib/auth';

export async function getAdminSessionRoute(request: Request) {
  return requireAdminSession(request);
}

export async function loginAdminRoute(email: string, password: string) {
  const session = await authenticateAdmin(email, password);
  return {
    session,
    cookie: createAdminSessionCookie(session)
  };
}

export function logoutAdminRoute() {
  return { cookie: clearAdminSessionCookie() };
}
