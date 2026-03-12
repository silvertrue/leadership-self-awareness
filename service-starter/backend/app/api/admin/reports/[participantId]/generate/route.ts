import { createContainer } from '@/src/lib/container';
import { fail, ok } from '@/src/lib/http';
import { requireAdminSession } from '@/src/lib/auth';
import { AdminReportsRoute } from '@/src/routes/admin/reports';

export async function POST(request: Request) {
  try {
    await requireAdminSession(request);
    const container = createContainer();
    const route = new AdminReportsRoute(
      container.repositories.participantRepository,
      container.services.reportService,
      container.services.reportWorker
    );
    const data = await route.generateAll();
    return ok(data);
  } catch (error) {
    return fail(error, 401);
  }
}
