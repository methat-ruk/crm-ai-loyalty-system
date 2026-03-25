import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CustomersModule } from './customers/customers.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [AuthModule, UsersModule, CustomersModule, LoyaltyModule, AiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
