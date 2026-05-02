import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateQrMappingDto } from './dto/create-qr-mapping.dto';
import { UpdateQrMappingDto } from './dto/update-qr-mapping.dto';
import { QrMappingService } from './qr-mapping.service';

@Controller('admin/qr-mappings')
export class QrMappingAdminController {
  constructor(private readonly qrMappingService: QrMappingService) {}

  @Get()
  list() {
    return this.qrMappingService.getAllQRMappings();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateQrMappingDto) {
    return this.qrMappingService.createQRMapping(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateQrMappingDto,
  ) {
    return this.qrMappingService.updateQRMapping(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.qrMappingService.deleteQRMapping(id);
  }
}
