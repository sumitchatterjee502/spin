import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, type Includeable, type WhereOptions } from 'sequelize';
import { Lead } from '../lead/models/lead.model';
import { ParticipationStatus } from '../participation/participation-status.enum';
import { Participation } from '../participation/participation.model';
import { Prize } from '../prize-config/models/prize.model';
import { SpinOutcome, SpinResult } from '../spin/models/spin-result.model';
import {
  type FilterInvoiceDto,
  type InvoiceStatus,
} from './dto/filter-invoice.dto';
import { type UpdateInvoiceStatusDto } from './dto/update-status.dto';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectModel(Participation)
    private readonly participationModel: typeof Participation,
  ) {}

  async getInvoices(filters: FilterInvoiceDto): Promise<{
    success: true;
    data: Array<{
      participationId: number;
      name: string;
      phone: string;
      email: string;
      shopLocation: string;
      prizeName: string | null;
      invoiceNumber: string;
      status: InvoiceStatus;
      verifiedAt: Date | null;
      updatedAt: Date;
    }>;
    meta: { total: number; page: number; limit: number };
  }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const offset = this.applyPagination(page, limit);

    const { rows, count } = await this.participationModel.findAndCountAll({
      where: this.buildQuery(filters),
      include: this.buildIncludes(filters),
      attributes: [
        'id',
        'status',
        'fulfillmentStatus',
        'invoiceNumber',
        'verifiedAt',
        'updatedAt',
      ],
      order: [['updatedAt', 'DESC']],
      offset,
      limit,
      distinct: true,
    });

    return {
      success: true,
      data: rows.map((row) => ({
        participationId: row.id,
        name: row.lead?.name ?? '',
        phone: row.lead?.phone ?? '',
        email: row.lead?.email ?? '',
        shopLocation: row.lead?.shopLocation ?? '',
        prizeName: row.spinResult?.prize?.name ?? null,
        invoiceNumber: row.invoiceNumber ?? '',
        status: this.resolveInvoiceStatus(row),
        verifiedAt: row.verifiedAt ?? null,
        updatedAt: row.updatedAt,
      })),
      meta: { total: count, page, limit },
    };
  }

  async getInvoiceSummary(): Promise<{
    approved: number;
    processing: number;
    dispatched: number;
    delivered: number;
  }> {
    const [approved, processing, dispatched, delivered] = await Promise.all([
      this.participationModel.count({
        where: this.buildStatusWhere('APPROVED'),
        include: this.buildWinnerInclude(),
      }),
      this.participationModel.count({
        where: this.buildStatusWhere('PROCESSING'),
        include: this.buildWinnerInclude(),
      }),
      this.participationModel.count({
        where: this.buildStatusWhere('DISPATCHED'),
        include: this.buildWinnerInclude(),
      }),
      this.participationModel.count({
        where: this.buildStatusWhere('DELIVERED'),
        include: this.buildWinnerInclude(),
      }),
    ]);

    return { approved, processing, dispatched, delivered };
  }

  async updateInvoiceStatus(
    participationId: number,
    dto: UpdateInvoiceStatusDto,
  ): Promise<{ message: string; responseData: { id: number; status: InvoiceStatus } }> {
    const participation = await this.participationModel.findByPk(participationId, {
      include: this.buildWinnerInclude(),
      attributes: [
        'id',
        'status',
        'fulfillmentStatus',
        'invoiceNumber',
        'trackingId',
        'deliveryPartner',
      ],
    });
    if (!participation) {
      throw new NotFoundException('Invoice record not found');
    }
    if (!participation.invoiceNumber) {
      throw new BadRequestException('Invoice number is required before fulfillment');
    }

    const current = this.resolveInvoiceStatus(participation);
    if (!this.isValidTransition(current, dto.status)) {
      throw new ConflictException(
        `Invalid status transition from ${current} to ${dto.status}`,
      );
    }
    if (dto.status === 'DISPATCHED' && (!dto.trackingId || !dto.deliveryPartner)) {
      throw new BadRequestException(
        'trackingId and deliveryPartner are required for DISPATCHED status',
      );
    }

    await participation.update({
      fulfillmentStatus: dto.status,
      status: dto.status as ParticipationStatus,
      trackingId: dto.trackingId?.trim() ?? participation.trackingId,
      deliveryPartner:
        dto.deliveryPartner?.trim() ?? participation.deliveryPartner,
    });

    return {
      message: 'Invoice status updated successfully',
      responseData: {
        id: participation.id,
        status: dto.status,
      },
    };
  }

  private buildQuery(filters: FilterInvoiceDto): WhereOptions<Participation> {
    const statusWhere = this.buildStatusWhere(filters.status);
    const andConditions: WhereOptions<Participation>[] = [
      statusWhere,
      { invoiceNumber: { [Op.ne]: null } },
    ];

    const search = filters.search?.trim();
    if (search) {
      const pattern = `%${search}%`;
      andConditions.push({
        [Op.or]: [
          { '$lead.name$': { [Op.like]: pattern } },
          { '$lead.phone$': { [Op.like]: pattern } },
          { invoiceNumber: { [Op.like]: pattern } },
        ],
      } as WhereOptions<Participation>);
    }

    return { [Op.and]: andConditions } as WhereOptions<Participation>;
  }

  private buildStatusWhere(
    status?: InvoiceStatus,
  ): WhereOptions<Participation> {
    if (!status) {
      return {
        [Op.or]: [
          {
            status: {
              [Op.in]: [
                ParticipationStatus.APPROVED,
                ParticipationStatus.VERIFIED,
                ParticipationStatus.PROCESSING,
                ParticipationStatus.DISPATCHED,
                ParticipationStatus.DELIVERED,
              ],
            },
          },
          {
            fulfillmentStatus: {
              [Op.in]: [
                ParticipationStatus.PROCESSING,
                ParticipationStatus.DISPATCHED,
                ParticipationStatus.DELIVERED,
              ],
            },
          },
        ],
      };
    }

    if (status === 'APPROVED') {
      return {
        [Op.or]: [
          { status: { [Op.in]: [ParticipationStatus.APPROVED, ParticipationStatus.VERIFIED] } },
          { fulfillmentStatus: ParticipationStatus.APPROVED },
        ],
      };
    }

    return {
      [Op.or]: [{ status }, { fulfillmentStatus: status }],
    } as WhereOptions<Participation>;
  }

  private buildIncludes(filters?: FilterInvoiceDto): Includeable[] {
    const storeLocation = filters?.storeLocation?.trim();
    const leadWhere: WhereOptions<Lead>[] = [];
    if (storeLocation) {
      leadWhere.push({ shopLocation: { [Op.like]: `%${storeLocation}%` } });
    }

    return [
      ...this.buildWinnerInclude(),
      {
        model: Lead,
        as: 'lead',
        required: true,
        where: leadWhere.length > 0 ? ({ [Op.and]: leadWhere } as WhereOptions<Lead>) : undefined,
        attributes: ['id', 'name', 'phone', 'email', 'shopLocation'],
      },
    ];
  }

  private buildWinnerInclude(): Includeable[] {
    return [
      {
        model: SpinResult,
        as: 'spinResult',
        required: true,
        where: { result: SpinOutcome.WIN },
        attributes: ['id', 'prizeId'],
        include: [
          {
            model: Prize,
            as: 'prize',
            required: false,
            attributes: ['id', 'name'],
          },
        ],
      },
    ];
  }

  private applyPagination(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  private resolveInvoiceStatus(participation: Participation): InvoiceStatus {
    const raw = participation.fulfillmentStatus ?? participation.status;
    if (raw === ParticipationStatus.VERIFIED || raw === ParticipationStatus.APPROVED) {
      return 'APPROVED';
    }
    if (raw === ParticipationStatus.PROCESSING) return 'PROCESSING';
    if (raw === ParticipationStatus.DISPATCHED) return 'DISPATCHED';
    if (raw === ParticipationStatus.DELIVERED) return 'DELIVERED';
    return 'APPROVED';
  }

  private isValidTransition(
    current: InvoiceStatus,
    next: Exclude<InvoiceStatus, 'APPROVED'>,
  ): boolean {
    const transitions: Record<InvoiceStatus, InvoiceStatus[]> = {
      APPROVED: ['PROCESSING'],
      PROCESSING: ['DISPATCHED'],
      DISPATCHED: ['DELIVERED'],
      DELIVERED: [],
    };
    return transitions[current].includes(next);
  }
}
