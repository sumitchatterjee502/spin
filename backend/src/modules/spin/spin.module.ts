import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Campaign, CampaignProduct } from '../campaign/campaign.model';
import { NotificationModule } from '../notification/notification.module';
import { Participation } from '../participation/participation.model';
import { PrizeConfig } from '../prize-config/models/prize_config.model';
import { PrizeInventory } from '../prize-config/models/prize_inventory.model';
import { PrizeMapping } from '../prize-config/models/prize_mapping.model';
import { Prize } from '../prize-config/models/prize.model';
import { ProbabilityModule } from '../probability/probability.module';
import { SpinController } from './spin.controller';
import { SpinResult } from './models/spin-result.model';
import { SpinService } from './spin.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      SpinResult,
      Participation,
      Campaign,
      CampaignProduct,
      Prize,
      PrizeConfig,
      PrizeMapping,
      PrizeInventory,
    ]),
    ProbabilityModule,
    NotificationModule,
  ],
  controllers: [SpinController],
  providers: [SpinService],
})
export class SpinModule {}
