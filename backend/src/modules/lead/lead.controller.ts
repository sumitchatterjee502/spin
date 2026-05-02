import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { extname } from 'node:path';
import { Public } from '../../common/decorators/public.decorator';
import { CreateLeadDto } from './dto/create-lead.dto';
import { GetLeadsQueryDto } from './dto/get-leads-query.dto';
import { LeadService } from './lead.service';

const MAX_RECEIPT_FILE_SIZE = 5 * 1024 * 1024;
const RECEIPT_UPLOAD_ROUTE_PREFIX = '/uploads/receipts';
const ALLOWED_RECEIPT_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const sanitizeFilenamePart = (input: string): string =>
  input
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60) || 'receipt';

const extractSafeExtension = (originalName: string): string => {
  const ext = extname(originalName || '').toLowerCase();
  if (ext === '.jpeg' || ext === '.jpg') return '.jpg';
  if (ext === '.png') return '.png';
  if (ext === '.webp') return '.webp';
  if (ext === '.pdf') return '.pdf';
  return '';
};

const multerOptions: MulterOptions = {
  storage: diskStorage({
    destination: './uploads/receipts',
    filename: (_req, file, cb) => {
      const ext = extractSafeExtension(file.originalname);
      const base = sanitizeFilenamePart(
        file.originalname.replace(/\.[^.]*$/, ''),
      );
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${base}-${uniqueSuffix}${ext}`);
    },
  }),
  limits: {
    fileSize: MAX_RECEIPT_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_RECEIPT_MIME_TYPES.has(file.mimetype)) {
      return cb(
        new UnsupportedMediaTypeException(
          'Unsupported file type. Allowed: jpeg, png, webp, pdf',
        ),
        false,
      );
    }
    cb(null, true);
  },
};

@Controller('leads')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Get()
  getLeads(@Query() query: GetLeadsQueryDto) {
    return this.leadService.getLeadsPaginated(query);
  }

  @Public()
  @Get('gifts')
  getGiftItems(@Query('qrCode') qrCode: string) {
    return this.leadService.getGiftItemsByQrCampaignCode(qrCode);
  }

  @Public()
  @Post('submit')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async submitLead(
    @Body() dto: CreateLeadDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('file is required');
    }

    const fileUrl = `http://localhost:3000${RECEIPT_UPLOAD_ROUTE_PREFIX}/${encodeURIComponent(file.filename)}`;
    return this.leadService.createLeadWithReceipt(dto, file, fileUrl);
  }
}
