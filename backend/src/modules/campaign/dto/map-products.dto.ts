import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsInt } from 'class-validator';

export class MapProductsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Type(() => Number)
  productIds!: number[];

  @IsBoolean()
  @Type(() => Boolean)
  replaceExisting!: boolean;
}
