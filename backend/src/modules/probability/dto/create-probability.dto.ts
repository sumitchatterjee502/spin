import { Type } from 'class-transformer';
import {
  Allow,
  ArrayMinSize,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';

export class ProbabilityItemDto {
  /** Winning outcome: numeric prize id. Losing outcome: JSON `null` (required on each row). */
  @Allow()
  prizeId!: number | null;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  weight!: number;
}

export class CreateProbabilityDto {
  @Type(() => Number)
  @IsInt()
  campaignId!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProbabilityItemDto)
  probabilities!: ProbabilityItemDto[];
}
