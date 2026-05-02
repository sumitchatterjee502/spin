import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize, Transaction } from 'sequelize';
import { Campaign, CampaignProduct } from '../campaign/campaign.model';
import { NotificationService } from '../notification/notification.service';
import { ParticipationStatus } from '../participation/participation-status.enum';
import { Participation } from '../participation/participation.model';
import { PrizeConfig } from '../prize-config/models/prize_config.model';
import { PrizeInventory } from '../prize-config/models/prize_inventory.model';
import { PrizeMapping } from '../prize-config/models/prize_mapping.model';
import { Prize } from '../prize-config/models/prize.model';
import {
  ProbabilityService,
  WeightedProbabilityRow,
} from '../probability/probability.service';
import { SpinOutcome, SpinResult } from './models/spin-result.model';

type WheelSegment = {
  index: number;
  type: 'LOSE' | 'WIN';
  prizeId: number | null;
};
type SpinResponse = {
  participationId: number;
  result: SpinOutcome;
  prize: { id: number; name: string } | null;
  wheelPosition: number;
  stopAngle: number;
  alreadySpun: boolean;
  message: string;
};

@Injectable()
export class SpinService {
  constructor(
    @InjectConnection() private readonly sequelize: Sequelize,
    @InjectModel(Participation)
    private readonly participationModel: typeof Participation,
    @InjectModel(SpinResult)
    private readonly spinResultModel: typeof SpinResult,
    @InjectModel(Campaign) private readonly campaignModel: typeof Campaign,
    @InjectModel(CampaignProduct)
    private readonly campaignProductModel: typeof CampaignProduct,
    @InjectModel(PrizeConfig)
    private readonly prizeConfigModel: typeof PrizeConfig,
    @InjectModel(PrizeMapping)
    private readonly prizeMappingModel: typeof PrizeMapping,
    @InjectModel(PrizeInventory)
    private readonly prizeInventoryModel: typeof PrizeInventory,
    private readonly probabilityService: ProbabilityService,
    private readonly notificationService: NotificationService,
  ) {}

  private readonly spinParticipationAttributes: string[] = [
    'id',
    'userId',
    'campaignId',
    'productId',
    'status',
    'createdAt',
  ];

  async spinWheel(participationId: number): Promise<SpinResponse> {
    const participation = await this.participationModel.findByPk(
      participationId,
      {
        attributes: this.spinParticipationAttributes,
      },
    );
    if (!participation) {
      throw new NotFoundException('Participation not found');
    }

    const existing = await this.spinResultModel.findOne({
      where: { participationId },
      include: [{ model: Prize, attributes: ['id', 'name'] }],
    });
    if (existing) {
      const wheel = await this.getWheelSegment(
        participation.campaignId,
        existing.prizeId,
      );
      return this.buildSpinResponse(participationId, existing, wheel, true);
    }

    const created = await this.sequelize.transaction(async (transaction) => {
      const lockedParticipation = await this.participationModel.findByPk(
        participationId,
        {
          attributes: this.spinParticipationAttributes,
          transaction,
          lock: transaction.LOCK.UPDATE,
        },
      );
      if (!lockedParticipation) {
        throw new NotFoundException('Participation not found');
      }

      if (lockedParticipation.status !== ParticipationStatus.PENDING) {
        throw new ConflictException('Participation already spun');
      }

      await this.validateParticipationScope(lockedParticipation, transaction);

      const weighted = await this.probabilityService.getWeightedProbability(
        lockedParticipation.campaignId,
      );
      if (!weighted.length) {
        throw new InternalServerErrorException(
          'Probability configuration not found for campaign',
        );
      }

      const weightedPrizeId = this.getWeightedResult(weighted);
      let outcome: SpinOutcome = weightedPrizeId
        ? SpinOutcome.WIN
        : SpinOutcome.LOSE;
      let prizeId: number | null = weightedPrizeId;

      if (outcome === SpinOutcome.WIN && prizeId) {
        const isValid = await this.validatePrize({
          participation: lockedParticipation,
          prizeId,
          transaction,
        });
        if (!isValid) {
          outcome = SpinOutcome.LOSE;
          prizeId = null;
        }
      }

      const spinResult = await this.spinResultModel.create(
        {
          participationId: lockedParticipation.id,
          result: outcome,
          prizeId,
        },
        { transaction },
      );

      if (outcome === SpinOutcome.WIN && prizeId) {
        await this.prizeInventoryModel.decrement('stock', {
          by: 1,
          where: {
            campaignId: lockedParticipation.campaignId,
            prizeId,
            stock: { [Op.gte]: 1 },
          },
          transaction,
        });
      }

      await lockedParticipation.update(
        {
          status:
            outcome === SpinOutcome.WIN
              ? ParticipationStatus.WON
              : ParticipationStatus.LOST,
        },
        { transaction },
      );

      return spinResult;
    });

    const hydrated = await this.spinResultModel.findByPk(created.id, {
      include: [{ model: Prize, attributes: ['id', 'name'] }],
    });
    if (!hydrated) {
      throw new InternalServerErrorException('Unable to load spin result');
    }

    const wheel = await this.getWheelSegment(
      participation.campaignId,
      hydrated.prizeId,
    );
    const response = this.buildSpinResponse(
      participationId,
      hydrated,
      wheel,
      false,
    );

    void this.notificationService.sendSpinResultEmail({
      participationId,
      result: response.result,
      prizeName: response.prize?.name,
    });

    return response;
  }

  getWeightedResult(rows: WeightedProbabilityRow[]): number | null {
    const totalWeight = rows.reduce((sum, row) => sum + row.weight, 0);
    if (totalWeight <= 0) {
      return null;
    }

    const random = Math.random() * totalWeight;
    let cumulative = 0;
    for (const row of rows) {
      cumulative += row.weight;
      if (random < cumulative) {
        return row.prizeId;
      }
    }
    return rows[rows.length - 1]?.prizeId ?? null;
  }

  async getWheelSegment(
    campaignId: number,
    prizeId: number | null,
  ): Promise<{ segment: WheelSegment; totalSegments: number }> {
    const segments = await this.getWheelSegments(campaignId);
    if (!segments.length) {
      throw new InternalServerErrorException(
        'Wheel segments are not configured',
      );
    }

    if (prizeId !== null) {
      const target = segments.find(
        (segment) => segment.type === 'WIN' && segment.prizeId === prizeId,
      );
      if (target) {
        return { segment: target, totalSegments: segments.length };
      }
    }

    const fallback =
      segments.find((segment) => segment.type === 'LOSE') ?? segments[0];
    return { segment: fallback, totalSegments: segments.length };
  }

  calculateStopAngle(wheelPosition: number, totalSegments: number): number {
    const anglePerSegment = 360 / totalSegments;
    return Number((anglePerSegment * wheelPosition).toFixed(2));
  }

  private async validateParticipationScope(
    participation: Participation,
    transaction: Transaction,
  ): Promise<void> {
    const [campaign, campaignProduct] = await Promise.all([
      this.campaignModel.findByPk(participation.campaignId, { transaction }),
      this.campaignProductModel.findOne({
        where: {
          campaignId: participation.campaignId,
          productId: participation.productId,
        },
        transaction,
      }),
    ]);

    if (!campaign) {
      throw new NotFoundException('Participation campaign not found');
    }
    if (!campaignProduct) {
      throw new ConflictException(
        'Participation does not belong to campaign product',
      );
    }
  }

  private async validatePrize(input: {
    participation: Participation;
    prizeId: number;
    transaction: Transaction;
  }): Promise<boolean> {
    const { participation, prizeId, transaction } = input;

    const [mapping, inventory, limits] = await Promise.all([
      this.prizeMappingModel.findOne({
        where: {
          campaignId: participation.campaignId,
          productId: participation.productId,
          prizeId,
        },
        transaction,
      }),
      this.prizeInventoryModel.findOne({
        where: { campaignId: participation.campaignId, prizeId },
        transaction,
        lock: transaction?.LOCK.UPDATE,
      }),
      this.prizeConfigModel.findOne({
        where: { campaignId: participation.campaignId },
        transaction,
      }),
    ]);

    if (!mapping || !inventory || inventory.stock <= 0) {
      return false;
    }

    const now = new Date();
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(now);
    dayEnd.setHours(23, 59, 59, 999);

    const [winsForUser, winsForDay] = await Promise.all([
      this.spinResultModel.count({
        where: { prizeId, result: SpinOutcome.WIN },
        include: [
          {
            model: Participation,
            required: true,
            where: {
              campaignId: participation.campaignId,
              userId: participation.userId,
            },
          },
        ],
        transaction,
      }),
      this.spinResultModel.count({
        where: {
          prizeId,
          result: SpinOutcome.WIN,
          createdAt: { [Op.between]: [dayStart, dayEnd] },
        },
        include: [
          {
            model: Participation,
            required: true,
            where: { campaignId: participation.campaignId },
          },
        ],
        transaction,
      }),
    ]);

    if (limits) {
      if (limits.maxPerUser > 0 && winsForUser >= limits.maxPerUser) {
        return false;
      }
      if (limits.maxPerDay > 0 && winsForDay >= limits.maxPerDay) {
        return false;
      }
    }

    return true;
  }

  private async getWheelSegments(campaignId: number): Promise<WheelSegment[]> {
    const mappings = await this.prizeMappingModel.findAll({
      where: { campaignId },
      attributes: ['prizeId'],
      order: [['id', 'ASC']],
    });
    const uniquePrizeIds = [...new Set(mappings.map((row) => row.prizeId))];
    if (!uniquePrizeIds.length) {
      return [
        { index: 0, type: 'LOSE', prizeId: null },
        { index: 1, type: 'LOSE', prizeId: null },
        { index: 2, type: 'LOSE', prizeId: null },
        { index: 3, type: 'LOSE', prizeId: null },
      ];
    }

    const segments: WheelSegment[] = [];
    uniquePrizeIds.forEach((id, segmentIndex) => {
      segments.push({ index: segmentIndex * 2, type: 'LOSE', prizeId: null });
      segments.push({ index: segmentIndex * 2 + 1, type: 'WIN', prizeId: id });
    });
    return segments;
  }

  private buildSpinResponse(
    participationId: number,
    row: SpinResult & { prize?: Prize | null },
    wheel: { segment: WheelSegment; totalSegments: number },
    alreadySpun: boolean,
  ): SpinResponse {
    const wheelSegment = wheel.segment;
    return {
      participationId,
      result: row.result,
      prize: row.prize
        ? {
            id: row.prize.id,
            name: row.prize.name,
          }
        : null,
      wheelPosition: wheelSegment.index,
      stopAngle: this.calculateStopAngle(
        wheelSegment.index,
        wheel.totalSegments,
      ),
      alreadySpun,
      message: 'Thanks for participating. Verification pending.',
    };
  }
}
