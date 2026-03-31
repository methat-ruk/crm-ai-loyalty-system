import { Module } from '@nestjs/common';
import { RewardsController } from './rewards.controller.js';
import { RewardsService } from './rewards.service.js';
import { LoyaltyModule } from '../loyalty/loyalty.module.js';

@Module({
  imports: [LoyaltyModule],
  controllers: [RewardsController],
  providers: [RewardsService],
})
export class RewardsModule {}
