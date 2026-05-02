import { Controller, Get, Param, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { SkipStandardResponse } from '../../common/decorators/skip-standard-response.decorator';
import { QrMappingService } from './qr-mapping.service';

@Controller('qr')
export class QrMappingPublicController {
  constructor(private readonly qrMappingService: QrMappingService) {}

  @Public()
  @SkipStandardResponse()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Get(':code')
  async resolve(
    @Param('code') code: string,
    @Res() res: Response,
  ): Promise<void> {
    const url = await this.qrMappingService.resolveQRCode(code);
    res.redirect(302, url);
  }
}
