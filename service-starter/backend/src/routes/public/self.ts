import type { SelfResponse } from '../../types/survey';
import type { SelfResponseService } from '../../services/self-response-service';

export class PublicSelfRoute {
  constructor(private readonly service: SelfResponseService) {}

  async get(token: string) {
    return this.service.getSelfSurveyByToken(token);
  }

  async post(token: string, body: SelfResponse) {
    await this.service.saveSelfSurvey(token, body);
    return { ok: true };
  }
}
