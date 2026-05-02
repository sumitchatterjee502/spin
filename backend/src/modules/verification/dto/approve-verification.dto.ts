import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ApproveVerificationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  invoiceNumber!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  remarks!: string;
}
