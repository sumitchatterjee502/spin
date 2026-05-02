import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import * as crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import type { Sequelize, Transaction, WhereOptions } from 'sequelize';
import { Op, UniqueConstraintError } from 'sequelize';
import { CampaignProduct } from '../campaign/campaign.model';
import { ParticipationStatus } from '../participation/participation-status.enum';
import { Participation } from '../participation/participation.model';
import { CampaignStatus } from '../campaign/campaign-status.enum';
import { PrizeInventory } from '../prize-config/models/prize_inventory.model';
import { PrizeMapping } from '../prize-config/models/prize_mapping.model';
import { Prize } from '../prize-config/models/prize.model';
import { QrMappingService } from '../qr-mapping/qr-mapping.service';
import type { CreateLeadDto } from './dto/create-lead.dto';
import type { GetLeadsQueryDto } from './dto/get-leads-query.dto';
import { Lead } from './models/lead.model';
import { Receipt } from './models/receipt.model';

@Injectable()
export class LeadService {
  constructor(
    @InjectConnection() private readonly sequelize: Sequelize,
    @InjectModel(Lead) private readonly leadModel: typeof Lead,
    @InjectModel(Receipt) private readonly receiptModel: typeof Receipt,
    @InjectModel(CampaignProduct)
    private readonly campaignProductModel: typeof CampaignProduct,
    @InjectModel(Participation)
    private readonly participationModel: typeof Participation,
    @InjectModel(PrizeMapping)
    private readonly prizeMappingModel: typeof PrizeMapping,
    @InjectModel(PrizeInventory)
    private readonly prizeInventoryModel: typeof PrizeInventory,
    private readonly qrMappingService: QrMappingService,
  ) {}

  private async checkDuplicateReceipt(
    receiptNumber: string,
    transaction?: Transaction,
  ): Promise<void> {
    const existing = await this.receiptModel.findOne({
      where: { receiptNumber },
      transaction,
      attributes: ['id'],
    });
    if (existing) {
      throw new ConflictException('This receipt number has already been used');
    }
  }

  private normalizeReceiptNumber(value: string): string {
    return value.trim();
  }

  private async generateReceiptHash(
    file: Express.Multer.File,
  ): Promise<string> {
    if (file.buffer?.length) {
      return crypto.createHash('sha256').update(file.buffer).digest('hex');
    }
    if (!file.path) {
      throw new BadRequestException('Invalid receipt file');
    }
    const fileBuffer = await readFile(file.path);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  private async resolveParticipationProductId(
    campaignId: number,
    transaction: Transaction,
  ): Promise<number> {
    const mappedProduct = await this.prizeMappingModel.findOne({
      where: { campaignId },
      attributes: ['productId'],
      order: [['id', 'ASC']],
      transaction,
    });
    if (mappedProduct) {
      return mappedProduct.productId;
    }

    const campaignProduct = await this.campaignProductModel.findOne({
      where: { campaignId },
      attributes: ['productId'],
      order: [['id', 'ASC']],
      transaction,
    });
    if (!campaignProduct) {
      throw new BadRequestException(
        'No campaign product configured for participation',
      );
    }
    return campaignProduct.productId;
  }

  async getGiftItemsByQrCampaignCode(qrCodeRaw: string): Promise<{
    message: string;
    responseData: {
      qrCode: string;
      campaignId: number;
      campaignName: string;
      gifts: Array<{
        prizeId: number;
        prizeName: string;
        stock: number;
        inStock: boolean;
      }>;
    };
  }> {
    const qrCode = qrCodeRaw?.trim();
    if (!qrCode) {
      throw new BadRequestException('qrCode query parameter is required');
    }

    const mapping =
      await this.qrMappingService.resolveActiveMappingByCode(qrCode);
    const campaign = mapping.campaign;
    if (!campaign) {
      throw new BadRequestException('Campaign not found for this QR code');
    }
    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new BadRequestException('Campaign is not active');
    }
    const now = Date.now();
    if (
      campaign.startDate.getTime() > now ||
      campaign.endDate.getTime() < now
    ) {
      throw new BadRequestException('Campaign is out of active date range');
    }

    const mappings = await this.prizeMappingModel.findAll({
      where: { campaignId: campaign.id },
      include: [{ model: Prize, attributes: ['id', 'name'] }],
      order: [['id', 'ASC']],
    });

    const uniquePrizes = new Map<
      number,
      { prizeId: number; prizeName: string }
    >();
    for (const row of mappings) {
      const prize = row.prize;
      if (!prize) {
        continue;
      }
      if (!uniquePrizes.has(prize.id)) {
        uniquePrizes.set(prize.id, {
          prizeId: prize.id,
          prizeName: prize.name,
        });
      }
    }

    const inventoryRows = await this.prizeInventoryModel.findAll({
      where: { campaignId: campaign.id },
      attributes: ['prizeId', 'stock'],
    });
    const stockByPrizeId = new Map<number, number>();
    for (const inv of inventoryRows) {
      stockByPrizeId.set(inv.prizeId, inv.stock);
    }

    const gifts = [...uniquePrizes.values()].map((g) => {
      const stock = stockByPrizeId.get(g.prizeId) ?? 0;
      return { ...g, stock, inStock: stock > 0 };
    });

    return {
      message: 'Gift items fetched successfully',
      responseData: {
        qrCode,
        campaignId: campaign.id,
        campaignName: campaign.name,
        gifts,
      },
    };
  }

  async getLeadsPaginated(query: GetLeadsQueryDto): Promise<{
    message: string;
    responseData: {
      items: Lead[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
      };
    };
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const offset = (page - 1) * limit;

    const andConditions: WhereOptions<Lead>[] = [];
    const trimmedSearch = query.search?.trim();
    if (trimmedSearch) {
      andConditions.push({
        [Op.or]: [
          { name: { [Op.like]: `%${trimmedSearch}%` } },
          { email: { [Op.like]: `%${trimmedSearch}%` } },
          { phone: { [Op.like]: `%${trimmedSearch}%` } },
        ],
      } as WhereOptions<Lead>);
    }
    if (query.campaignId) {
      andConditions.push({ campaignId: query.campaignId });
    }

    const where: WhereOptions<Lead> | undefined =
      andConditions.length > 0
        ? ({ [Op.and]: andConditions } as WhereOptions<Lead>)
        : undefined;

    const { rows, count } = await this.leadModel.findAndCountAll({
      where,
      include: [
        {
          model: Receipt,
          attributes: [
            'id',
            'leadId',
            'userId',
            'imageUrl',
            'receiptNumber',
            'fileType',
            'hash',
            'pHash',
            'isUsed',
            'createdAt',
          ],
          required: false,
        },
      ],
      offset,
      limit,
      order: [['createdAt', 'DESC']],
      distinct: true,
    });

    const totalPages = count === 0 ? 0 : Math.ceil(count / limit);
    return {
      message: 'Leads fetched successfully',
      responseData: {
        items: rows,
        pagination: {
          page,
          limit,
          total: count,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
    };
  }

  async createLeadWithReceipt(
    dto: CreateLeadDto,
    file: Express.Multer.File,
    fileUrl: string,
  ): Promise<{
    message: string;
    responseData: {
      leadId: number;
      participationId: number;
      receiptId: number;
      fileUrl: string;
    };
  }> {
    if (!dto.acceptTerms) {
      throw new BadRequestException(
        'You must accept terms and conditions to continue',
      );
    }

    const receiptNumber = this.normalizeReceiptNumber(dto.receiptNumber);
    const mapping = await this.qrMappingService.resolveActiveMappingByCode(
      dto.qrCode,
    );
    const campaign = mapping.campaign;
    if (!campaign) {
      throw new BadRequestException('Campaign not found for this QR code');
    }
    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new BadRequestException('Campaign is not active');
    }
    const now = Date.now();
    if (
      campaign.startDate.getTime() > now ||
      campaign.endDate.getTime() < now
    ) {
      throw new BadRequestException('Campaign is out of active date range');
    }

    return this.sequelize.transaction(async (transaction) => {
      await this.checkDuplicateReceipt(receiptNumber, transaction);
      const hash = await this.generateReceiptHash(file);

      const existingHash = await this.receiptModel.findOne({
        where: { hash },
        transaction,
        attributes: ['id'],
      });
      if (existingHash) {
        throw new ConflictException('This receipt has already been used');
      }

      const lead = await this.leadModel.create(
        {
          name: dto.name.trim(),
          phone: dto.phone.trim(),
          email: dto.email.trim().toLowerCase(),
          shopLocation: dto.shopLocation.trim(),
          address: dto.address.trim(),
          campaignId: campaign.id,
          qrMappingId: mapping.id,
          acceptTerms: dto.acceptTerms,
        },
        { transaction },
      );

      const productId = await this.resolveParticipationProductId(
        campaign.id,
        transaction,
      );
      const participation = await this.participationModel.create(
        {
          userId: lead.id,
          campaignId: campaign.id,
          productId,
          status: ParticipationStatus.PENDING,
        },
        { transaction },
      );

      try {
        const receipt = await this.receiptModel.create(
          {
            leadId: lead.id,
            imageUrl: fileUrl,
            receiptNumber,
            fileType: file.mimetype,
            hash,
            pHash: null,
            isUsed: false,
          },
          { transaction },
        );

        return {
          message: 'Lead submitted successfully',
          responseData: {
            leadId: lead.id,
            participationId: participation.id,
            receiptId: receipt.id,
            fileUrl: receipt.imageUrl,
          },
        };
      } catch (err) {
        if (err instanceof UniqueConstraintError) {
          throw new ConflictException('This receipt has already been used');
        }
        throw new InternalServerErrorException(
          'Failed to save lead receipt data',
        );
      }
    });
  }
}
