import { IsDateString, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { CampaignStatus } from '../campaign-status.enum';

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsEnum(CampaignStatus)
  status!: CampaignStatus;
}
