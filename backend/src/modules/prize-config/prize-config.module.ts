import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Campaign, CampaignProduct } from '../campaign/campaign.model';
import { Product } from '../product/product.model';
import { Prize } from './models/prize.model';
import { PrizeConfig } from './models/prize_config.model';
import { PrizeInventory } from './models/prize_inventory.model';
import { PrizeMapping } from './models/prize_mapping.model';
import { PrizeConfigController } from './prize-config.controller';
import { PrizeConfigService } from './prize-config.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Campaign,
      CampaignProduct,
      Product,
      Prize,
      PrizeConfig,
      PrizeMapping,
      PrizeInventory,
    ]),
  ],
  controllers: [PrizeConfigController],
  providers: [PrizeConfigService],
  exports: [PrizeConfigService],
})
export class PrizeConfigModule {}
