import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Campaign, CampaignProduct } from '../campaign/campaign.model';
import { Participation } from '../participation/participation.model';
import { PrizeInventory } from '../prize-config/models/prize_inventory.model';
import { PrizeMapping } from '../prize-config/models/prize_mapping.model';
import { Prize } from '../prize-config/models/prize.model';
import { QrMappingModule } from '../qr-mapping/qr-mapping.module';
import { QrMapping } from '../qr-mapping/models/qr-mapping.model';
import { LeadController } from './lead.controller';
import { LeadService } from './lead.service';
import { Lead } from './models/lead.model';
import { Receipt } from './models/receipt.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Lead,
      Receipt,
      Campaign,
      CampaignProduct,
      QrMapping,
      PrizeMapping,
      PrizeInventory,
      Prize,
      Participation,
    ]),
    QrMappingModule,
  ],
  controllers: [LeadController],
  providers: [LeadService],
  exports: [LeadService],
})
export class LeadModule {}
