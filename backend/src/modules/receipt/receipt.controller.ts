import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { UploadReceiptDto } from './dto/upload-receipt.dto';
import { receiptUploadMulterOptions } from './receipt-upload.config';
import { ReceiptService } from './receipt.service';

@Controller('receipt')
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService) {}

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', receiptUploadMulterOptions))
  async uploadReceipt(
    @Body() dto: UploadReceiptDto,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() request: Request,
  ) {
    const userId = request.user?.id;
    if (!userId) {
      throw new BadRequestException('Authenticated user is required');
    }
    if (!file) {
      throw new BadRequestException('file is required');
    }
    return this.receiptService.uploadReceipt(dto, file, userId);
  }
}
