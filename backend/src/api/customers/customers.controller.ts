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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
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

@ApiTags('Customers')
@ApiBearerAuth('access-token')
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private customersService: CustomersService) {}

  @Get('check-email')
  @ApiOperation({ summary: 'Check if email is already in use' })
  @ApiQuery({ name: 'email', required: true })
  @ApiQuery({ name: 'excludeId', required: false })
  @ApiResponse({ status: 200, description: 'Returns { available: boolean }' })
  checkEmail(
    @Query('email') email: string,
    @Query('excludeId') excludeId?: string,
  ) {
    return this.customersService.checkEmail(email, excludeId);
  }

  @Get()
  @ApiOperation({ summary: 'List customers with filtering and pagination' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({
    name: 'tiers',
    required: false,
    description: 'Comma-separated: BRONZE,SILVER,GOLD,PLATINUM',
  })
  @ApiQuery({ name: 'isActive', required: false, enum: ['true', 'false'] })
  @ApiQuery({ name: 'pointsMin', required: false })
  @ApiQuery({ name: 'pointsMax', required: false })
  @ApiResponse({ status: 200, description: 'Paginated list of customers' })
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
  @ApiOperation({ summary: 'Get customer detail by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({
    status: 200,
    description: 'Customer detail with loyalty account',
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Get(':id/redemptions')
  @ApiOperation({ summary: 'Get reward redemptions for a customer' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Paginated redemption list' })
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
  @ApiOperation({ summary: 'Get activity timeline for a customer' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Paginated activity list' })
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
  @ApiOperation({ summary: 'Create a new customer (ADMIN, STAFF)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['firstName', 'lastName', 'email'],
      properties: {
        firstName: { type: 'string', example: 'Somchai' },
        lastName: { type: 'string', example: 'Jaidee' },
        email: {
          type: 'string',
          format: 'email',
          example: 'somchai@example.com',
        },
        phone: { type: 'string', example: '081-234-5678' },
        dateOfBirth: { type: 'string', format: 'date', example: '1990-01-15' },
        tier: {
          type: 'string',
          enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
          default: 'BRONZE',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Customer created' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden – MARKETING role cannot create',
  })
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Update a customer (ADMIN, STAFF)' })
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string', format: 'email' },
        phone: { type: 'string' },
        dateOfBirth: { type: 'string', format: 'date' },
        tier: {
          type: 'string',
          enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
        },
        isActive: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Customer updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCustomerSchema)) dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.STAFF)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a customer (ADMIN, STAFF)' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Customer deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
