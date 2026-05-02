import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ParticipationController } from './participation.controller';
import { Participation } from './participation.model';
import { ParticipationService } from './participation.service';

@Module({
  imports: [SequelizeModule.forFeature([Participation])],
  controllers: [ParticipationController],
  providers: [ParticipationService],
  exports: [ParticipationService],
})
export class ParticipationModule {}
