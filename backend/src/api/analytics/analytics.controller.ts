import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('overview')
  getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('top-customers')
  getTopCustomers(@Query('limit') limit?: string) {
    return this.analyticsService.getTopCustomers(Number(limit) || 10);
  }

  @Get('tier-distribution')
  getTierDistribution() {
    return this.analyticsService.getTierDistribution();
  }

  @Get('new-customers-trend')
  getNewCustomersTrend(@Query('months') months?: string) {
    return this.analyticsService.getNewCustomersTrend(Number(months) || 6);
  }
}
