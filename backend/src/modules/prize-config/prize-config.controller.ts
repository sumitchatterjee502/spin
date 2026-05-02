import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { CreatePrizeConfigDto } from './dto/create-prize-config.dto';
import { CreatePrizeDto } from './dto/create-prize.dto';
import { PrizeConfigService } from './prize-config.service';

@Controller('admin')
export class PrizeConfigController {
  constructor(private readonly prizeConfigService: PrizeConfigService) {}

  @Get('prizes')
  listPrizes() {
    return this.prizeConfigService.getPrizes();
  }

  @Post('prizes')
  @HttpCode(HttpStatus.CREATED)
  createPrize(@Body() dto: CreatePrizeDto) {
    return this.prizeConfigService.createPrize(dto);
  }

  @Get('prize-config/:campaignId')
  getConfig(@Param('campaignId', ParseIntPipe) campaignId: number) {
    return this.prizeConfigService.getPrizeConfig(campaignId);
  }

  @Post('prize-config')
  @HttpCode(HttpStatus.OK)
  saveConfig(@Body() dto: CreatePrizeConfigDto) {
    return this.prizeConfigService.createOrUpdatePrizeConfig(dto);
  }
}
