import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { randomBytes } from 'node:crypto';
import { UniqueConstraintError } from 'sequelize';
import { Campaign } from '../campaign/campaign.model';
import { CampaignStatus } from '../campaign/campaign-status.enum';
import type { CreateQrMappingDto } from './dto/create-qr-mapping.dto';
import type { UpdateQrMappingDto } from './dto/update-qr-mapping.dto';
import { QrMapping } from './models/qr-mapping.model';
import { QrFrontendSettingsService } from './qr-frontend-settings.service';

const CODE_MAX_ATTEMPTS = 12;

@Injectable()
export class QrMappingService {
  constructor(
    @InjectModel(QrMapping) private readonly qrMappingModel: typeof QrMapping,
    @InjectModel(Campaign) private readonly campaignModel: typeof Campaign,
    private readonly qrFrontendSettingsService: QrFrontendSettingsService,
  ) {}

  private generateCode(): string {
    return randomBytes(12).toString('base64url');
  }

  private async assertActiveCampaign(campaignId: number): Promise<Campaign> {
    const campaign = await this.campaignModel.findByPk(campaignId);
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new BadRequestException(
        'Campaign must be ACTIVE to attach a QR mapping',
      );
    }
    return campaign;
  }

  private isExpired(row: QrMapping): boolean {
    if (!row.expiresAt) {
      return false;
    }
    return row.expiresAt.getTime() <= Date.now();
  }

  private assertCanMutate(row: QrMapping): void {
    if (!row.isActive) {
      throw new ForbiddenException('QR mapping is inactive');
    }
    if (this.isExpired(row)) {
      throw new ForbiddenException('QR mapping has expired');
    }
  }

  async getAllQRMappings(): Promise<{
    message: string;
    responseData: Array<{
      id: number;
      code: string;
      campaignId: number;
      campaignName: string;
      redirectUrl: string;
      isActive: boolean;
      expiresAt: Date | null;
      createdAt: Date;
    }>;
  }> {
    const rows = await this.qrMappingModel.findAll({
      include: [{ model: Campaign, attributes: ['name'] }],
      order: [['id', 'DESC']],
    });
    return {
      message: 'QR mappings retrieved successfully',
      responseData: rows.map((r) => ({
        id: r.id,
        code: r.code,
        campaignId: r.campaignId,
        campaignName: r.campaign?.name ?? '',
        redirectUrl: r.redirectUrl,
        isActive: r.isActive,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
      })),
    };
  }

  async createQRMapping(dto: CreateQrMappingDto): Promise<{
    message: string;
    responseData: {
      id: number;
      code: string;
      campaignId: number;
      redirectUrl: string;
      isActive: boolean;
      expiresAt: Date | null;
    };
  }> {
    await this.assertActiveCampaign(dto.campaignId);

    const code = dto.code?.trim() ?? '';
    if (code.length === 0) {
      let created: QrMapping | null = null;
      for (let i = 0; i < CODE_MAX_ATTEMPTS; i++) {
        const candidate = this.generateCode();
        const exists = await this.qrMappingModel.findOne({
          where: { code: candidate },
        });
        if (exists) {
          continue;
        }
        try {
          created = await this.qrMappingModel.create({
            code: candidate,
            campaignId: dto.campaignId,
            redirectUrl:
              await this.qrFrontendSettingsService.buildRedirectUrlForCode(
                candidate,
              ),
            isActive: true,
            expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          });
          break;
        } catch (err) {
          if (!(err instanceof UniqueConstraintError)) {
            throw err;
          }
        }
      }
      if (!created) {
        throw new ConflictException('Could not allocate a unique QR code');
      }
      return {
        message: 'QR mapping created successfully',
        responseData: {
          id: created.id,
          code: created.code,
          campaignId: created.campaignId,
          redirectUrl: created.redirectUrl,
          isActive: created.isActive,
          expiresAt: created.expiresAt,
        },
      };
    }

    const taken = await this.qrMappingModel.findOne({ where: { code } });
    if (taken) {
      throw new ConflictException('This QR code is already in use');
    }

    try {
      const row = await this.qrMappingModel.create({
        code,
        campaignId: dto.campaignId,
        redirectUrl:
          await this.qrFrontendSettingsService.buildRedirectUrlForCode(code),
        isActive: true,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      });
      return {
        message: 'QR mapping created successfully',
        responseData: {
          id: row.id,
          code: row.code,
          campaignId: row.campaignId,
          redirectUrl: row.redirectUrl,
          isActive: row.isActive,
          expiresAt: row.expiresAt,
        },
      };
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        throw new ConflictException('This QR code is already in use');
      }
      throw err;
    }
  }

  async updateQRMapping(
    id: number,
    dto: UpdateQrMappingDto,
  ): Promise<{
    message: string;
    responseData: {
      id: number;
      code: string;
      campaignId: number;
      redirectUrl: string;
      isActive: boolean;
      expiresAt: Date | null;
    };
  }> {
    const row = await this.qrMappingModel.findByPk(id);
    if (!row) {
      throw new NotFoundException('QR mapping not found');
    }
    this.assertCanMutate(row);

    const hasAny =
      dto.campaignId !== undefined ||
      dto.expiresAt !== undefined ||
      dto.isActive !== undefined;
    if (!hasAny) {
      throw new BadRequestException('No fields provided to update');
    }

    if (dto.campaignId !== undefined) {
      await this.assertActiveCampaign(dto.campaignId);
    }

    const nextExpires =
      dto.expiresAt !== undefined
        ? dto.expiresAt
          ? new Date(dto.expiresAt)
          : null
        : row.expiresAt;
    const nextActive = dto.isActive !== undefined ? dto.isActive : row.isActive;

    await row.update({
      ...(dto.campaignId !== undefined ? { campaignId: dto.campaignId } : {}),
      redirectUrl: await this.qrFrontendSettingsService.buildRedirectUrlForCode(
        row.code,
      ),
      ...(dto.expiresAt !== undefined ? { expiresAt: nextExpires } : {}),
      ...(dto.isActive !== undefined ? { isActive: nextActive } : {}),
    });

    await row.reload();
    return {
      message: 'QR mapping updated successfully',
      responseData: {
        id: row.id,
        code: row.code,
        campaignId: row.campaignId,
        redirectUrl: row.redirectUrl,
        isActive: row.isActive,
        expiresAt: row.expiresAt,
      },
    };
  }

  async deleteQRMapping(id: number): Promise<{
    message: string;
    responseData: null;
  }> {
    const row = await this.qrMappingModel.findByPk(id);
    if (!row) {
      throw new NotFoundException('QR mapping not found');
    }
    if (!row.isActive) {
      return {
        message: 'QR mapping was already inactive',
        responseData: null,
      };
    }
    await row.update({ isActive: false });
    return {
      message: 'QR mapping deleted',
      responseData: null,
    };
  }

  /**
   * Validates and returns redirect URL for a scanned QR code (spin engine / landing).
   */
  async resolveQRCode(code: string): Promise<string> {
    const row = await this.resolveActiveMappingByCode(code);
    return row.redirectUrl;
  }

  async resolveActiveMappingByCode(code: string): Promise<QrMapping> {
    const row = await this.qrMappingModel.findOne({
      where: { code: code.trim() },
      include: [{ model: Campaign }],
    });
    if (!row) {
      throw new NotFoundException('QR code not found');
    }
    if (!row.isActive) {
      throw new ForbiddenException('This QR code is no longer active');
    }
    if (this.isExpired(row)) {
      throw new ForbiddenException('This QR code has expired');
    }
    return row;
  }
}
