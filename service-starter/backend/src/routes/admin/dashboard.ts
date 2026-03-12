import type { DashboardService } from '../../services/dashboard-service';

export class AdminDashboardRoute {
  constructor(private readonly dashboardService: DashboardService) {}

  async get() {
    return this.dashboardService.getDashboardSummary();
  }
}
