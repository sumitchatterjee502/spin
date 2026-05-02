import { Controller, Get, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { CampaignService } from './campaign.service';

@Controller('campaign')
export class CampaignLandingController {
  constructor(private readonly campaignService: CampaignService) {}

  @Public()
  @Get()
  resolveByQr(@Query('qr') qr: string) {
    return this.campaignService.resolveCampaignByQR(qr);
  }
}
