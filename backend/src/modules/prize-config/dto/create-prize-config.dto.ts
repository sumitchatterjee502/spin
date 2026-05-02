import { Type } from 'class-transformer';
import { IsArray, IsInt, Min, ValidateNested } from 'class-validator';

export class DistributionLimitsDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPerDay!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPerUser!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  totalLimit!: number;
}

export class PrizeMappingItemDto {
  @Type(() => Number)
  @IsInt()
  productId!: number;

  @Type(() => Number)
  @IsInt()
  prizeId!: number;
}

export class PrizeInventoryItemDto {
  @Type(() => Number)
  @IsInt()
  prizeId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock!: number;
}

export class CreatePrizeConfigDto {
  @Type(() => Number)
  @IsInt()
  campaignId!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrizeMappingItemDto)
  mappings!: PrizeMappingItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrizeInventoryItemDto)
  inventory!: PrizeInventoryItemDto[];

  @ValidateNested()
  @Type(() => DistributionLimitsDto)
  distributionLimits!: DistributionLimitsDto;
}
