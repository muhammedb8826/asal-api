import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  internalNote?: string;

  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  reorderLevel: number;

  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return undefined;
    const v = String(value).trim().toLowerCase();
    if (v === 'true' || v === '1' || v === 'yes' || v === 'on') return true;
    if (v === 'false' || v === '0' || v === 'no' || v === 'off') return false;
    return Boolean(value);
  })
  @IsBoolean()
  canBePurchased?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined) return undefined;
    const v = String(value).trim().toLowerCase();
    if (v === 'true' || v === '1' || v === 'yes' || v === 'on') return true;
    if (v === 'false' || v === '0' || v === 'no' || v === 'off') return false;
    return Boolean(value);
  })
  @IsBoolean()
  canBeSold?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsUUID()
  unitCategoryId?: string;

  @IsOptional()
  @IsUUID()
  defaultUomId?: string;

  @IsOptional()
  @IsUUID()
  purchaseUomId?: string;

  @IsOptional()
  @IsString()
  image?: string;
}
