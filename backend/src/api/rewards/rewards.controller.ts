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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
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
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../../generated/prisma/index.js';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['COMPLETED', 'CANCELLED']),
});

@ApiTags('Rewards')
@ApiBearerAuth('access-token')
@Controller('rewards')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RewardsController {
  constructor(private rewardsService: RewardsService) {}

  @Get()
  @ApiOperation({ summary: 'List rewards with filtering and pagination' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'isActive', required: false, enum: ['true', 'false'] })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Paginated reward list' })
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
  @ApiOperation({ summary: 'Get reward detail by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Reward detail' })
  @ApiResponse({ status: 404, description: 'Reward not found' })
  findOne(@Param('id') id: string) {
    return this.rewardsService.findOne(id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Create a new reward (ADMIN, STAFF)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'pointsCost'],
      properties: {
        name: { type: 'string', example: 'Free Coffee' },
        description: {
          type: 'string',
          example: 'Redeem for a free hot or iced coffee',
        },
        pointsCost: { type: 'integer', minimum: 1, example: 150 },
        stock: { type: 'integer', minimum: 0, example: 50 },
        expiresAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Reward created' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(
    @Body(new ZodValidationPipe(createRewardSchema)) dto: CreateRewardDto,
  ) {
    return this.rewardsService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Update a reward (ADMIN, STAFF)' })
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        pointsCost: { type: 'integer', minimum: 1 },
        stock: { type: 'integer', minimum: 0 },
        isActive: { type: 'boolean' },
        expiresAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Reward updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Reward not found' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateRewardSchema)) dto: UpdateRewardDto,
  ) {
    return this.rewardsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a reward (ADMIN, STAFF)' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Reward deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  remove(@Param('id') id: string) {
    return this.rewardsService.remove(id);
  }

  @Get(':id/redemptions')
  @ApiOperation({ summary: 'Get redemption history for a reward' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Paginated redemption list' })
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
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Redeem a reward for a customer (ADMIN, STAFF)' })
  @ApiParam({ name: 'id', description: 'Reward ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['customerId'],
      properties: {
        customerId: { type: 'string', example: 'cuid...' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Redemption created' })
  @ApiResponse({
    status: 400,
    description: 'Insufficient points or out of stock',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  redeemReward(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(redeemRewardSchema)) dto: RedeemRewardDto,
  ) {
    return this.rewardsService.redeem(id, dto.customerId);
  }

  @Patch('redemptions/:redemptionId/status')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({
    summary:
      'Update redemption status to COMPLETED or CANCELLED (ADMIN, STAFF)',
  })
  @ApiParam({ name: 'redemptionId' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { type: 'string', enum: ['COMPLETED', 'CANCELLED'] },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Redemption status updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
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
