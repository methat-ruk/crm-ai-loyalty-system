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

@Controller('promotions')
@UseGuards(JwtAuthGuard)
export class PromotionsController {
  constructor(private promotionsService: PromotionsService) {}

  @Get()
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
  findOne(@Param('id') id: string) {
    return this.promotionsService.findOne(id);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(createCampaignSchema)) dto: CreateCampaignDto,
  ) {
    return this.promotionsService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCampaignSchema)) dto: UpdateCampaignDto,
  ) {
    return this.promotionsService.update(id, dto);
  }

  @Patch(':id/toggle')
  toggle(@Param('id') id: string) {
    return this.promotionsService.toggle(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string) {
    return this.promotionsService.remove(id);
  }
}
