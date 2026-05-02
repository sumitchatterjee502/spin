import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { ListCampaignsQueryDto } from './dto/list-campaigns-query.dto';
import { MapProductsDto } from './dto/map-products.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@Controller('campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get()
  getAll(@Query() query: ListCampaignsQueryDto) {
    return this.campaignService.getAllCampaigns(query);
  }

  @Post()
  create(@Body() dto: CreateCampaignDto) {
    return this.campaignService.createCampaign(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.campaignService.updateCampaign(id, dto);
  }

  @Post(':id/products')
  mapProducts(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MapProductsDto,
  ) {
    return this.campaignService.mapProductsToCampaign(id, dto);
  }
}
