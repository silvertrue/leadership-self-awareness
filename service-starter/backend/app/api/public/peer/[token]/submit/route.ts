import { createContainer } from '@/src/lib/container';
import { fail, ok } from '@/src/lib/http';
import { PublicPeerRoute } from '@/src/routes/public/peer';

export async function POST(_request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    const container = createContainer();
    const route = new PublicPeerRoute(container.services.peerResponseService);
    const data = await route.submit(token);
    return ok(data);
  } catch (error) {
    return fail(error, 400);
  }
}