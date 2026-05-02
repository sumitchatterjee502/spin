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
import { CreateProbabilityDto } from './dto/create-probability.dto';
import { ProbabilityService } from './probability.service';

@Controller('admin')
export class ProbabilityController {
  constructor(private readonly probabilityService: ProbabilityService) {}

  @Get('probability-config/:campaignId')
  getConfig(@Param('campaignId', ParseIntPipe) campaignId: number) {
    return this.probabilityService.getProbabilityConfig(campaignId);
  }

  @Post('probability-config')
  @HttpCode(HttpStatus.OK)
  saveConfig(@Body() dto: CreateProbabilityDto) {
    return this.probabilityService.createOrUpdateProbability(dto);
  }
}
