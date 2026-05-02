import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import {
  Op,
  Sequelize,
  Transaction,
  type Includeable,
  type Order,
  type WhereOptions,
} from 'sequelize';
import { Lead } from '../lead/models/lead.model';
import { ParticipationStatus } from '../participation/participation-status.enum';
import { Participation } from '../participation/participation.model';
import { Prize } from '../prize-config/models/prize.model';
import { SpinOutcome, SpinResult } from '../spin/models/spin-result.model';
import { FilterVerificationDto } from './dto/filter-verification.dto';
import { Receipt } from '../lead/models/receipt.model';

@Injectable()
export class VerificationService {
  constructor(
    @InjectConnection() private readonly sequelize: Sequelize,
    @InjectModel(Participation)
    private readonly participationModel: typeof Participation,
    @InjectModel(Receipt)
    private readonly receiptModel: typeof Receipt,
  ) {}

  async getWinningVerificationEntries(filters: FilterVerificationDto): Promise<{
    success: true;
    data: Array<{
      id: number;
      participationId: number;
      name: string;
      phone: string;
      email: string;
      shopLocation: string;
      receiptNumber: string | null;
      fileUrl: string | null;
      status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'VERIFIED' | 'WON' | 'LOST' | 'PROCESSING' | 'DISPATCHED' | 'DELIVERED';
      prize: { id: number; name: string } | null;
      createdAt: Date;
    }>;
    meta: { total: number; page: number; limit: number };
  }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 10;
    const offset = this.applyPagination(page, limit);

    const whereClause = this.buildWinnerQuery(filters);
    const include = this.applySearch(filters);

    const sortBy = filters.sortBy ?? 'createdAt';
    const sortOrder = filters.sortOrder ?? 'DESC';
    const order: Order =
      sortBy === 'name'
        ? [[{ model: Lead, as: 'lead' }, 'name', sortOrder]]
        : [[sortBy, sortOrder]];

    const { rows, count } = await this.participationModel.findAndCountAll({
      where: whereClause,
      include,
      distinct: true,
      order,
      offset,
      limit,
      attributes: ['id', 'status', 'createdAt'],
    });

    const data = rows.map((participation) => {
      const lead = participation.lead!;
      const latestReceipt =
        lead.receipts?.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        )[0] ?? null;
      const winningResult = participation.spinResult!;

      return {
        id: participation.id,
        participationId: participation.id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        shopLocation: lead.shopLocation,
        receiptNumber: latestReceipt?.receiptNumber ?? null,
        fileUrl: latestReceipt?.imageUrl ?? null,
        status: this.mapVerificationStatus(participation.status),
        prize: winningResult.prize
          ? {
              id: winningResult.prize.id,
              name: winningResult.prize.name,
            }
          : null,
        createdAt: participation.createdAt,
      };
    });

    return {
      success: true,
      data,
      meta: {
        total: count,
        page,
        limit,
      },
    };
  }

  async approveSubmission(
    participationId: number,
    dto: { invoiceNumber: string; remarks: string },
  ): Promise<{ message: string; responseData: { id: number; status: string } }> {
    const invoiceNumber = dto.invoiceNumber.trim();
    const remarks = dto.remarks.trim();

    if (!invoiceNumber) {
      throw new BadRequestException('invoiceNumber is required');
    }
    if (!remarks) {
      throw new BadRequestException('remarks is required');
    }

    return this.sequelize.transaction(async (transaction) => {
      const participation = await this.getLockedParticipationForVerification(
        participationId,
        transaction,
      );

      this.ensureWinnerPendingStatus(participation);
      await this.validateInvoiceUniqueness(
        invoiceNumber,
        participation.id,
        transaction,
      );
      await this.validateReceiptUniqueness(participation.userId, transaction);

      await participation.update(
        {
          status: ParticipationStatus.APPROVED,
          invoiceNumber,
          remarks,
          verifiedAt: new Date(),
        },
        { transaction },
      );

      return {
        message: 'Submission approved successfully',
        responseData: {
          id: participation.id,
          status: 'APPROVED',
        },
      };
    });
  }

  async rejectSubmission(
    participationId: number,
    dto: { remarks: string },
  ): Promise<{ message: string; responseData: { id: number; status: string } }> {
    const remarks = dto.remarks.trim();
    if (!remarks) {
      throw new BadRequestException('remarks is required');
    }

    const participation = await this.participationModel.findByPk(participationId, {
      include: [{ model: SpinResult, as: 'spinResult', attributes: ['result'] }],
    });
    if (!participation) {
      throw new NotFoundException('Participation not found');
    }

    this.ensureWinnerPendingStatus(participation);
    await participation.update({
      status: ParticipationStatus.REJECTED,
      remarks,
      verifiedAt: new Date(),
    });

    return {
      message: 'Submission rejected successfully',
      responseData: {
        id: participation.id,
        status: 'REJECTED',
      },
    };
  }

  private buildWinnerQuery(
    filters: FilterVerificationDto,
  ): WhereOptions<Participation> {
    if (filters.fromDate && filters.toDate) {
      const fromTs = new Date(filters.fromDate).getTime();
      const toTs = new Date(filters.toDate).getTime();
      if (fromTs > toTs) {
        throw new BadRequestException('fromDate cannot be after toDate');
      }
    }

    const andClauses: WhereOptions<Participation>[] = [];

    if (filters.status) {
      if (filters.status === 'PENDING') {
        andClauses.push({ status: ParticipationStatus.WON });
      } else if (filters.status === 'APPROVED') {
        andClauses.push({
          status: {
            [Op.in]: [ParticipationStatus.APPROVED, ParticipationStatus.VERIFIED],
          },
        } as WhereOptions<Participation>);
      } else {
        andClauses.push({ status: ParticipationStatus.REJECTED });
      }
    }
    if (filters.fromDate && filters.toDate) {
      andClauses.push({
        createdAt: {
          [Op.between]: [new Date(filters.fromDate), new Date(filters.toDate)],
        },
      });
    } else if (filters.fromDate) {
      andClauses.push({
        createdAt: {
          [Op.gte]: new Date(filters.fromDate),
        },
      });
    } else if (filters.toDate) {
      andClauses.push({
        createdAt: {
          [Op.lte]: new Date(filters.toDate),
        },
      });
    }

    return andClauses.length > 0
      ? ({ [Op.and]: andClauses } as WhereOptions<Participation>)
      : {};
  }

  private applyPagination(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  private applySearch(filters: FilterVerificationDto): Includeable[] {
    const trimmedSearch = filters.search?.trim();
    const trimmedStoreLocation = filters.storeLocation?.trim();
    const leadConditions: WhereOptions<Lead>[] = [];
    if (trimmedSearch) {
      const normalizedSearch = `%${trimmedSearch}%`;
      leadConditions.push({
        [Op.or]: [
          { name: { [Op.like]: normalizedSearch } },
          { phone: { [Op.like]: normalizedSearch } },
          { email: { [Op.like]: normalizedSearch } },
        ],
      } as WhereOptions<Lead>);
    }
    if (trimmedStoreLocation) {
      leadConditions.push({
        shopLocation: { [Op.like]: `%${trimmedStoreLocation}%` },
      } as WhereOptions<Lead>);
    }

    return [
      {
        model: SpinResult,
        as: 'spinResult',
        required: true,
        where: { result: SpinOutcome.WIN },
        attributes: ['id', 'participationId', 'prizeId', 'result'],
        include: [
          {
            model: Prize,
            as: 'prize',
            required: false,
            attributes: ['id', 'name'],
          },
        ],
      },
      {
        model: Lead,
        as: 'lead',
        required: true,
        where:
          leadConditions.length > 0
            ? ({ [Op.and]: leadConditions } as WhereOptions<Lead>)
            : undefined,
        attributes: ['id', 'name', 'phone', 'email', 'shopLocation'],
        include: [
          {
            model: Receipt,
            as: 'receipts',
            required: false,
            attributes: ['id', 'receiptNumber', 'imageUrl', 'createdAt'],
          },
        ],
      },
    ];
  }

  private mapVerificationStatus(
    status: ParticipationStatus,
  ): 'PENDING' | 'APPROVED' | 'REJECTED'| 'VERIFIED' | 'WON' | 'LOST' | 'PROCESSING' | 'DISPATCHED' | 'DELIVERED' {
    if (status === ParticipationStatus.WON) {
      return 'PENDING';
    }
    if (
      status === ParticipationStatus.VERIFIED ||
      status === ParticipationStatus.APPROVED 
    ) {
      return 'APPROVED';
    }
    if (status === ParticipationStatus.REJECTED) {
      return 'REJECTED';
    }
    if (status === ParticipationStatus.PROCESSING) {
      return 'PROCESSING';
    }
    if (status === ParticipationStatus.DISPATCHED) {
      return 'DISPATCHED';
    }
    if (status === ParticipationStatus.DELIVERED) {
      return 'DELIVERED';
    }
    if (status === ParticipationStatus.LOST) {
      return 'LOST';
    }
    return 'REJECTED';
  }

  private async getLockedParticipationForVerification(
    participationId: number,
    transaction: Transaction,
  ): Promise<Participation> {
    const participation = await this.participationModel.findByPk(participationId, {
      include: [{ model: SpinResult, as: 'spinResult', attributes: ['result'] }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!participation) {
      throw new NotFoundException('Participation not found');
    }
    return participation;
  }

  private ensureWinnerPendingStatus(participation: Participation): void {
    if (participation.spinResult?.result !== SpinOutcome.WIN) {
      throw new ConflictException('Only winning users can be verified');
    }
    if (participation.isLocked) {
      throw new ConflictException('Participation is locked for fulfillment');
    }

    const pendingStatuses = [ParticipationStatus.WON, ParticipationStatus.PENDING];
    if (!pendingStatuses.includes(participation.status)) {
      throw new ConflictException('Participation already verified');
    }
  }

  private async validateInvoiceUniqueness(
    invoiceNumber: string,
    participationId: number,
    transaction: Transaction,
  ): Promise<void> {
    const existing = await this.participationModel.findOne({
      where: {
        invoiceNumber,
        id: { [Op.ne]: participationId },
      },
      attributes: ['id'],
      transaction,
    });
    if (existing) {
      throw new ConflictException('Invoice number already used');
    }
  }

  private async validateReceiptUniqueness(
    leadId: number,
    transaction: Transaction,
  ): Promise<void> {
    const receipt = await this.receiptModel.findOne({
      where: { leadId },
      attributes: ['id', 'receiptNumber'],
      transaction,
    });
    if (!receipt) {
      throw new ConflictException('Receipt not found for this participation');
    }

    const duplicateCount = await this.receiptModel.count({
      where: { receiptNumber: receipt.receiptNumber },
      transaction,
    });
    if (duplicateCount > 1) {
      throw new ConflictException('Duplicate receipt detected');
    }
  }
}
