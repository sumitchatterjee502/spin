import { Injectable } from '@nestjs/common';
import * as crypto from 'node:crypto';
import sharp from 'sharp';

@Injectable()
export class HashService {
  generateSHA256(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  async generatePHash(buffer: Buffer): Promise<string | null> {
    try {
      const resized = await sharp(buffer)
        .greyscale()
        .resize(8, 8, { fit: 'fill' })
        .raw()
        .toBuffer();

      const sum = resized.reduce((acc, pixel) => acc + pixel, 0);
      const avg = sum / resized.length;
      const bits = [...resized]
        .map((pixel) => (pixel >= avg ? '1' : '0'))
        .join('');
      return BigInt(`0b${bits}`).toString(16).padStart(16, '0');
    } catch {
      return null;
    }
  }

  compareHashes(hash1: string, hash2: string): number {
    if (hash1.length !== hash2.length) {
      throw new Error('Hashes must have the same length');
    }

    let distance = 0;
    for (let i = 0; i < hash1.length; i += 1) {
      if (hash1[i] !== hash2[i]) {
        distance += 1;
      }
    }
    return distance;
  }
}
