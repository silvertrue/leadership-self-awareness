import type { PeerResponse } from '../../types/survey';
import type { PeerResponseService } from '../../services/peer-response-service';

export class PublicPeerRoute {
  constructor(private readonly service: PeerResponseService) {}

  async get(token: string) {
    return this.service.getPeerSurveyByToken(token);
  }

  async post(token: string, body: PeerResponse) {
    await this.service.savePeerResponse(token, body);
    return { ok: true };
  }

  async submit(token: string) {
    const submission = await this.service.submitResponder(token);
    return { ok: true, submission };
  }
}
