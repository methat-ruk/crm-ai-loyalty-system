import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UsePipes,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CustomersService } from './customers.service.js';
import {
  createCustomerSchema,
  type CreateCustomerDto,
} from './dto/create-customer.dto.js';
import {
  updateCustomerSchema,
  type UpdateCustomerDto,
} from './dto/update-customer.dto.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../../generated/prisma/index.js';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get('check-email')
  checkEmail(
    @Query('email') email: string,
    @Query('excludeId') excludeId?: string,
  ) {
    return this.customersService.checkEmail(email, excludeId);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tiers') tiers?: string | string[],
    @Query('isActive') isActive?: string,
    @Query('pointsMin') pointsMin?: string,
    @Query('pointsMax') pointsMax?: string,
  ) {
    const tierList = tiers
      ? Array.isArray(tiers)
        ? tiers
        : tiers.split(',')
      : undefined;
    const activeFilter =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.customersService.findAll(
      search,
      Number(page) || 1,
      Number(limit) || 20,
      tierList,
      activeFilter,
      pointsMin ? Number(pointsMin) : undefined,
      pointsMax ? Number(pointsMax) : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Get(':id/redemptions')
  getRedemptions(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.customersService.getRedemptions(
      id,
      Number(page) || 1,
      Number(limit) || 10,
    );
  }

  @Get(':id/activities')
  getActivities(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.customersService.getActivities(
      id,
      Number(page) || 1,
      Number(limit) || 10,
    );
  }

  @Post()
  @Roles(Role.ADMIN, Role.STAFF)
  @UsePipes(new ZodValidationPipe(createCustomerSchema))
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCustomerSchema)) dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
