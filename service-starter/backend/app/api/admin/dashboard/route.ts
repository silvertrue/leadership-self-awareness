import { createContainer } from '@/src/lib/container';
import { fail, ok } from '@/src/lib/http';
import { requireAdminSession } from '@/src/lib/auth';

export async function GET(request: Request) {
  try {
    await requireAdminSession(request);
    const container = createContainer();
    const data = await container.services.dashboardService.getDashboardSummary();
    return ok(data);
  } catch (error) {
    return fail(error, 401);
  }
}
