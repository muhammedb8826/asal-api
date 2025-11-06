import { Type, Transform } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class UpdateGrnItemDto {
  @IsOptional()
  @IsUUID()
  purchaseItemId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantityReceived?: number;

  @IsOptional()
  @IsUUID()
  uomId?: string;

  @IsOptional()
  @IsUUID()
  baseUomId?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateGrnDto {
  @IsOptional()
  @IsString()
  series?: string;

  @IsOptional()
  @IsUUID()
  purchaseId?: string;

  @IsOptional()
  @IsDateString()
  receivedDate?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    const v = String(value).trim();
    return v === '' ? undefined : v;
  })
  @IsUUID()
  receivedBy?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateGrnItemDto)
  items?: UpdateGrnItemDto[];
}
