import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import type { Sequelize } from 'sequelize';
import type { UpdateQrFrontendSettingsDto } from './dto/update-qr-frontend-settings.dto';
import {
  QR_FRONTEND_SETTINGS_ROW_ID,
  QrFrontendSettings,
} from './models/qr-frontend-settings.model';
import { QrMapping } from './models/qr-mapping.model';

const DEFAULT_FRONTEND_BASE = 'http://localhost:3000';

@Injectable()
export class QrFrontendSettingsService {
  private readonly logger = new Logger(QrFrontendSettingsService.name);

  constructor(
    @InjectModel(QrFrontendSettings)
    private readonly settingsModel: typeof QrFrontendSettings,
    @InjectModel(QrMapping) private readonly qrMappingModel: typeof QrMapping,
    @InjectConnection() private readonly sequelize: Sequelize,
  ) {}

  private normalizeBase(raw: string | null | undefined): string {
    const t = raw?.trim() ?? '';
    if (!t) {
      return DEFAULT_FRONTEND_BASE.replace(/\/$/, '');
    }
    return t.replace(/\/$/, '');
  }

  composeCampaignRedirectUrl(base: string, code: string): string {
    const b = base.replace(/\/$/, '');
    return `${b}/campaign?qr=${encodeURIComponent(code)}`;
  }

  async getEffectiveBaseUrl(): Promise<string> {
    const row = await this.settingsModel.findByPk(QR_FRONTEND_SETTINGS_ROW_ID);
    return this.normalizeBase(row?.frontendBaseUrl ?? null);
  }

  async getSettings(): Promise<{
    message: string;
    responseData: {
      frontendBaseUrl: string | null;
      effectiveFrontendBaseUrl: string;
    };
  }> {
    const row = await this.ensureRow();
    const saved = row.frontendBaseUrl?.trim() ?? null;
    return {
      message: 'QR frontend settings retrieved successfully',
      responseData: {
        frontendBaseUrl: saved,
        effectiveFrontendBaseUrl: this.normalizeBase(saved),
      },
    };
  }

  async updateSettings(dto: UpdateQrFrontendSettingsDto): Promise<{
    message: string;
    responseData: {
      frontendBaseUrl: string | null;
      effectiveFrontendBaseUrl: string;
      qrMappingsUpdated: number;
    };
  }> {
    if (!('frontendBaseUrl' in dto)) {
      throw new BadRequestException(
        'frontendBaseUrl is required (string URL, or null to reset to default)',
      );
    }

    const normalizedSaved =
      dto.frontendBaseUrl === null || dto.frontendBaseUrl === undefined
        ? null
        : dto.frontendBaseUrl.trim().replace(/\/$/, '') || null;

    await this.ensureRow();

    const effective = this.normalizeBase(normalizedSaved);

    const t = await this.sequelize.transaction();
    try {
      await this.settingsModel.update(
        { frontendBaseUrl: normalizedSaved },
        { where: { id: QR_FRONTEND_SETTINGS_ROW_ID }, transaction: t },
      );

      const mappings = await this.qrMappingModel.findAll({
        attributes: ['id', 'code'],
        transaction: t,
      });

      for (const m of mappings) {
        await this.qrMappingModel.update(
          {
            redirectUrl: this.composeCampaignRedirectUrl(effective, m.code),
          },
          { where: { id: m.id }, transaction: t },
        );
      }

      await t.commit();

      this.logger.log(
        `QR frontend base updated; refreshed redirectUrl on ${mappings.length} mapping(s)`,
      );

      return {
        message: 'QR frontend base URL saved and mapping redirects refreshed',
        responseData: {
          frontendBaseUrl: normalizedSaved,
          effectiveFrontendBaseUrl: effective,
          qrMappingsUpdated: mappings.length,
        },
      };
    } catch (e) {
      await t.rollback();
      throw e;
    }
  }

  /** Builds redirect URL for a QR code using the currently effective base. */
  async buildRedirectUrlForCode(code: string): Promise<string> {
    const base = await this.getEffectiveBaseUrl();
    return this.composeCampaignRedirectUrl(base, code);
  }

  private async ensureRow(): Promise<QrFrontendSettings> {
    const existing = await this.settingsModel.findByPk(
      QR_FRONTEND_SETTINGS_ROW_ID,
    );
    if (existing) {
      return existing;
    }
    return this.settingsModel.create({
      id: QR_FRONTEND_SETTINGS_ROW_ID,
      frontendBaseUrl: null,
    });
  }
}
