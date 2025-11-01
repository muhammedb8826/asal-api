import { PartialType } from '@nestjs/mapped-types';
import { CreateUomDto } from './create-uom.dto';
import { IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class UpdateUomDto extends PartialType(CreateUomDto) {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  abbreviation?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{1,9}(?:\.\d{1,9})?$/)
  conversionRate?: string;

  @IsOptional()
  @IsUUID()
  unitCategoryId?: string;
}
