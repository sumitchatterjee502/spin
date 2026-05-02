import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize, UniqueConstraintError } from 'sequelize';
import { Campaign, CampaignProduct } from '../campaign/campaign.model';
import type { CreatePrizeConfigDto } from './dto/create-prize-config.dto';
import type { CreatePrizeDto } from './dto/create-prize.dto';
import { Prize } from './models/prize.model';
import { PrizeConfig } from './models/prize_config.model';
import { PrizeInventory } from './models/prize_inventory.model';
import { PrizeMapping } from './models/prize_mapping.model';

@Injectable()
export class PrizeConfigService {
  constructor(
    @InjectConnection() private readonly sequelize: Sequelize,
    @InjectModel(Campaign) private readonly campaignModel: typeof Campaign,
    @InjectModel(CampaignProduct)
    private readonly campaignProductModel: typeof CampaignProduct,
    @InjectModel(Prize) private readonly prizeModel: typeof Prize,
    @InjectModel(PrizeConfig)
    private readonly prizeConfigModel: typeof PrizeConfig,
    @InjectModel(PrizeMapping)
    private readonly prizeMappingModel: typeof PrizeMapping,
    @InjectModel(PrizeInventory)
    private readonly prizeInventoryModel: typeof PrizeInventory,
  ) {}

  async getPrizes(): Promise<{
    message: string;
    responseData: Array<{ id: number; name: string }>;
  }> {
    const rows = await this.prizeModel.findAll({ order: [['id', 'ASC']] });
    return {
      message: 'Prizes retrieved successfully',
      responseData: rows.map((r) => ({ id: r.id, name: r.name })),
    };
  }

  async createPrize(dto: CreatePrizeDto): Promise<{
    message: string;
    responseData: { id: number; name: string };
  }> {
    if (!dto.name.trim()) {
      throw new BadRequestException('name is required');
    }
    try {
      const row = await this.prizeModel.create({ name: dto.name.trim() });
      return {
        message: 'Prize created successfully',
        responseData: { id: row.id, name: row.name },
      };
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException('A prize with this name already exists');
      }
      throw err;
    }
  }

  async getPrizeConfig(campaignId: number): Promise<{
    message: string;
    responseData: {
      campaignId: number;
      mappings: Array<{ productId: number; prizeId: number }>;
      inventory: Array<{ prizeId: number; stock: number }>;
      distributionLimits: {
        maxPerDay: number;
        maxPerUser: number;
        totalLimit: number;
      };
    };
  }> {
    const campaign = await this.campaignModel.findByPk(campaignId);
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const [cfg, mappings, inventory] = await Promise.all([
      this.prizeConfigModel.findOne({ where: { campaignId } }),
      this.prizeMappingModel.findAll({
        where: { campaignId },
        attributes: ['productId', 'prizeId'],
        order: [['id', 'ASC']],
      }),
      this.prizeInventoryModel.findAll({
        where: { campaignId },
        attributes: ['prizeId', 'stock'],
        order: [['id', 'ASC']],
      }),
    ]);

    return {
      message: 'Prize configuration retrieved successfully',
      responseData: {
        campaignId,
        mappings: mappings.map((m) => ({
          productId: m.productId,
          prizeId: m.prizeId,
        })),
        inventory: inventory.map((i) => ({
          prizeId: i.prizeId,
          stock: i.stock,
        })),
        distributionLimits: cfg
          ? {
              maxPerDay: cfg.maxPerDay,
              maxPerUser: cfg.maxPerUser,
              totalLimit: cfg.totalLimit,
            }
          : { maxPerDay: 0, maxPerUser: 0, totalLimit: 0 },
      },
    };
  }

  private assertDistributionRules(limits: {
    maxPerDay: number;
    maxPerUser: number;
    totalLimit: number;
  }): void {
    const { maxPerDay, maxPerUser, totalLimit } = limits;
    if (maxPerUser > totalLimit) {
      throw new BadRequestException(
        'maxPerUser must be less than or equal to totalLimit',
      );
    }
    if (maxPerDay > totalLimit) {
      throw new BadRequestException(
        'maxPerDay must be less than or equal to totalLimit',
      );
    }
  }

  async createOrUpdatePrizeConfig(dto: CreatePrizeConfigDto): Promise<{
    message: string;
    responseData: Awaited<
      ReturnType<PrizeConfigService['getPrizeConfig']>
    >['responseData'];
  }> {
    const { campaignId, mappings, inventory, distributionLimits } = dto;
    this.assertDistributionRules(distributionLimits);

    const productIds = mappings.map((m) => m.productId);
    const uniqueProductIds = new Set(productIds);
    if (uniqueProductIds.size !== productIds.length) {
      throw new BadRequestException('Duplicate productId in mappings');
    }

    const prizeIdsFromMappings = new Set(mappings.map((m) => m.prizeId));
    const inventoryPrizeIds = new Set(inventory.map((i) => i.prizeId));

    for (const pid of prizeIdsFromMappings) {
      if (!inventoryPrizeIds.has(pid)) {
        throw new BadRequestException(
          `Each mapped prize must have an inventory row (missing prizeId ${pid})`,
        );
      }
    }
    for (const pid of inventoryPrizeIds) {
      if (!prizeIdsFromMappings.has(pid)) {
        throw new BadRequestException(
          `Inventory contains prizeId ${pid} which is not mapped from any product in this payload`,
        );
      }
    }

    const campaign = await this.campaignModel.findByPk(campaignId);
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (productIds.length > 0) {
      const linked = await this.campaignProductModel.findAll({
        where: { campaignId, productId: { [Op.in]: productIds } },
        attributes: ['productId'],
      });
      const linkedSet = new Set(linked.map((r) => r.productId));
      if (linkedSet.size !== uniqueProductIds.size) {
        throw new BadRequestException(
          'One or more productIds are not linked to this campaign',
        );
      }
    }

    const allPrizeIds = [...prizeIdsFromMappings];
    if (allPrizeIds.length > 0) {
      const prizeCount = await this.prizeModel.count({
        where: { id: { [Op.in]: allPrizeIds } },
      });
      if (prizeCount !== allPrizeIds.length) {
        throw new NotFoundException('One or more prizeIds do not exist');
      }
    }

    try {
      await this.sequelize.transaction(async (transaction) => {
        const existing = await this.prizeConfigModel.findOne({
          where: { campaignId },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (existing) {
          await existing.update(
            {
              maxPerDay: distributionLimits.maxPerDay,
              maxPerUser: distributionLimits.maxPerUser,
              totalLimit: distributionLimits.totalLimit,
            },
            { transaction },
          );
        } else {
          await this.prizeConfigModel.create(
            {
              campaignId,
              maxPerDay: distributionLimits.maxPerDay,
              maxPerUser: distributionLimits.maxPerUser,
              totalLimit: distributionLimits.totalLimit,
            },
            { transaction },
          );
        }

        await this.prizeMappingModel.destroy({
          where: { campaignId },
          transaction,
        });
        if (mappings.length > 0) {
          await this.prizeMappingModel.bulkCreate(
            mappings.map((m) => ({
              campaignId,
              productId: m.productId,
              prizeId: m.prizeId,
            })),
            { transaction },
          );
        }

        await this.prizeInventoryModel.destroy({
          where: { campaignId },
          transaction,
        });
        if (inventory.length > 0) {
          await this.prizeInventoryModel.bulkCreate(
            inventory.map((i) => ({
              campaignId,
              prizeId: i.prizeId,
              stock: i.stock,
            })),
            { transaction },
          );
        }
      });
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException(
          'Mapping or inventory constraint violation (duplicate product mapping or inventory row)',
        );
      }
      throw err;
    }

    const refreshed = await this.getPrizeConfig(campaignId);
    return {
      message: 'Prize configuration saved successfully',
      responseData: refreshed.responseData,
    };
  }
}
