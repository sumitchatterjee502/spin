import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class SpinRequestDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  participationId!: number;
}
