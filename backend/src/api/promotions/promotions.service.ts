import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  createCampaignSchema,
  type CreateCampaignDto,
} from './dto/create-campaign.dto.js';
import { updateCampaignSchema } from './dto/update-campaign.dto.js';
import type { UpdateCampaignDto } from './dto/update-campaign.dto.js';

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    search?: string,
    type?: string,
    isActive?: boolean,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;
    const now = new Date();

    const where = {
      ...(search && {
        name: { contains: search, mode: 'insensitive' as const },
      }),
      ...(type && { type: type as CreateCampaignDto['type'] }),
      ...(isActive !== undefined && { isActive }),
    };

    const [data, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        orderBy: { startDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return {
      data: data.map((c) => ({
        ...c,
        isExpired: c.endDate < now,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return { ...campaign, isExpired: campaign.endDate < new Date() };
  }

  async create(dto: CreateCampaignDto) {
    const data = createCampaignSchema.parse(dto);
    return this.prisma.campaign.create({ data });
  }

  async update(id: string, dto: UpdateCampaignDto) {
    await this.findOne(id);
    const data = updateCampaignSchema.parse(dto);
    return this.prisma.campaign.update({ where: { id }, data });
  }

  async toggle(id: string) {
    const campaign = await this.findOne(id);
    return this.prisma.campaign.update({
      where: { id },
      data: { isActive: !campaign.isActive },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.campaign.delete({ where: { id } });
  }
}
