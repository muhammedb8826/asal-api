import { Type } from 'class-transformer';
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
  @Type(() => Boolean)
  @IsBoolean()
  canBePurchased?: boolean;

  @IsOptional()
  @Type(() => Boolean)
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
