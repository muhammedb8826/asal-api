import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class CreatePurchaseItemDto {
  @IsUUID()
  productId: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantity: number;

  @Type(() => Number)
  @IsNumber()
  unitPrice: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  uomId: string;

  @IsUUID()
  baseUomId: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  unit?: number; // Server computes from UOM conversion rates
}

export class CreatePurchaseDto {
  @IsOptional()
  @IsString()
  series?: string; // Optional; server auto-generates if not provided

  @IsUUID()
  supplierId: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsOptional()
  @IsDateString()
  orderDate?: string;

  @IsString()
  paymentMethod: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsUUID()
  purchaserId?: string; // Optional; can be extracted from authenticated user

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemDto)
  items: CreatePurchaseItemDto[];
}
