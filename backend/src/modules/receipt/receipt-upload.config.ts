import { UnsupportedMediaTypeException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { memoryStorage } from 'multer';

const MAX_RECEIPT_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_RECEIPT_MIME_TYPES = new Set(['image/jpeg', 'image/png']);

export const receiptUploadMulterOptions: MulterOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: MAX_RECEIPT_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_RECEIPT_MIME_TYPES.has(file.mimetype)) {
      return cb(
        new UnsupportedMediaTypeException(
          'Unsupported file type. Allowed: jpeg, png',
        ),
        false,
      );
    }
    cb(null, true);
  },
};
