import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Campaign } from '../campaign/campaign.model';
import { QrFrontendSettings } from './models/qr-frontend-settings.model';
import { QrMapping } from './models/qr-mapping.model';
import { QrFrontendSettingsController } from './qr-frontend-settings.controller';
import { QrFrontendSettingsService } from './qr-frontend-settings.service';
import { QrMappingAdminController } from './qr-mapping-admin.controller';
import { QrMappingPublicController } from './qr-mapping-public.controller';
import { QrMappingService } from './qr-mapping.service';

@Module({
  imports: [
    SequelizeModule.forFeature([QrMapping, Campaign, QrFrontendSettings]),
  ],
  controllers: [
    QrMappingAdminController,
    QrMappingPublicController,
    QrFrontendSettingsController,
  ],
  providers: [QrMappingService, QrFrontendSettingsService],
  exports: [QrMappingService, QrFrontendSettingsService],
})
export class QrMappingModule {}
