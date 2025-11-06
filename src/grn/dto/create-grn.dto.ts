import { Type, Transform } from 'class-transformer';
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

export class CreateGrnItemDto {
  @IsUUID()
  purchaseItemId: string; // Link to PurchaseItems

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantityReceived: number; // Quantity received in selected UOM

  @IsUUID()
  uomId: string; // UOM used for receiving

  @IsUUID()
  baseUomId: string; // Base UOM (should match purchase item's baseUomId)

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateGrnDto {
  @IsOptional()
  @IsString()
  series?: string; // Optional; server auto-generates if not provided (GRN-0001)

  @IsUUID()
  purchaseId: string; // Link to Purchase

  @IsOptional()
  @IsDateString()
  receivedDate?: string; // Defaults to current date

  @IsOptional()
  @IsString()
  status?: string; // Defaults to 'PENDING'

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    const v = String(value).trim();
    return v === '' ? undefined : v;
  })
  @IsUUID()
  receivedBy?: string; // userId

  @IsOptional()
  @IsString()
  note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGrnItemDto)
  @IsNotEmpty()
  items: CreateGrnItemDto[];
}
