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

export class CreateApInvoiceItemDto {
  @IsUUID()
  purchaseItemId: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantity: number;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  unitPrice: number;

  @IsUUID()
  uomId: string;

  @IsUUID()
  baseUomId: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateApInvoiceDto {
  @IsOptional()
  @IsString()
  series?: string;

  @IsUUID()
  supplierId: string;

  @IsOptional()
  @IsUUID()
  purchaseId?: string;

  @IsOptional()
  @IsDateString()
  invoiceDate?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  supplierInvoiceNumber?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  paymentTerms?: number; // Payment terms in days

  @IsOptional()
  @IsString()
  status?: string; // DRAFT, POSTED (defaults to DRAFT)

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateApInvoiceItemDto)
  items: CreateApInvoiceItemDto[];
}
