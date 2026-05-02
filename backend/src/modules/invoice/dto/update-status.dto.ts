import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { INVOICE_STATUSES, type InvoiceStatus } from './filter-invoice.dto';

const TRANSITION_STATUSES = INVOICE_STATUSES.filter((s) => s !== 'APPROVED');

export class UpdateInvoiceStatusDto {
  @Transform(({ value }) => String(value).toUpperCase())
  @IsIn(TRANSITION_STATUSES)
  status!: Exclude<InvoiceStatus, 'APPROVED'>;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  trackingId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  deliveryPartner?: string;
}
