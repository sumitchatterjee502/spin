import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateQrFrontendSettingsDto {
  /**
   * Frontend origin used to build QR `redirectUrl` (`{base}/campaign?qr={code}`).
   * Send `null` to clear and use the built-in default base.
   */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === null || value === undefined) {
      return value;
    }
    if (typeof value === 'string') {
      const t = value.trim();
      return t === '' ? null : t;
    }
    return value;
  })
  @ValidateIf((_, v) => v !== null && v !== undefined)
  @IsString()
  @MaxLength(2048)
  @IsUrl({ require_tld: false, protocols: ['http', 'https'] })
  frontendBaseUrl?: string | null;
}
