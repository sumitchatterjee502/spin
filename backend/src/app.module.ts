import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import * as winston from 'winston';
import { utilities, WinstonModule } from 'nest-winston';
import { AppController } from './app.controller';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { StandardResponseInterceptor } from './common/interceptors/standard-response.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { CampaignModule } from './modules/campaign/campaign.module';
import { FraudModule } from './modules/fraud/fraud.module';
import { FulfillmentModule } from './modules/fulfillment/fulfillment.module';
import { LeadModule } from './modules/lead/lead.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ParticipationModule } from './modules/participation/participation.module';
import { PrizeConfigModule } from './modules/prize-config/prize-config.module';
import { ProbabilityModule } from './modules/probability/probability.module';
import { QrMappingModule } from './modules/qr-mapping/qr-mapping.module';
import { ProductModule } from './modules/product/product.module';
import { SpinModule } from './modules/spin/spin.module';
import { VerificationModule } from './modules/verification/verification.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { ReceiptModule } from './modules/receipt/receipt.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: validateEnv,
    }),
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            utilities.format.nestLike('SpinPlatform', {
              colors: true,
              prettyPrint: true,
            }),
          ),
        }),
      ],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 30,
      },
    ]),
    DatabaseModule,
    RbacModule,
    AuthModule,
    CampaignModule,
    ProductModule,
    PrizeConfigModule,
    ProbabilityModule,
    QrMappingModule,
    LeadModule,
    InvoiceModule,
    ParticipationModule,
    SpinModule,
    FraudModule,
    VerificationModule,
    FulfillmentModule,
    NotificationModule,
    ReceiptModule,
  ],
  controllers: [AppController],
  providers: [
    JwtAuthGuard,
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: StandardResponseInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
