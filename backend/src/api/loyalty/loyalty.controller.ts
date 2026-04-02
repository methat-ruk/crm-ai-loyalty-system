import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
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

@Controller('loyalty')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LoyaltyController {
  constructor(private loyaltyService: LoyaltyService) {}

  // GET /loyalty/overview — must be before /:customerId
  @Get('overview')
  getOverview() {
    return this.loyaltyService.getOverview();
  }

  // GET /loyalty/transactions — global paginated list
  @Get('transactions')
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
  getAccount(@Param('customerId') customerId: string) {
    return this.loyaltyService.getAccount(customerId);
  }

  // GET /loyalty/:customerId/transactions
  @Get(':customerId/transactions')
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
  earn(@Body(new ZodValidationPipe(earnPointsSchema)) dto: EarnPointsDto) {
    return this.loyaltyService.earn(dto);
  }

  // POST /loyalty/redeem
  @Post('redeem')
  @Roles(Role.ADMIN, Role.STAFF)
  redeem(
    @Body(new ZodValidationPipe(redeemPointsSchema)) dto: RedeemPointsDto,
  ) {
    return this.loyaltyService.redeem(dto);
  }

  // POST /loyalty/adjust
  @Post('adjust')
  @Roles(Role.ADMIN, Role.STAFF)
  adjust(
    @Body(new ZodValidationPipe(adjustPointsSchema)) dto: AdjustPointsDto,
  ) {
    return this.loyaltyService.adjust(dto);
  }
}
