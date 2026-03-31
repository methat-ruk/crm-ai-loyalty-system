import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Prisma } from '../../../generated/prisma/index.js';
import type { CreateCustomerDto } from './dto/create-customer.dto.js';
import type { UpdateCustomerDto } from './dto/update-customer.dto.js';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async checkEmail(email: string, excludeId?: string) {
    const existing = await this.prisma.customer.findFirst({
      where: { email, ...(excludeId ? { id: { not: excludeId } } : {}) },
      select: { id: true },
    });
    return { available: !existing };
  }

  async findAll(
    search?: string,
    page = 1,
    limit = 20,
    tiers?: string[],
    isActive?: boolean,
    pointsMin?: number,
    pointsMax?: number,
  ) {
    const where: Record<string, unknown> = {};

    if (search) {
      where['OR'] = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (tiers && tiers.length > 0) where['tier'] = { in: tiers };
    if (isActive !== undefined) where['isActive'] = isActive;
    if (pointsMin !== undefined || pointsMax !== undefined) {
      where['loyaltyAccount'] = {
        totalPoints: {
          ...(pointsMin !== undefined ? { gte: pointsMin } : {}),
          ...(pointsMax !== undefined ? { lte: pointsMax } : {}),
        },
      };
    }

    const [data, total, activeCount, inactiveCount] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { loyaltyAccount: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
      this.prisma.customer.count({ where: { ...where, isActive: true } }),
      this.prisma.customer.count({ where: { ...where, isActive: false } }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      activeCount,
      inactiveCount,
    };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        loyaltyAccount: {
          include: {
            transactions: { take: 10, orderBy: { createdAt: 'desc' } },
          },
        },
        activities: { take: 10, orderBy: { createdAt: 'desc' } },
        redemptions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { reward: true },
        },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async getRedemptions(id: string, page = 1, limit = 10) {
    await this.findOne(id);
    const where = { customerId: id };
    const [data, total] = await Promise.all([
      this.prisma.rewardRedemption.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reward: { select: { id: true, name: true, pointsCost: true } },
        },
      }),
      this.prisma.rewardRedemption.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getActivities(id: string, page = 1, limit = 10) {
    await this.findOne(id);
    const where = { customerId: id };
    const [data, total] = await Promise.all([
      this.prisma.customerActivity.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customerActivity.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(dto: CreateCustomerDto) {
    try {
      return await this.prisma.customer.create({
        data: dto,
        include: { loyaltyAccount: true },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('Email is already in use');
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateCustomerDto) {
    await this.findOne(id);
    try {
      return await this.prisma.customer.update({
        where: { id },
        data: dto,
        include: { loyaltyAccount: true },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException('Email is already in use');
      }
      throw err;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.customer.delete({ where: { id } });
    return { message: 'Customer deleted successfully' };
  }
}
