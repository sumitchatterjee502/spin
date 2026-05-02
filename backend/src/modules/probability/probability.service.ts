import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize, UniqueConstraintError } from 'sequelize';
import { Campaign } from '../campaign/campaign.model';
import { Prize } from '../prize-config/models/prize.model';
import type { CreateProbabilityDto } from './dto/create-probability.dto';
import { Probability } from './models/probability.model';

export type WeightedProbabilityRow = {
  prizeId: number | null;
  weight: number;
};

@Injectable()
export class ProbabilityService {
  constructor(
    @InjectConnection() private readonly sequelize: Sequelize,
    @InjectModel(Campaign) private readonly campaignModel: typeof Campaign,
    @InjectModel(Prize) private readonly prizeModel: typeof Prize,
    @InjectModel(Probability)
    private readonly probabilityModel: typeof Probability,
  ) {}

  /**
   * Ordered rows for spin engine weighted selection.
   */
  async getWeightedProbability(
    campaignId: number,
  ): Promise<WeightedProbabilityRow[]> {
    const rows = await this.probabilityModel.findAll({
      where: { campaignId },
      attributes: ['prizeId', 'weight'],
      order: [['id', 'ASC']],
    });
    return rows.map((r) => ({
      prizeId: r.prizeId,
      weight: r.weight,
    }));
  }

  async getProbabilityConfig(campaignId: number): Promise<{
    message: string;
    responseData: {
      campaignId: number;
      probabilities: WeightedProbabilityRow[];
    };
  }> {
    const campaign = await this.campaignModel.findByPk(campaignId);
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    const probabilities = await this.getWeightedProbability(campaignId);
    return {
      message: 'Probability configuration retrieved successfully',
      responseData: { campaignId, probabilities },
    };
  }

  private validateProbabilityRules(
    items: ReadonlyArray<{ prizeId: number | null; weight: number }>,
  ): void {
    for (const r of items) {
      if (!('prizeId' in r)) {
        throw new BadRequestException(
          'Each probability entry must include prizeId (number or null for lose)',
        );
      }
      if (r.prizeId !== null && r.prizeId !== undefined) {
        if (
          typeof r.prizeId !== 'number' ||
          !Number.isInteger(r.prizeId) ||
          r.prizeId < 1
        ) {
          throw new BadRequestException(
            'prizeId must be a positive integer or null (lose outcome)',
          );
        }
      }
      if (!Number.isInteger(r.weight) || r.weight < 0) {
        throw new BadRequestException('weight must be a non-negative integer');
      }
    }

    const total = items.reduce((s, r) => s + r.weight, 0);
    if (total !== 100) {
      throw new BadRequestException(
        `Sum of weights must equal 100 (current total: ${total})`,
      );
    }

    const nullRows = items.filter((r) => r.prizeId === null);
    if (nullRows.length !== 1) {
      throw new BadRequestException(
        'Exactly one losing outcome is required (one entry with prizeId null)',
      );
    }

    const winPositive = items.some((r) => r.prizeId !== null && r.weight > 0);
    if (!winPositive) {
      throw new BadRequestException(
        'At least one winning prize (non-null prizeId) must have weight greater than 0',
      );
    }

    const prizeKeys = items.map((r) =>
      r.prizeId === null || r.prizeId === undefined
        ? '__lose__'
        : String(r.prizeId),
    );
    const unique = new Set(prizeKeys);
    if (unique.size !== items.length) {
      throw new BadRequestException(
        'Duplicate prizeId in probabilities (including lose row)',
      );
    }
  }

  async createOrUpdateProbability(dto: CreateProbabilityDto): Promise<{
    message: string;
    responseData: {
      campaignId: number;
      probabilities: WeightedProbabilityRow[];
    };
  }> {
    const { campaignId, probabilities } = dto;

    this.validateProbabilityRules(probabilities);

    const campaign = await this.campaignModel.findByPk(campaignId);
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const prizeIds = probabilities
      .map((p) => p.prizeId)
      .filter((id): id is number => id !== null);

    if (prizeIds.length > 0) {
      const count = await this.prizeModel.count({
        where: { id: { [Op.in]: prizeIds } },
      });
      if (count !== new Set(prizeIds).size) {
        throw new NotFoundException('One or more prizeIds do not exist');
      }
    }

    try {
      await this.sequelize.transaction(async (transaction) => {
        await this.probabilityModel.destroy({
          where: { campaignId },
          transaction,
        });
        await this.probabilityModel.bulkCreate(
          probabilities.map((p) => ({
            campaignId,
            prizeId: p.prizeId === null ? null : p.prizeId,
            weight: p.weight,
          })),
          { transaction },
        );
      });
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException(
          'Duplicate probability row for this campaign and prize',
        );
      }
      throw err;
    }

    const refreshed = await this.getWeightedProbability(campaignId);
    return {
      message: 'Probability configuration saved successfully',
      responseData: { campaignId, probabilities: refreshed },
    };
  }
}
