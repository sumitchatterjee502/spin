import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ConfirmWinnerDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  address?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  remarks!: string;
}
