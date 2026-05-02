import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Participation } from './participation.model';

@Injectable()
export class ParticipationService {
  constructor(
    @InjectModel(Participation)
    private readonly participationModel: typeof Participation,
  ) {}

  async getByIdOrThrow(participationId: number): Promise<Participation> {
    const participation =
      await this.participationModel.findByPk(participationId);
    if (!participation) {
      throw new NotFoundException('Participation not found');
    }
    return participation;
  }
}
