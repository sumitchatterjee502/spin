import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreatePermissionDto {
  /** Unique key, usually `resource:action` (e.g. `campaign:read`). Stored lowercased. */
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(128)
  @Matches(/^[a-z0-9_-]+:[a-z0-9_.-]+$/i, {
    message:
      'permissionKey must look like resource:action (letters, numbers, _ - and one colon)',
  })
  permissionKey!: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  description?: string;
}
