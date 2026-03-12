import { createContainer } from '@/src/lib/container';
import { fail, ok } from '@/src/lib/http';
import { requireAdminSession } from '@/src/lib/auth';
import { AdminParticipantsRoute } from '@/src/routes/admin/participants';

export async function POST(request: Request) {
  try {
    await requireAdminSession(request);
    const body = await request.json();
    const container = createContainer();
    const route = new AdminParticipantsRoute(container.repositories.participantRepository);
    const data = await route.import(body);
    return ok(data);
  } catch (error) {
    return fail(error, 401);
  }
}
