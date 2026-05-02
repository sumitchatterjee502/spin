import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Campaign } from '../campaign/campaign.model';
import { Prize } from '../prize-config/models/prize.model';
import { Probability } from './models/probability.model';
import { ProbabilityController } from './probability.controller';
import { ProbabilityService } from './probability.service';

@Module({
  imports: [SequelizeModule.forFeature([Probability, Campaign, Prize])],
  controllers: [ProbabilityController],
  providers: [ProbabilityService],
  exports: [ProbabilityService],
})
export class ProbabilityModule {}
