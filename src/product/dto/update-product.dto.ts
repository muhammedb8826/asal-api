import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsString()
  image?: string;

  // Ensure booleans from multipart/form-data are transformed correctly on update
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
}
