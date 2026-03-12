import { createContainer } from '@/src/lib/container';
import { fail, ok } from '@/src/lib/http';
import { PublicSelfRoute } from '@/src/routes/public/self';

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const container = createContainer();
    const route = new PublicSelfRoute(container.services.selfResponseService);
    const data = await route.get(token);
    return ok(data);
  } catch (error) {
    return fail(error, 404);
  }
}

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const body = await request.json();
    const container = createContainer();
    const route = new PublicSelfRoute(container.services.selfResponseService);
    const data = await route.post(token, body);
    return ok(data);
  } catch (error) {
    return fail(error, 400);
  }
}