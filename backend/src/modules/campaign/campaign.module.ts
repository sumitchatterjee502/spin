import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Product } from '../product/product.model';
import { QrMappingModule } from '../qr-mapping/qr-mapping.module';
import { CampaignLandingController } from './campaign-landing.controller';
import { CampaignController } from './campaign.controller';
import { CampaignService } from './campaign.service';
import { Campaign, CampaignProduct } from './campaign.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Campaign, CampaignProduct, Product]),
    QrMappingModule,
  ],
  controllers: [CampaignController, CampaignLandingController],
  providers: [CampaignService],
  exports: [CampaignService],
})
export class CampaignModule {}
