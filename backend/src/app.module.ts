import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './api/auth/auth.module';
import { UsersModule } from './api/users/users.module';
import { CustomersModule } from './api/customers/customers.module';
import { LoyaltyModule } from './api/loyalty/loyalty.module';

@Module({
  imports: [AuthModule, UsersModule, CustomersModule, LoyaltyModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
