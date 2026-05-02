import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Lead } from '../lead/models/lead.model';
import { Participation } from '../participation/participation.model';
import { Prize } from '../prize-config/models/prize.model';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RbacModule } from '../rbac/rbac.module';
import { SpinResult } from '../spin/models/spin-result.model';
import { InvoiceController } from './invoice.controller';
import { InvoiceService } from './invoice.service';

@Module({
  imports: [
    SequelizeModule.forFeature([Participation, Lead, SpinResult, Prize]),
    RbacModule,
  ],
  controllers: [InvoiceController],
  providers: [InvoiceService, PermissionsGuard],
})
export class InvoiceModule {}
