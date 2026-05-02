import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize, UniqueConstraintError, WhereOptions } from 'sequelize';
import { Product } from '../product/product.model';
import { QrMappingService } from '../qr-mapping/qr-mapping.service';
import { CampaignStatus } from './campaign-status.enum';
import { Campaign, CampaignProduct } from './campaign.model';
import type { CreateCampaignDto } from './dto/create-campaign.dto';
import type { ListCampaignsQueryDto } from './dto/list-campaigns-query.dto';
import type { MapProductsDto } from './dto/map-products.dto';
import type { UpdateCampaignDto } from './dto/update-campaign.dto';

@Injectable()
export class CampaignService {
  constructor(
    @InjectConnection() private readonly sequelize: Sequelize,
    @InjectModel(Campaign) private readonly campaignModel: typeof Campaign,
    @InjectModel(CampaignProduct)
    private readonly campaignProductModel: typeof CampaignProduct,
    @InjectModel(Product) private readonly productModel: typeof Product,
    private readonly qrMappingService: QrMappingService,
  ) {}

  private assertValidDateRange(start: Date, end: Date): void {
    if (end.getTime() <= start.getTime()) {
      throw new BadRequestException('endDate must be greater than startDate');
    }
  }

  private sanitizeLikeTerm(term: string): string {
    return term.replace(/[%_\\]/g, '');
  }

  private toCampaignRow(c: Campaign) {
    return {
      id: c.id,
      name: c.name,
      startDate: c.startDate,
      endDate: c.endDate,
      status: c.status,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      products: (c.products ?? []).map((p) => ({ id: p.id, name: p.name })),
    };
  }

  async resolveCampaignByQR(qrCodeRaw: string): Promise<{
    message: string;
    responseData: {
      campaignId: number;
      campaignName: string;
      branding: { primary: string; secondary: string };
      offer: string;
    };
  }> {
    const qrCode = qrCodeRaw?.trim();
    if (!qrCode) {
      throw new BadRequestException('qr query parameter is required');
    }

    const mapping =
      await this.qrMappingService.resolveActiveMappingByCode(qrCode);
    const campaign = mapping.campaign;
    if (!campaign) {
      throw new NotFoundException('Campaign not found for this QR code');
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

    return {
      message: 'Campaign resolved successfully',
      responseData: {
        campaignId: campaign.id,
        campaignName: campaign.name,
        branding: {
          primary: campaign.name,
          secondary: 'Spin Wheel Campaign',
        },
        offer: 'Spin the Wheel & Win Exciting Prizes',
      },
    };
  }

  async getAllCampaigns(query?: ListCampaignsQueryDto): Promise<unknown> {
    const where: WhereOptions<Campaign> = {};
    if (query?.status) {
      where.status = query.status;
    }
    if (query?.search?.trim()) {
      const term = this.sanitizeLikeTerm(query.search.trim());
      if (term.length > 0) {
        where.name = { [Op.like]: `%${term}%` };
      }
    }

    const include = [
      {
        model: Product,
        through: { attributes: [] },
        required: false,
      },
    ];

    const usePagination =
      query?.page !== undefined || query?.limit !== undefined;
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 20;

    if (usePagination) {
      // Count and find separately: `findAndCountAll` + `distinct` + `col` breaks MySQL
      // when counting with BelongsToMany includes (invalid aggregate SQL).
      const total = await this.campaignModel.count({ where });
      const rows = await this.campaignModel.findAll({
        where,
        include,
        limit,
        offset: (page - 1) * limit,
        order: [['createdAt', 'DESC']],
      });
      return {
        message: 'Campaigns retrieved successfully',
        responseData: {
          campaigns: rows.map((c) => this.toCampaignRow(c)),
          total,
          page,
          limit,
        },
      };
    }

    const rows = await this.campaignModel.findAll({
      where,
      include,
      order: [['createdAt', 'DESC']],
    });
    return {
      message: 'Campaigns retrieved successfully',
      responseData: { campaigns: rows.map((c) => this.toCampaignRow(c)) },
    };
  }

  async createCampaign(dto: CreateCampaignDto): Promise<unknown> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    this.assertValidDateRange(startDate, endDate);

    const trimmedName = dto.name.trim();
    if (!trimmedName) {
      throw new BadRequestException('name is required');
    }

    try {
      const campaign = await this.campaignModel.create({
        name: trimmedName,
        startDate,
        endDate,
        status: dto.status,
      });
      await campaign.reload({
        include: [
          { model: Product, through: { attributes: [] }, required: false },
        ],
      });
      return {
        message: 'Campaign created successfully',
        responseData: this.toCampaignRow(campaign),
      };
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException('A campaign with this name already exists');
      }
      throw err;
    }
  }

  async updateCampaign(id: number, dto: UpdateCampaignDto): Promise<unknown> {
    const campaign = await this.campaignModel.findByPk(id);
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const hasAny =
      dto.name !== undefined ||
      dto.startDate !== undefined ||
      dto.endDate !== undefined ||
      dto.status !== undefined;
    if (!hasAny) {
      throw new BadRequestException('No fields provided to update');
    }

    const startDate =
      dto.startDate !== undefined
        ? new Date(dto.startDate)
        : campaign.startDate;
    const endDate =
      dto.endDate !== undefined ? new Date(dto.endDate) : campaign.endDate;
    this.assertValidDateRange(startDate, endDate);

    let nextName: string | undefined;
    if (dto.name !== undefined) {
      nextName = dto.name.trim();
      if (!nextName) {
        throw new BadRequestException('name cannot be empty');
      }
    }

    try {
      await campaign.update({
        ...(nextName !== undefined ? { name: nextName } : {}),
        ...(dto.startDate !== undefined ? { startDate } : {}),
        ...(dto.endDate !== undefined ? { endDate } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      });
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException('A campaign with this name already exists');
      }
      throw err;
    }

    await campaign.reload({
      include: [
        { model: Product, through: { attributes: [] }, required: false },
      ],
    });
    return {
      message: 'Campaign updated successfully',
      responseData: this.toCampaignRow(campaign),
    };
  }

  async mapProductsToCampaign(
    campaignId: number,
    dto: MapProductsDto,
  ): Promise<unknown> {
    const campaign = await this.campaignModel.findByPk(campaignId);
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const uniqueIds = [...new Set(dto.productIds)];
    const found = await this.productModel.findAll({
      where: { id: { [Op.in]: uniqueIds } },
      attributes: ['id'],
    });
    if (found.length !== uniqueIds.length) {
      throw new BadRequestException('One or more productIds do not exist');
    }

    await this.sequelize.transaction(async (transaction) => {
      if (dto.replaceExisting) {
        await this.campaignProductModel.destroy({
          where: { campaignId },
          transaction,
        });
      }
      await this.campaignProductModel.bulkCreate(
        uniqueIds.map((productId) => ({ campaignId, productId })),
        { transaction, ignoreDuplicates: true },
      );
    });

    await campaign.reload({
      include: [
        { model: Product, through: { attributes: [] }, required: false },
      ],
    });
    return {
      message: 'Products mapped to campaign successfully',
      responseData: this.toCampaignRow(campaign),
    };
  }
}
