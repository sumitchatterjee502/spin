import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { Op, UniqueConstraintError } from 'sequelize';
import { User } from '../rbac/entities/user.entity';
import { Receipt } from '../lead/models/receipt.model';
import { HashService } from './hash.service';
import type { UploadReceiptDto } from './dto/upload-receipt.dto';

const RECEIPT_UPLOAD_ROUTE_PREFIX = '/uploads/receipts';
const PHASH_DUPLICATE_THRESHOLD = 8;

@Injectable()
export class ReceiptService {
  private readonly logger = new Logger(ReceiptService.name);

  constructor(
    @InjectModel(Receipt) private readonly receiptModel: typeof Receipt,
    @InjectModel(User) private readonly userModel: typeof User,
    private readonly hashService: HashService,
  ) {}

  private extractSafeExtension(originalName: string, mimeType: string): string {
    const ext = extname(originalName || '').toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg' || mimeType === 'image/jpeg') {
      return '.jpg';
    }
    if (ext === '.png' || mimeType === 'image/png') {
      return '.png';
    }
    return '';
  }

  private logDuplicateAttempt(
    reason: 'sha256' | 'phash',
    userId: number,
    hash: string,
  ): void {
    this.logger.warn(
      `Duplicate receipt upload attempt detected (${reason}) | userId=${userId} | hash=${hash} | timestamp=${new Date().toISOString()}`,
    );
  }

  private async ensureUserExists(
    userId: number,
  ): Promise<Pick<User, 'id' | 'email'>> {
    const user = await this.userModel.findByPk(userId, {
      attributes: ['id', 'email'],
    });
    if (!user) {
      throw new BadRequestException('Invalid user');
    }
    return user;
  }

  private async uploadToLocalStorage(
    file: Express.Multer.File,
    hash: string,
  ): Promise<string> {
    const uploadsDir = join(process.cwd(), 'uploads', 'receipts');
    await mkdir(uploadsDir, { recursive: true });
    const ext = this.extractSafeExtension(file.originalname, file.mimetype);
    const fileName = `${Date.now()}-${hash.slice(0, 16)}-${randomUUID()}${ext}`;
    const fullPath = join(uploadsDir, fileName);
    await writeFile(fullPath, file.buffer);
    return `${RECEIPT_UPLOAD_ROUTE_PREFIX}/${encodeURIComponent(fileName)}`;
  }

  async uploadReceipt(
    dto: UploadReceiptDto,
    file: Express.Multer.File,
    userId: number,
  ): Promise<{ success: true; receiptId: number }> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('file is required');
    }

    const user = await this.ensureUserExists(userId);
    if (dto.email !== user.email) {
      throw new BadRequestException(
        'Uploaded receipt email must match authenticated user',
      );
    }
    const hash = this.hashService.generateSHA256(file.buffer);

    const existing = await this.receiptModel.findOne({
      where: { hash },
      attributes: ['id'],
    });
    if (existing) {
      this.logDuplicateAttempt('sha256', userId, hash);
      throw new BadRequestException('This receipt has already been used');
    }

    const pHash = await this.hashService.generatePHash(file.buffer);
    if (pHash) {
      const pHashCandidates = await this.receiptModel.findAll({
        where: { pHash: { [Op.not]: null } },
        attributes: ['id', 'pHash'],
      });
      for (const candidate of pHashCandidates) {
        if (!candidate.pHash) continue;
        const distance = this.hashService.compareHashes(candidate.pHash, pHash);
        if (distance <= PHASH_DUPLICATE_THRESHOLD) {
          this.logDuplicateAttempt('phash', userId, hash);
          throw new BadRequestException('This receipt has already been used');
        }
      }
    }

    const imageUrl = await this.uploadToLocalStorage(file, hash);
    try {
      const receipt = await this.receiptModel.create({
        userId,
        imageUrl,
        hash,
        pHash,
        isUsed: false,
        receiptNumber: `${dto.mobile}-${Date.now()}`,
        fileType: file.mimetype,
      });
      return {
        success: true,
        receiptId: receipt.id,
      };
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        this.logDuplicateAttempt('sha256', userId, hash);
        throw new BadRequestException('This receipt has already been used');
      }
      throw new InternalServerErrorException('Failed to save receipt');
    }
  }
}
