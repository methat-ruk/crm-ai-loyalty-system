import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { AiService } from './ai.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import {
  generateCustomerInsightSchema,
  type GenerateCustomerInsightDto,
} from './dto/generate-insight.dto.js';

@ApiTags('AI Insights')
@ApiBearerAuth('access-token')
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Get('provider')
  @ApiOperation({ summary: 'Get current AI provider info' })
  @ApiResponse({ status: 200, description: 'AI provider name and model' })
  getProvider() {
    return this.aiService.getProvider();
  }

  @Post('customer-insight')
  @ApiOperation({ summary: 'Generate AI insight for a customer' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['customerId'],
      properties: {
        customerId: { type: 'string', example: 'cuid...' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'AI-generated insight text' })
  generateCustomerInsight(
    @Body(new ZodValidationPipe(generateCustomerInsightSchema))
    dto: GenerateCustomerInsightDto,
  ) {
    return this.aiService.generateCustomerInsight(dto);
  }

  @Post('promo-recommendation')
  @ApiOperation({ summary: 'Generate AI promotion recommendation' })
  @ApiResponse({
    status: 201,
    description: 'AI-generated promotion recommendations',
  })
  generatePromoRecommendation() {
    return this.aiService.generatePromoRecommendation();
  }

  @Get('insights')
  @ApiOperation({ summary: 'List saved AI insights (paginated)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiResponse({ status: 200, description: 'Paginated list of AI insights' })
  getInsights(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.aiService.getInsights(Number(page) || 1, Number(limit) || 10);
  }
}
