import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateQrMappingDto {
  /** Optional; if omitted a random URL-safe code is generated. */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @IsString()
  @MaxLength(64)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'code must be alphanumeric (hyphen/underscore allowed)',
  })
  code?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  campaignId!: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
