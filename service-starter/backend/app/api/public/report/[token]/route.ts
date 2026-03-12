import { createContainer } from '@/src/lib/container';
import { fail, ok } from '@/src/lib/http';
import { PublicReportRoute } from '@/src/routes/public/report';

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const container = createContainer();
    const route = new PublicReportRoute(
      container.repositories.participantRepository,
      container.services.reportService
    );
    const data = await route.get(token);
    return ok(data);
  } catch (error) {
    return fail(error, 404);
  }
}