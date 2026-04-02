import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@ApiTags('Analytics')
@ApiBearerAuth('access-token')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get dashboard overview stats' })
  @ApiResponse({
    status: 200,
    description: 'Overview metrics (customers, points, redemptions)',
  })
  getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('top-customers')
  @ApiOperation({ summary: 'Get top customers by lifetime points' })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'List of top customers' })
  getTopCustomers(@Query('limit') limit?: string) {
    return this.analyticsService.getTopCustomers(Number(limit) || 10);
  }

  @Get('tier-distribution')
  @ApiOperation({ summary: 'Get customer count breakdown by tier' })
  @ApiResponse({ status: 200, description: 'Tier distribution data' })
  getTierDistribution() {
    return this.analyticsService.getTierDistribution();
  }

  @Get('new-customers-trend')
  @ApiOperation({ summary: 'Get new customer registrations per month' })
  @ApiQuery({ name: 'months', required: false, example: 6 })
  @ApiResponse({ status: 200, description: 'Monthly new customer trend data' })
  getNewCustomersTrend(@Query('months') months?: string) {
    return this.analyticsService.getNewCustomersTrend(Number(months) || 6);
  }
}
