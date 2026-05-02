import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Lead } from '../lead/models/lead.model';
import { Receipt } from '../lead/models/receipt.model';
import { Participation } from '../participation/participation.model';
import { Prize } from '../prize-config/models/prize.model';
import { PermissionsGuard } from '../rbac/guards/permissions.guard';
import { RbacModule } from '../rbac/rbac.module';
import { SpinResult } from '../spin/models/spin-result.model';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';

@Module({
  imports: [
    SequelizeModule.forFeature([Participation, SpinResult, Lead, Receipt, Prize]),
    RbacModule,
  ],
  controllers: [VerificationController],
  providers: [VerificationService, PermissionsGuard],
})
export class VerificationModule {}
