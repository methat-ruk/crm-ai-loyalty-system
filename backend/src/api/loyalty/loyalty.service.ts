import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Tier } from '../../../generated/prisma/index.js';
import type { EarnPointsDto } from './dto/earn-points.dto.js';
import type { RedeemPointsDto } from './dto/redeem-points.dto.js';
import type { AdjustPointsDto } from './dto/adjust-points.dto.js';

// ─── Tier thresholds (lifetime points) ───────────────────────────────────────

const TIER_THRESHOLDS: Record<Tier, number> = {
  BRONZE: 0,
  SILVER: 1000,
  GOLD: 5000,
  PLATINUM: 20000,
};

const TIER_ORDER: Tier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];

function getTierFromLifetime(lifetimePoints: number): Tier {
  if (lifetimePoints >= TIER_THRESHOLDS.PLATINUM) return 'PLATINUM';
  if (lifetimePoints >= TIER_THRESHOLDS.GOLD) return 'GOLD';
  if (lifetimePoints >= TIER_THRESHOLDS.SILVER) return 'SILVER';
  return 'BRONZE';
}

function nextTierInfo(tier: Tier, lifetimePoints: number) {
  const idx = TIER_ORDER.indexOf(tier);
  if (idx === TIER_ORDER.length - 1) return null; // already PLATINUM
  const next = TIER_ORDER[idx + 1];
  const needed = TIER_THRESHOLDS[next] - lifetimePoints;
  return { tier: next, pointsNeeded: needed, threshold: TIER_THRESHOLDS[next] };
}

// ─── Service ─────────────────────────────────────────────────────────────────

@Injectable()
export class LoyaltyService {
  constructor(private prisma: PrismaService) {}

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async findCustomerOrThrow(customerId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  private async getOrCreateAccount(customerId: string) {
    const account = await this.prisma.loyaltyAccount.findUnique({
      where: { customerId },
    });
    if (account) return account;
    return this.prisma.loyaltyAccount.create({
      data: { customerId },
    });
  }

  // ── Overview (for /loyalty page) ──────────────────────────────────────────

  async getOverview() {
    const [
      totalAccounts,
      pointsAgg,
      totalTransactions,
      recentTransactions,
      tierCounts,
    ] = await Promise.all([
      this.prisma.loyaltyAccount.count(),
      this.prisma.loyaltyAccount.aggregate({
        _sum: { totalPoints: true, lifetimePoints: true },
      }),
      this.prisma.loyaltyTransaction.count(),
      this.prisma.loyaltyTransaction.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          loyaltyAccount: {
            include: {
              customer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  tier: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.customer.groupBy({
        by: ['tier'],
        _count: { tier: true },
      }),
    ]);

    const tierMap = Object.fromEntries(
      tierCounts.map((t) => [t.tier, t._count.tier]),
    );

    return {
      totalAccounts,
      totalPoints: pointsAgg._sum.totalPoints ?? 0,
      totalLifetimePoints: pointsAgg._sum.lifetimePoints ?? 0,
      totalTransactions,
      tierCounts: {
        BRONZE: tierMap['BRONZE'] ?? 0,
        SILVER: tierMap['SILVER'] ?? 0,
        GOLD: tierMap['GOLD'] ?? 0,
        PLATINUM: tierMap['PLATINUM'] ?? 0,
      },
      recentTransactions,
    };
  }

  // ── All transactions (global, paginated) ──────────────────────────────────

  async getAllTransactions(page = 1, limit = 20, type?: string) {
    const where = type
      ? { type: type as 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUST' }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.loyaltyTransaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          loyaltyAccount: {
            include: {
              customer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  tier: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.loyaltyTransaction.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ── Get single account ─────────────────────────────────────────────────────

  async getAccount(customerId: string) {
    await this.findCustomerOrThrow(customerId);
    const account = await this.prisma.loyaltyAccount.findUnique({
      where: { customerId },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true, tier: true },
        },
        transactions: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!account) {
      return this.prisma.loyaltyAccount.create({
        data: { customerId },
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true, tier: true },
          },
          transactions: true,
        },
      });
    }

    const next = nextTierInfo(account.customer.tier, account.lifetimePoints);
    return { ...account, nextTier: next };
  }

  // ── Transactions (paginated) ───────────────────────────────────────────────

  async getTransactions(
    customerId: string,
    page = 1,
    limit = 20,
    type?: string,
  ) {
    await this.findCustomerOrThrow(customerId);
    const account = await this.prisma.loyaltyAccount.findUnique({
      where: { customerId },
      select: { id: true },
    });
    if (!account) return { data: [], total: 0, page, limit, totalPages: 0 };

    const where = {
      loyaltyAccountId: account.id,
      ...(type
        ? { type: type as 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUST' }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.loyaltyTransaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.loyaltyTransaction.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ── Earn ──────────────────────────────────────────────────────────────────

  async earn(dto: EarnPointsDto) {
    const customer = await this.findCustomerOrThrow(dto.customerId);
    const account = await this.getOrCreateAccount(dto.customerId);

    const newTotal = account.totalPoints + dto.points;
    const newLifetime = account.lifetimePoints + dto.points;
    const newTier = getTierFromLifetime(newLifetime);
    const tierChanged = newTier !== customer.tier;

    await this.prisma.$transaction([
      this.prisma.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: account.id,
          type: 'EARN',
          points: dto.points,
          description: dto.description,
          referenceId: dto.referenceId,
        },
      }),
      this.prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: { totalPoints: newTotal, lifetimePoints: newLifetime },
      }),
      ...(tierChanged
        ? [
            this.prisma.customer.update({
              where: { id: dto.customerId },
              data: { tier: newTier },
            }),
          ]
        : []),
    ]);

    await this.prisma.customerActivity.create({
      data: {
        customerId: dto.customerId,
        type: 'POINTS_EARNED',
        description: `Earned ${dto.points} points — ${dto.description}`,
      },
    });

    if (tierChanged) {
      await this.prisma.customerActivity.create({
        data: {
          customerId: dto.customerId,
          type: 'TIER_UPGRADED',
          description: `Tier upgraded from ${customer.tier} to ${newTier}`,
        },
      });
    }

    return {
      message: `Earned ${dto.points} points`,
      totalPoints: newTotal,
      lifetimePoints: newLifetime,
      tier: newTier,
      tierChanged,
    };
  }

  // ── Redeem ────────────────────────────────────────────────────────────────

  async redeem(dto: RedeemPointsDto) {
    await this.findCustomerOrThrow(dto.customerId);
    const account = await this.prisma.loyaltyAccount.findUnique({
      where: { customerId: dto.customerId },
    });

    if (!account || account.totalPoints < dto.points) {
      throw new BadRequestException('Insufficient points');
    }

    const newTotal = account.totalPoints - dto.points;

    await this.prisma.$transaction([
      this.prisma.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: account.id,
          type: 'REDEEM',
          points: dto.points,
          description: dto.description,
          referenceId: dto.referenceId,
        },
      }),
      this.prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: { totalPoints: newTotal },
      }),
    ]);

    await this.prisma.customerActivity.create({
      data: {
        customerId: dto.customerId,
        type: 'POINTS_REDEEMED',
        description: `Redeemed ${dto.points} points — ${dto.description}`,
      },
    });

    return {
      message: `Redeemed ${dto.points} points`,
      totalPoints: newTotal,
    };
  }

  // ── Adjust (admin) ────────────────────────────────────────────────────────

  async adjust(dto: AdjustPointsDto) {
    const customer = await this.findCustomerOrThrow(dto.customerId);
    const account = await this.getOrCreateAccount(dto.customerId);

    const isDeduct = dto.type === 'REDEEM' || dto.type === 'EXPIRE';
    const delta = isDeduct ? -dto.points : dto.points;
    const newTotal = Math.max(0, account.totalPoints + delta);
    // lifetimePoints only grows
    const newLifetime = !isDeduct
      ? account.lifetimePoints + dto.points
      : account.lifetimePoints;
    const newTier = getTierFromLifetime(newLifetime);
    const tierChanged = newTier !== customer.tier;

    await this.prisma.$transaction([
      this.prisma.loyaltyTransaction.create({
        data: {
          loyaltyAccountId: account.id,
          type: dto.type,
          points: dto.points,
          description: dto.description,
          referenceId: dto.referenceId,
        },
      }),
      this.prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: { totalPoints: newTotal, lifetimePoints: newLifetime },
      }),
      ...(tierChanged
        ? [
            this.prisma.customer.update({
              where: { id: dto.customerId },
              data: { tier: newTier },
            }),
          ]
        : []),
    ]);

    return {
      message: `Adjusted ${dto.points} points (${dto.type})`,
      totalPoints: newTotal,
      lifetimePoints: newLifetime,
      tier: newTier,
      tierChanged,
    };
  }
}
