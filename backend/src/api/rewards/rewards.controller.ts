import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RewardsService } from './rewards.service.js';
import {
  createRewardSchema,
  type CreateRewardDto,
} from './dto/create-reward.dto.js';
import {
  updateRewardSchema,
  type UpdateRewardDto,
} from './dto/update-reward.dto.js';
import {
  redeemRewardSchema,
  type RedeemRewardDto,
} from './dto/redeem-reward.dto.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['COMPLETED', 'CANCELLED']),
});

@Controller('rewards')
@UseGuards(JwtAuthGuard)
export class RewardsController {
  constructor(private rewardsService: RewardsService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const activeFilter =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.rewardsService.findAll(
      search,
      activeFilter,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rewardsService.findOne(id);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createRewardSchema)) dto: CreateRewardDto,
  ) {
    return this.rewardsService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateRewardSchema)) dto: UpdateRewardDto,
  ) {
    return this.rewardsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.rewardsService.remove(id);
  }

  @Get(':id/redemptions')
  getRedemptions(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.rewardsService.getRedemptions(
      id,
      Number(page) || 1,
      Number(limit) || 10,
    );
  }

  @Post(':id/redeem')
  redeemReward(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(redeemRewardSchema)) dto: RedeemRewardDto,
  ) {
    return this.rewardsService.redeem(id, dto.customerId);
  }

  @Patch('redemptions/:redemptionId/status')
  updateRedemptionStatus(
    @Param('redemptionId') redemptionId: string,
    @Body(new ZodValidationPipe(updateStatusSchema))
    body: { status: 'COMPLETED' | 'CANCELLED' },
  ) {
    return this.rewardsService.updateRedemptionStatus(
      redemptionId,
      body.status,
    );
  }
}
