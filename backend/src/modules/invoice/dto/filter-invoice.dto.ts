import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const INVOICE_STATUSES = [
  'APPROVED',
  'PROCESSING',
  'DISPATCHED',
  'DELIVERED',
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export class FilterInvoiceDto {
  @IsOptional()
  @Transform(({ value }) => String(value).toUpperCase())
  @IsIn(INVOICE_STATUSES)
  status?: InvoiceStatus;

  @IsOptional()
  @IsString()
  storeLocation?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
