import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LoyaltyService } from '../loyalty/loyalty.service.js';
import type { CreateRewardDto } from './dto/create-reward.dto.js';
import type { UpdateRewardDto } from './dto/update-reward.dto.js';

@Injectable()
export class RewardsService {
  constructor(
    private prisma: PrismaService,
    private loyaltyService: LoyaltyService,
  ) {}

  // ── List ──────────────────────────────────────────────────────────────────

  async findAll(search?: string, isActive?: boolean, page = 1, limit = 20) {
    const where: Record<string, unknown> = {};
    if (search) {
      where['OR'] = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) where['isActive'] = isActive;

    const [data, total, activeCount, totalRedemptions] = await Promise.all([
      this.prisma.reward.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { redemptions: true } } },
      }),
      this.prisma.reward.count({ where }),
      this.prisma.reward.count({ where: { ...where, isActive: true } }),
      this.prisma.rewardRedemption.count(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      activeCount,
      inactiveCount: total - activeCount,
      totalRedemptions,
    };
  }

  // ── Detail ────────────────────────────────────────────────────────────────

  async findOne(id: string) {
    const reward = await this.prisma.reward.findUnique({
      where: { id },
      include: {
        _count: { select: { redemptions: true } },
        redemptions: {
          take: 20,
          orderBy: { createdAt: 'desc' },
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
        },
      },
    });
    if (!reward) throw new NotFoundException('Reward not found');
    return reward;
  }

  // ── Redemptions paginated ─────────────────────────────────────────────────

  async getRedemptions(rewardId: string, page = 1, limit = 10) {
    await this.findOne(rewardId);
    const where = { rewardId };
    const [data, total] = await Promise.all([
      this.prisma.rewardRedemption.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      this.prisma.rewardRedemption.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async create(dto: CreateRewardDto) {
    return this.prisma.reward.create({ data: dto });
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateRewardDto) {
    await this.findOne(id);
    return this.prisma.reward.update({ where: { id }, data: dto });
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async remove(id: string) {
    await this.findOne(id);
    const hasRedemptions = await this.prisma.rewardRedemption.count({
      where: { rewardId: id },
    });
    if (hasRedemptions > 0) {
      throw new ConflictException(
        'Cannot delete a reward that has been redeemed',
      );
    }
    await this.prisma.reward.delete({ where: { id } });
    return { message: 'Reward deleted successfully' };
  }

  // ── Redeem ────────────────────────────────────────────────────────────────

  async redeem(rewardId: string, customerId: string) {
    const reward = await this.findOne(rewardId);

    if (!reward.isActive)
      throw new BadRequestException('This reward is not available');

    if (reward.expiresAt && reward.expiresAt < new Date()) {
      throw new BadRequestException('This reward has expired');
    }

    if (reward.stock !== null && reward.stock <= 0) {
      throw new BadRequestException('This reward is out of stock');
    }

    // Check customer balance
    const account = await this.prisma.loyaltyAccount.findUnique({
      where: { customerId },
      select: { totalPoints: true },
    });
    if (!account || account.totalPoints < reward.pointsCost) {
      throw new BadRequestException('Insufficient points');
    }

    // Deduct points + create redemption atomically
    const [redemption] = await Promise.all([
      this.prisma.rewardRedemption.create({
        data: { customerId, rewardId, pointsUsed: reward.pointsCost },
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          reward: { select: { id: true, name: true, pointsCost: true } },
        },
      }),
      this.loyaltyService.redeem({
        customerId,
        points: reward.pointsCost,
        description: `Redeemed reward: ${reward.name}`,
        referenceId: rewardId,
      }),
      ...(reward.stock !== null
        ? [
            this.prisma.reward.update({
              where: { id: rewardId },
              data: { stock: { decrement: 1 } },
            }),
          ]
        : []),
    ]);

    await this.prisma.customerActivity.create({
      data: {
        customerId,
        type: 'REWARD_REDEEMED',
        description: `Redeemed reward "${reward.name}" for ${reward.pointsCost} points`,
      },
    });

    return redemption;
  }

  // ── Update Redemption Status ───────────────────────────────────────────────

  async updateRedemptionStatus(
    redemptionId: string,
    status: 'COMPLETED' | 'CANCELLED',
  ) {
    const redemption = await this.prisma.rewardRedemption.findUnique({
      where: { id: redemptionId },
    });
    if (!redemption) throw new NotFoundException('Redemption not found');
    if (redemption.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot update a redemption that is already ${redemption.status}`,
      );
    }

    // If cancelled, refund points
    if (status === 'CANCELLED') {
      await this.loyaltyService.earn({
        customerId: redemption.customerId,
        points: redemption.pointsUsed,
        description: `Refund: cancelled redemption`,
        referenceId: redemptionId,
      });
    }

    return this.prisma.rewardRedemption.update({
      where: { id: redemptionId },
      data: { status },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true } },
        reward: { select: { id: true, name: true } },
      },
    });
  }
}
