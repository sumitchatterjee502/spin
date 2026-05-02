import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const FULFILLMENT_STATUSES = [
  'APPROVED',
  'CONFIRMED',
  'DISPATCHED',
  'DELIVERED',
] as const;

export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

export class FilterFulfillmentDto {
  @IsOptional()
  @Transform(({ value }) => String(value).toUpperCase())
  @IsIn(FULFILLMENT_STATUSES)
  status?: FulfillmentStatus;

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
