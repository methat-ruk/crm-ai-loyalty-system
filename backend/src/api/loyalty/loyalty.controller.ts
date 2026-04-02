import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
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
import { LoyaltyService } from './loyalty.service.js';
import { earnPointsSchema, type EarnPointsDto } from './dto/earn-points.dto.js';
import {
  redeemPointsSchema,
  type RedeemPointsDto,
} from './dto/redeem-points.dto.js';
import {
  adjustPointsSchema,
  type AdjustPointsDto,
} from './dto/adjust-points.dto.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../../generated/prisma/index.js';

@ApiTags('Loyalty')
@ApiBearerAuth('access-token')
@Controller('loyalty')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LoyaltyController {
  constructor(private loyaltyService: LoyaltyService) {}

  // GET /loyalty/overview — must be before /:customerId
  @Get('overview')
  @ApiOperation({ summary: 'Get loyalty program overview stats' })
  @ApiResponse({ status: 200, description: 'Loyalty overview stats' })
  getOverview() {
    return this.loyaltyService.getOverview();
  }

  // GET /loyalty/transactions — global paginated list
  @Get('transactions')
  @ApiOperation({ summary: 'List all loyalty transactions (paginated)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['EARN', 'REDEEM', 'EXPIRE', 'ADJUST'],
  })
  @ApiResponse({ status: 200, description: 'Paginated transaction list' })
  getAllTransactions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ) {
    return this.loyaltyService.getAllTransactions(
      Number(page) || 1,
      Number(limit) || 20,
      type,
    );
  }

  // GET /loyalty/:customerId
  @Get(':customerId')
  @ApiOperation({ summary: 'Get loyalty account for a customer' })
  @ApiParam({ name: 'customerId' })
  @ApiResponse({ status: 200, description: 'Loyalty account info' })
  @ApiResponse({ status: 404, description: 'Loyalty account not found' })
  getAccount(@Param('customerId') customerId: string) {
    return this.loyaltyService.getAccount(customerId);
  }

  // GET /loyalty/:customerId/transactions
  @Get(':customerId/transactions')
  @ApiOperation({ summary: 'Get transactions for a specific customer' })
  @ApiParam({ name: 'customerId' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['EARN', 'REDEEM', 'EXPIRE', 'ADJUST'],
  })
  @ApiResponse({ status: 200, description: 'Paginated transaction list' })
  getTransactions(
    @Param('customerId') customerId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ) {
    return this.loyaltyService.getTransactions(
      customerId,
      Number(page) || 1,
      Number(limit) || 20,
      type,
    );
  }

  // POST /loyalty/earn
  @Post('earn')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Earn points for a customer (ADMIN, STAFF)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['customerId', 'points', 'description'],
      properties: {
        customerId: { type: 'string', example: 'cuid...' },
        points: { type: 'integer', minimum: 1, example: 100 },
        description: { type: 'string', example: 'Purchase - Order #1234' },
        referenceId: { type: 'string', example: 'order-1234' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Points earned successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  earn(@Body(new ZodValidationPipe(earnPointsSchema)) dto: EarnPointsDto) {
    return this.loyaltyService.earn(dto);
  }

  // POST /loyalty/redeem
  @Post('redeem')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Redeem points for a customer (ADMIN, STAFF)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['customerId', 'points', 'description'],
      properties: {
        customerId: { type: 'string', example: 'cuid...' },
        points: { type: 'integer', minimum: 1, example: 200 },
        description: { type: 'string', example: 'Redeemed: Free Drink' },
        referenceId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Points redeemed successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient points' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  redeem(
    @Body(new ZodValidationPipe(redeemPointsSchema)) dto: RedeemPointsDto,
  ) {
    return this.loyaltyService.redeem(dto);
  }

  // POST /loyalty/adjust
  @Post('adjust')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({
    summary: 'Manually adjust points for a customer (ADMIN, STAFF)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['customerId', 'type', 'points', 'description'],
      properties: {
        customerId: { type: 'string', example: 'cuid...' },
        type: { type: 'string', enum: ['EARN', 'REDEEM', 'EXPIRE', 'ADJUST'] },
        points: { type: 'integer', minimum: 1, example: 50 },
        description: { type: 'string', example: 'Birthday bonus' },
        referenceId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Points adjusted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  adjust(
    @Body(new ZodValidationPipe(adjustPointsSchema)) dto: AdjustPointsDto,
  ) {
    return this.loyaltyService.adjust(dto);
  }
}
