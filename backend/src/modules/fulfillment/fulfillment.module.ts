import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Lead } from '../lead/models/lead.model';
import { NotificationModule } from '../notification/notification.module';
import { Participation } from '../participation/participation.model';
import { Prize } from '../prize-config/models/prize.model';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RbacModule } from '../rbac/rbac.module';
import { SpinResult } from '../spin/models/spin-result.model';
import { FulfillmentController } from './fulfillment.controller';
import { FulfillmentService } from './fulfillment.service';

@Module({
  imports: [
    SequelizeModule.forFeature([Participation, Lead, SpinResult, Prize]),
    RbacModule,
    NotificationModule,
  ],
  controllers: [FulfillmentController],
  providers: [FulfillmentService, PermissionsGuard],
})
export class FulfillmentModule {}
