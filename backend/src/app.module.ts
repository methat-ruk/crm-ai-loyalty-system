import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './api/auth/auth.module.js';
import { UsersModule } from './api/users/users.module.js';
import { CustomersModule } from './api/customers/customers.module.js';
import { LoyaltyModule } from './api/loyalty/loyalty.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CustomersModule,
    LoyaltyModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
