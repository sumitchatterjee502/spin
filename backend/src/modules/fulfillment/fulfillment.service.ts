import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, type Includeable, type WhereOptions } from 'sequelize';
import { Lead } from '../lead/models/lead.model';
import { NotificationService } from '../notification/notification.service';
import { ParticipationStatus } from '../participation/participation-status.enum';
import { Participation } from '../participation/participation.model';
import { Prize } from '../prize-config/models/prize.model';
import { SpinOutcome, SpinResult } from '../spin/models/spin-result.model';
import { ConfirmWinnerDto } from './dto/confirm-winner.dto';
import { DispatchPrizeDto } from './dto/dispatch-prize.dto';
import {
  FilterFulfillmentDto,
  type FulfillmentStatus,
} from './dto/filter-fulfillment.dto';

@Injectable()
export class FulfillmentService {
  constructor(
    @InjectModel(Participation)
    private readonly participationModel: typeof Participation,
    private readonly notificationService: NotificationService,
  ) {}

  async getFulfillmentEntries(filters: FilterFulfillmentDto): Promise<{
    success: true;
    data: Array<{
      participationId: number;
      name: string;
      prizeName: string | null;
      status: FulfillmentStatus;
      invoiceNumber: string;
      address: string | null;
      slaStatus: 'WITHIN_SLA' | 'BREACHED' | 'NOT_STARTED';
      confirmedAt: Date | null;
      dispatchDate: Date | null;
      deliveryDate: Date | null;
      trackingId: string | null;
      deliveryPartner: string | null;
      updatedAt: Date;
    }>;
    meta: { total: number; page: number; limit: number };
  }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const offset = (page - 1) * limit;

    const { rows, count } = await this.participationModel.findAndCountAll({
      where: this.buildQuery(filters),
      include: this.buildIncludes(filters),
      attributes: [
        'id',
        'status',
        'invoiceNumber',
        'address',
        'confirmedAt',
        'dispatchDate',
        'deliveryDate',
        'trackingId',
        'deliveryPartner',
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
        prizeName: row.spinResult?.prize?.name ?? null,
        status: this.resolveFulfillmentStatus(row.status),
        invoiceNumber: row.invoiceNumber ?? '',
        address: row.address ?? null,
        slaStatus: this.calculateSLAStatus(row),
        confirmedAt: row.confirmedAt ?? null,
        dispatchDate: row.dispatchDate ?? null,
        deliveryDate: row.deliveryDate ?? null,
        trackingId: row.trackingId ?? null,
        deliveryPartner: row.deliveryPartner ?? null,
        updatedAt: row.updatedAt,
      })),
      meta: { total: count, page, limit },
    };
  }

  async confirmWinner(
    participationId: number,
    dto: ConfirmWinnerDto,
  ): Promise<{ message: string; responseData: { id: number; status: string } }> {
    const participation = await this.participationModel.findByPk(participationId, {
      include: this.buildWinnerIncludes(),
      attributes: [
        'id',
        'status',
        'invoiceNumber',
        'address',
        'isLocked',
        'confirmedAt',
      ],
    });
    if (!participation) throw new NotFoundException('Participation not found');
    if (
      ![ParticipationStatus.APPROVED, ParticipationStatus.VERIFIED].includes(
        participation.status,
      )
    ) {
      throw new ConflictException('Only approved winners can be confirmed');
    }
    if (participation.isLocked) {
      throw new ConflictException('Participation already locked');
    }

    const address = dto.address?.trim() ?? participation.address;
    if (!address) throw new BadRequestException('address is required');

    await participation.update({
      status: ParticipationStatus.CONFIRMED,
      address,
      remarks: dto.remarks.trim(),
      confirmedAt: new Date(),
      isLocked: true,
    });

    const lead = participation.lead;
    void this.sendConfirmationEmail({
      email: lead?.email,
      name: lead?.name ?? 'Winner',
      participationId: participation.id,
      prizeName: participation.spinResult?.prize?.name ?? null,
    });

    return {
      message: 'Winner confirmed successfully',
      responseData: { id: participation.id, status: ParticipationStatus.CONFIRMED },
    };
  }

  async dispatchPrize(
    participationId: number,
    dto: DispatchPrizeDto,
  ): Promise<{ message: string; responseData: { id: number; status: string } }> {
    const participation = await this.participationModel.findByPk(participationId, {
      include: this.buildWinnerIncludes(),
      attributes: ['id', 'status', 'isLocked'],
    });
    if (!participation) throw new NotFoundException('Participation not found');
    if (participation.status !== ParticipationStatus.CONFIRMED) {
      throw new ConflictException('Only confirmed winners can be dispatched');
    }

    await participation.update({
      status: ParticipationStatus.DISPATCHED,
      dispatchDate: new Date(dto.dispatchDate),
      trackingId: dto.trackingId?.trim() ?? null,
      deliveryPartner: dto.deliveryPartner?.trim() ?? null,
    });

    return {
      message: 'Prize dispatched successfully',
      responseData: { id: participation.id, status: ParticipationStatus.DISPATCHED },
    };
  }

  async markAsDelivered(
    participationId: number,
  ): Promise<{ message: string; responseData: { id: number; status: string } }> {
    const participation = await this.participationModel.findByPk(participationId, {
      include: this.buildWinnerIncludes(),
      attributes: ['id', 'status'],
    });
    if (!participation) throw new NotFoundException('Participation not found');
    if (participation.status !== ParticipationStatus.DISPATCHED) {
      throw new ConflictException('Only dispatched winners can be delivered');
    }

    await participation.update({
      status: ParticipationStatus.DELIVERED,
      deliveryDate: new Date(),
    });

    return {
      message: 'Prize marked as delivered',
      responseData: { id: participation.id, status: ParticipationStatus.DELIVERED },
    };
  }

  private calculateSLAStatus(
    participation: Participation,
  ): 'WITHIN_SLA' | 'BREACHED' | 'NOT_STARTED' {
    if (!participation.confirmedAt) return 'NOT_STARTED';
    let workingDays = 0;
    const cursor = new Date(participation.confirmedAt);
    const today = new Date();

    while (cursor < today) {
      cursor.setDate(cursor.getDate() + 1);
      const day = cursor.getDay();
      if (day !== 0 && day !== 6) {
        workingDays += 1;
      }
    }
    return workingDays <= 5 ? 'WITHIN_SLA' : 'BREACHED';
  }

  private async sendConfirmationEmail(input: {
    email?: string;
    name: string;
    participationId: number;
    prizeName: string | null;
  }): Promise<void> {
    await this.notificationService.sendFulfillmentConfirmationEmail(input);
  }

  private buildQuery(filters: FilterFulfillmentDto): WhereOptions<Participation> {
    const andConditions: WhereOptions<Participation>[] = [
      {
        status: {
          [Op.in]: [
            ParticipationStatus.APPROVED,
            ParticipationStatus.VERIFIED,
            ParticipationStatus.CONFIRMED,
            ParticipationStatus.DISPATCHED,
            ParticipationStatus.DELIVERED,
          ],
        },
      } as WhereOptions<Participation>,
    ];

    if (filters.status) {
      if (filters.status === 'APPROVED') {
        andConditions.push({
          status: { [Op.in]: [ParticipationStatus.APPROVED, ParticipationStatus.VERIFIED] },
        } as WhereOptions<Participation>);
      } else {
        andConditions.push({ status: filters.status as ParticipationStatus });
      }
    }

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

  private buildIncludes(filters?: FilterFulfillmentDto): Includeable[] {
    const leadWhere: WhereOptions<Lead>[] = [];
    const store = filters?.storeLocation?.trim();
    if (store) {
      leadWhere.push({ shopLocation: { [Op.like]: `%${store}%` } });
    }

    return [
      ...this.buildWinnerIncludes(),
      {
        model: Lead,
        as: 'lead',
        required: true,
        where:
          leadWhere.length > 0
            ? ({ [Op.and]: leadWhere } as WhereOptions<Lead>)
            : undefined,
        attributes: ['id', 'name', 'phone', 'email', 'shopLocation'],
      },
    ];
  }

  private buildWinnerIncludes(): Includeable[] {
    return [
      {
        model: SpinResult,
        as: 'spinResult',
        required: true,
        where: { result: SpinOutcome.WIN },
        attributes: ['id', 'prizeId', 'result'],
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

  private resolveFulfillmentStatus(status: ParticipationStatus): FulfillmentStatus {
    if ([ParticipationStatus.APPROVED, ParticipationStatus.VERIFIED].includes(status)) {
      return 'APPROVED';
    }
    if (status === ParticipationStatus.CONFIRMED) return 'CONFIRMED';
    if (status === ParticipationStatus.DISPATCHED) return 'DISPATCHED';
    if (status === ParticipationStatus.DELIVERED) return 'DELIVERED';
    return 'APPROVED';
  }
}
