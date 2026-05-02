import { Body, Controller, Get, Put } from '@nestjs/common';
import { UpdateQrFrontendSettingsDto } from './dto/update-qr-frontend-settings.dto';
import { QrFrontendSettingsService } from './qr-frontend-settings.service';

@Controller('admin/qr-frontend-settings')
export class QrFrontendSettingsController {
  constructor(
    private readonly qrFrontendSettingsService: QrFrontendSettingsService,
  ) {}

  @Get()
  getSettings() {
    return this.qrFrontendSettingsService.getSettings();
  }

  @Put()
  updateSettings(@Body() dto: UpdateQrFrontendSettingsDto) {
    return this.qrFrontendSettingsService.updateSettings(dto);
  }
}
