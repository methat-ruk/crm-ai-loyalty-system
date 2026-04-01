import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AiService } from './ai.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import {
  generateCustomerInsightSchema,
  type GenerateCustomerInsightDto,
} from './dto/generate-insight.dto.js';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Get('provider')
  getProvider() {
    return this.aiService.getProvider();
  }

  @Post('customer-insight')
  generateCustomerInsight(
    @Body(new ZodValidationPipe(generateCustomerInsightSchema))
    dto: GenerateCustomerInsightDto,
  ) {
    return this.aiService.generateCustomerInsight(dto);
  }

  @Post('promo-recommendation')
  generatePromoRecommendation() {
    return this.aiService.generatePromoRecommendation();
  }

  @Get('insights')
  getInsights(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.aiService.getInsights(Number(page) || 1, Number(limit) || 10);
  }
}
