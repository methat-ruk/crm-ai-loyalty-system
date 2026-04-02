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
import { PromotionsService } from './promotions.service.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import {
  createCampaignSchema,
  type CreateCampaignDto,
} from './dto/create-campaign.dto.js';
import {
  updateCampaignSchema,
  type UpdateCampaignDto,
} from './dto/update-campaign.dto.js';

@ApiTags('Promotions')
@ApiBearerAuth('access-token')
@Controller('promotions')
@UseGuards(JwtAuthGuard)
export class PromotionsController {
  constructor(private promotionsService: PromotionsService) {}

  @Get()
  @ApiOperation({ summary: 'List campaigns with filtering and pagination' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['POINTS_MULTIPLIER', 'BONUS_POINTS', 'DISCOUNT', 'FREE_REWARD'],
  })
  @ApiQuery({ name: 'isActive', required: false, enum: ['true', 'false'] })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Paginated campaign list' })
  findAll(
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const activeFilter =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.promotionsService.findAll(
      search,
      type,
      activeFilter,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get campaign detail by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Campaign detail' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  findOne(@Param('id') id: string) {
    return this.promotionsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new campaign' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'type', 'startDate', 'endDate'],
      properties: {
        name: { type: 'string', example: 'Summer Double Points' },
        description: { type: 'string' },
        type: {
          type: 'string',
          enum: [
            'POINTS_MULTIPLIER',
            'BONUS_POINTS',
            'DISCOUNT',
            'FREE_REWARD',
          ],
        },
        pointsMultiplier: { type: 'number', example: 2.0 },
        bonusPoints: { type: 'integer', example: 500 },
        startDate: {
          type: 'string',
          format: 'date-time',
          example: '2026-06-01T00:00:00.000Z',
        },
        endDate: {
          type: 'string',
          format: 'date-time',
          example: '2026-08-31T23:59:59.000Z',
        },
        isActive: { type: 'boolean', default: true },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Campaign created' })
  create(
    @Body(new ZodValidationPipe(createCampaignSchema)) dto: CreateCampaignDto,
  ) {
    return this.promotionsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a campaign' })
  @ApiParam({ name: 'id' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        type: {
          type: 'string',
          enum: [
            'POINTS_MULTIPLIER',
            'BONUS_POINTS',
            'DISCOUNT',
            'FREE_REWARD',
          ],
        },
        pointsMultiplier: { type: 'number' },
        bonusPoints: { type: 'integer' },
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
        isActive: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Campaign updated' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCampaignSchema)) dto: UpdateCampaignDto,
  ) {
    return this.promotionsService.update(id, dto);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: 'Toggle campaign active/inactive status' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Campaign status toggled' })
  toggle(@Param('id') id: string) {
    return this.promotionsService.toggle(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a campaign' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Campaign deleted' })
  @ApiResponse({ status: 404, description: 'Campaign not found' })
  remove(@Param('id') id: string) {
    return this.promotionsService.remove(id);
  }
}
