import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './api/auth/auth.module.js';
import { CustomersModule } from './api/customers/customers.module.js';
import { LoyaltyModule } from './api/loyalty/loyalty.module.js';
import { RewardsModule } from './api/rewards/rewards.module.js';
import { AnalyticsModule } from './api/analytics/analytics.module.js';
import { PromotionsModule } from './api/promotions/promotions.module.js';
import { AiModule } from './api/ai/ai.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CustomersModule,
    LoyaltyModule,
    RewardsModule,
    AnalyticsModule,
    PromotionsModule,
    AiModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
