import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverview() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalCustomers,
      activeCustomers,
      newCustomersThisMonth,
      totalRedemptions,
      pointsAgg,
    ] = await Promise.all([
      this.prisma.customer.count(),
      this.prisma.customer.count({ where: { isActive: true } }),
      this.prisma.customer.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      this.prisma.rewardRedemption.count(),
      this.prisma.loyaltyAccount.aggregate({ _sum: { totalPoints: true } }),
    ]);

    return {
      totalCustomers,
      activeCustomers,
      newCustomersThisMonth,
      totalRedemptions,
      totalLoyaltyPoints: pointsAgg._sum.totalPoints ?? 0,
    };
  }

  async getTopCustomers(limit = 10) {
    const accounts = await this.prisma.loyaltyAccount.findMany({
      orderBy: { totalPoints: 'desc' },
      take: limit,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            tier: true,
          },
        },
      },
    });

    return accounts.map((a) => ({
      id: a.customer.id,
      firstName: a.customer.firstName,
      lastName: a.customer.lastName,
      email: a.customer.email,
      tier: a.customer.tier,
      totalPoints: a.totalPoints,
      lifetimePoints: a.lifetimePoints,
    }));
  }

  async getTierDistribution() {
    const tiers = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'] as const;
    const counts = await Promise.all(
      tiers.map((tier) =>
        this.prisma.customer.count({ where: { tier } }).then((count) => ({
          tier,
          count,
        })),
      ),
    );
    return counts;
  }

  async getNewCustomersTrend(months = 6) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const customers = await this.prisma.customer.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const counts = new Map<string, number>();
    for (const c of customers) {
      const key = c.createdAt.toISOString().slice(0, 7);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return Array.from(counts.entries()).map(([month, count]) => ({
      month,
      count,
    }));
  }
}
